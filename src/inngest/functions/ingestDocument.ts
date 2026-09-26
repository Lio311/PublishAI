import { inngest } from "../client";
import { documentUploadedEvent } from "../events";
import { db } from "../../services/db";
import { documents, documentChunks } from "../../services/db/schema";
import { eq } from "drizzle-orm";
import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export const ingestDocument = inngest.createFunction(
  {
    id: "ingest-document",
    triggers: [documentUploadedEvent],
    concurrency: {
      key: "event.data.documentId",
      limit: 1,
    },
    rateLimit: {
      limit: 30,
      period: "1m",
    },
    idempotency: "event.data.documentId",
    retries: 2,
  },
  async ({ event, step }) => {
    const { documentId } = event.data;

    // 1. Fetch document from DB
    const doc = await step.run("fetch-document", async () => {
      const results = await db
        .select()
        .from(documents)
        .where(eq(documents.id, documentId))
        .limit(1);
      return results[0];
    });

    if (!doc || !doc.content || doc.content.trim().length === 0) {
      return {
        success: false,
        reason: `Document ${documentId} not found or has no content`,
      };
    }

    // 2. Chunk the document (handling full paper length)
    const chunks = await step.run("chunk-document", async () => {
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      return await splitter.createDocuments([doc.content!]);
    });

    if (!chunks || chunks.length === 0) {
      return { success: true, chunksProcessed: 0 };
    }

    // 3. Generate embeddings with batching to avoid API payload limits
    const embeddings = await step.run("generate-embeddings", async () => {
      const chunkTexts = chunks.map((c) => c.pageContent);
      const allEmbeddings: number[][] = [];
      const batchSize = 100;

      for (let i = 0; i < chunkTexts.length; i += batchSize) {
        const batch = chunkTexts.slice(i, i + batchSize);
        const { embeddings: batchEmbeddings } = await embedMany({
          model: openai.embedding("text-embedding-3-small"),
          values: batch,
        });
        allEmbeddings.push(...batchEmbeddings);
      }

      return allEmbeddings;
    });

    // 4. Store vectors in DB idempotently
    await step.run("store-vectors", async () => {
      const values = chunks.map((chunk, i) => ({
        documentId: doc.id,
        content: chunk.pageContent,
        embedding: embeddings[i],
        metadata: chunk.metadata,
      }));

      // Delete existing chunks for this document first to prevent duplicate vectors on retries
      await db
        .delete(documentChunks)
        .where(eq(documentChunks.documentId, doc.id));

      if (values.length > 0) {
        await db.insert(documentChunks).values(values);
      }
    });

    return { success: true, chunksProcessed: chunks.length };
  }
);
