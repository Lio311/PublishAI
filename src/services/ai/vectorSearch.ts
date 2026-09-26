/**
 * Vector search and embedding utilities with timeout protection,
 * model fallbacks, UUID validation, and indirect prompt injection defense.
 */

import { embed } from "ai";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { db } from "@/services/db";
import { sql } from "drizzle-orm";
import { withRateLimitRetry, withTimeout } from "./rateLimiter";
import { DEFAULT_OPENAI_EMBEDDING_MODEL_NAME, FALLBACK_OPENAI_EMBEDDING_MODELS } from "./provider";
import { sanitizePromptInput, redactApiKeys } from "./promptSanitizer";

export interface GenerateEmbeddingOptions {
  modelName?: string;
  fallbackModels?: string[];
  maxRetries?: number;
  timeoutMs?: number;
  maxTextLength?: number;
  apiKey?: string;
}

export interface RetrievedChunk {
  id?: string;
  documentId?: string;
  content: string;
  similarityScore?: number;
}

export interface VectorSearchOptions {
  documentId?: string;
  paperId?: number | string;
  queryEmbedding: number[];
  limit?: number;
  timeoutMs?: number;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Generate embeddings safely with rate-limit retry, model fallbacks, input length truncation,
 * and hard timeout protection to prevent hanging calls.
 */
export async function generateSafeEmbedding(
  text: string,
  options: GenerateEmbeddingOptions = {}
): Promise<{ embedding: number[]; modelUsed: string } | null> {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    console.warn("[generateSafeEmbedding] Empty or invalid input text provided.");
    return null;
  }

  // OpenAI embedding models have an 8191 token window (~32k characters).
  // Truncate to a safe character boundary (default 8,000 chars) to prevent payload errors.
  const maxChars = options.maxTextLength ?? 8000;
  const sanitizedText = text.slice(0, maxChars).trim();

  const primaryModel = options.modelName || DEFAULT_OPENAI_EMBEDDING_MODEL_NAME;
  const fallbackModels = options.fallbackModels || FALLBACK_OPENAI_EMBEDDING_MODELS;
  const candidateModels = Array.from(new Set([primaryModel, ...fallbackModels]));

  const maxRetries = options.maxRetries ?? 2;
  const timeoutMs = options.timeoutMs ?? 8000;
  const embeddingProvider = options.apiKey ? createOpenAI({ apiKey: options.apiKey }) : openai;

  for (let i = 0; i < candidateModels.length; i++) {
    const model = candidateModels[i];
    try {
      const result = await withTimeout(
        withRateLimitRetry(
          () =>
            embed({
              model: embeddingProvider.embedding(model),
              value: sanitizedText,
            }),
          { operationName: `generateSafeEmbedding(${model})`, maxRetries }
        ),
        timeoutMs,
        `Embedding generation with ${model}`
      );

      if (
        result?.embedding &&
        Array.isArray(result.embedding) &&
        result.embedding.length > 0 &&
        typeof result.embedding[0] === "number"
      ) {
        return { embedding: result.embedding, modelUsed: model };
      }
    } catch (err: any) {
      const safeErrMsg = redactApiKeys(err?.message || String(err));
      console.warn(
        `[generateSafeEmbedding] Embedding failed on model "${model}": ${safeErrMsg}. Attempting fallback...`
      );
    }
  }

  console.error("[generateSafeEmbedding] All candidate embedding models exhausted or failed.");
  return null;
}

/**
 * Performs vector similarity search over document_chunks with pgvector.
 * Features:
 * - Query timeout protection (default 5000ms).
 * - Dimension & format validation for query embedding.
 * - Safe handling of document UUID vs paper ID integer.
 * - Indirect prompt injection sanitization of retrieved text.
 * - Graceful degradation (returns [] on timeout/DB error instead of crashing).
 */
export async function searchDocumentChunks(
  options: VectorSearchOptions
): Promise<RetrievedChunk[]> {
  const { documentId, paperId, queryEmbedding, limit = 5, timeoutMs = 5000 } = options;

  // 1. Validate query embedding
  if (
    !queryEmbedding ||
    !Array.isArray(queryEmbedding) ||
    queryEmbedding.length === 0 ||
    queryEmbedding.some((n) => typeof n !== "number" || isNaN(n))
  ) {
    console.warn("[searchDocumentChunks] Invalid or empty query embedding provided.");
    return [];
  }

  // Neon pgvector schema specifies 1536 dimensions
  if (queryEmbedding.length !== 1536) {
    console.warn(
      `[searchDocumentChunks] Embedding dimension mismatch: expected 1536, got ${queryEmbedding.length}.`
    );
    return [];
  }

  const safeLimit = Math.max(1, Math.min(limit, 50));
  const vectorStr = JSON.stringify(queryEmbedding);

  try {
    let queryPromise: Promise<any>;

    // 2. Safe query construction based on UUID vs Paper ID
    const isDocUuid = documentId && UUID_REGEX.test(documentId);
    const numericPaperId = paperId !== undefined && !isNaN(Number(paperId)) ? Number(paperId) : null;

    if (isDocUuid) {
      queryPromise = db.execute(sql`
        SELECT id, document_id as "documentId", content,
               (1 - (embedding <=> ${vectorStr}::vector)) as similarity
        FROM document_chunks 
        WHERE document_id = ${documentId}::uuid 
          AND embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorStr}::vector 
        LIMIT ${safeLimit}
      `);
    } else if (numericPaperId !== null) {
      queryPromise = db.execute(sql`
        SELECT dc.id, dc.document_id as "documentId", dc.content,
               (1 - (dc.embedding <=> ${vectorStr}::vector)) as similarity
        FROM document_chunks dc
        JOIN documents d ON d.id = dc.document_id
        WHERE d.paper_id = ${numericPaperId}
          AND dc.embedding IS NOT NULL
        ORDER BY dc.embedding <=> ${vectorStr}::vector 
        LIMIT ${safeLimit}
      `);
    } else if (documentId) {
      // documentId passed but not a standard UUID (could be integer or legacy ID)
      const parsedId = Number(documentId);
      if (!isNaN(parsedId)) {
        queryPromise = db.execute(sql`
          SELECT dc.id, dc.document_id as "documentId", dc.content,
                 (1 - (dc.embedding <=> ${vectorStr}::vector)) as similarity
          FROM document_chunks dc
          JOIN documents d ON d.id = dc.document_id
          WHERE d.paper_id = ${parsedId}
            AND dc.embedding IS NOT NULL
          ORDER BY dc.embedding <=> ${vectorStr}::vector 
          LIMIT ${safeLimit}
        `);
      } else {
        console.warn(`[searchDocumentChunks] documentId "${documentId}" is neither valid UUID nor paper number.`);
        return [];
      }
    } else {
      // Global search across all document chunks
      queryPromise = db.execute(sql`
        SELECT id, document_id as "documentId", content,
               (1 - (embedding <=> ${vectorStr}::vector)) as similarity
        FROM document_chunks 
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> ${vectorStr}::vector 
        LIMIT ${safeLimit}
      `);
    }

    // 3. Enforce query timeout to prevent hanging on vector DB queries
    const result = await withTimeout(queryPromise, timeoutMs, "pgvector search");
    const rows = "rows" in result ? (result.rows as any[]) : (result as unknown as any[]);

    if (!Array.isArray(rows)) return [];

    // 4. Sanitize chunk text to defend against indirect prompt injection in stored documents
    return rows
      .filter((r) => r && typeof r.content === "string")
      .map((r) => ({
        id: r.id,
        documentId: r.documentId,
        content: sanitizePromptInput(r.content),
        similarityScore: typeof r.similarity === "number" ? r.similarity : undefined,
      }));
  } catch (dbErr: any) {
    const safeErrMsg = redactApiKeys(dbErr?.message || String(dbErr));
    console.warn(`[searchDocumentChunks] Vector search query failed or timed out: ${safeErrMsg}`);
    return [];
  }
}
