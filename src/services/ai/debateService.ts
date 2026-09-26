import { generateText, embed } from 'ai';
import { openai } from '@ai-sdk/openai';
import { db } from "@/services/db";
import { sql } from 'drizzle-orm';
import { withRateLimitRetry, mapConcurrent } from './rateLimiter';
import { DEFAULT_OPENAI_MODEL_NAME, DEFAULT_OPENAI_EMBEDDING_MODEL_NAME } from './provider';

export interface DebateState {
  findings: string;
  papers: { id: string; title: string; abstract: string; conclusions: string }[];
  turns: { speaker: string; message: string }[];
  maxTurns: number;
  synthesis?: string;
}

export interface DebateServiceOptions {
  model?: string;
  embeddingModel?: string;
  concurrency?: number;
  maxRetries?: number;
}

export class MultiAgentDebateService {
  private defaultModel: string;
  private defaultEmbeddingModel: string;

  constructor(options?: { defaultModel?: string; defaultEmbeddingModel?: string }) {
    this.defaultModel = options?.defaultModel || DEFAULT_OPENAI_MODEL_NAME;
    this.defaultEmbeddingModel = options?.defaultEmbeddingModel || DEFAULT_OPENAI_EMBEDDING_MODEL_NAME;
  }

  /**
   * Orchestrates a debate between multiple "Paper Agents" concurrently,
   * followed by a Synthesis Agent.
   */
  async runDebate(
    initialState: DebateState,
    options?: DebateServiceOptions
  ): Promise<DebateState> {
    const state: DebateState = { ...initialState };
    const modelName = options?.model || this.defaultModel;
    const embeddingModelName = options?.embeddingModel || this.defaultEmbeddingModel;
    const concurrency = options?.concurrency ?? 3;
    const maxRetries = options?.maxRetries ?? 3;

    try {
      // 1. Generate embedding for the new findings to use in RAG with rate-limit retry
      let embedding: number[];
      try {
        const embedResult = await withRateLimitRetry(
          () =>
            embed({
              model: openai.embedding(embeddingModelName),
              value: state.findings,
            }),
          { operationName: "debateService:embedFindings", maxRetries }
        );
        embedding = embedResult.embedding;
      } catch (embedError: any) {
        console.error("[MultiAgentDebateService] Embedding generation failed:", embedError);
        throw new Error(`Failed to generate embeddings for debate findings: ${embedError?.message || embedError}`);
      }

      // 2. Controlled concurrent prompting of Benchmark Paper Agents with rate-limit protection
      const turns = await mapConcurrent(
        state.papers,
        concurrency,
        async (paper) => {
          try {
            // Query pgvector for the most relevant chunks for this specific paper
            let context = 'No specific context retrieved from the paper text.';
            try {
              const result = await db.execute(sql`
                SELECT content 
                FROM document_chunks 
                WHERE document_id = ${paper.id} 
                ORDER BY embedding <=> ${JSON.stringify(embedding)}::vector 
                LIMIT 5
              `);

              const rows = 'rows' in result ? (result.rows as any[]) : (result as unknown as any[]);
              const chunks = rows.map((r: any) => r.content as string).filter(Boolean);
              if (chunks.length > 0) {
                context = chunks.join('\n\n');
              }
            } catch (dbErr) {
              console.warn(`[MultiAgentDebateService] Could not retrieve chunks for paper ${paper.id}:`, dbErr);
            }

            const prompt = `You are representing the benchmark paper "${paper.title}".
Your conclusions are: ${paper.conclusions}.
The user's new findings are: ${state.findings}.

Relevant context retrieved from your paper's full text:
${context}

Based on this context and your conclusions, provide a 2-paragraph critique or agreement with the new findings from your paper's perspective. Include citations to the context provided.`;

            const { text } = await withRateLimitRetry(
              () =>
                generateText({
                  model: openai(modelName),
                  prompt,
                }),
              {
                operationName: `debateService:paperAgent(${paper.title.slice(0, 30)})`,
                maxRetries,
              }
            );

            return { speaker: paper.title, message: text };
          } catch (agentError: any) {
            console.error(`[MultiAgentDebateService] Agent error for paper "${paper.title}":`, agentError);
            return {
              speaker: paper.title,
              message: `[Perspective unavailable due to model error: ${agentError?.message || 'Rate limit or service error'}]`,
            };
          }
        }
      );

      state.turns = turns;

      // 3. Pipe the collected responses into a final Synthesis Agent prompt
      const synthesisHistory = state.turns.map(t => `${t.speaker}:\n${t.message}`).join('\n\n');
      
      const synthesisPrompt = `Synthesize the following debate into a cohesive "Discussion" section for a new academic paper.

User Findings: ${state.findings}

Agent Perspectives (Debate):
${synthesisHistory}

Draft a 500-word Discussion section integrating these perspectives. Highlight areas of consensus, divergences, and the broader implications of the findings.`;

      try {
        const { text: synthesisText } = await withRateLimitRetry(
          () =>
            generateText({
              model: openai(modelName),
              prompt: synthesisPrompt,
            }),
          { operationName: "debateService:synthesisAgent", maxRetries }
        );

        state.synthesis = synthesisText;
      } catch (synthError: any) {
        console.error("[MultiAgentDebateService] Synthesis generation failed:", synthError);
        state.synthesis = "Discussion synthesis could not be completed due to model rate-limits or service errors.";
      }

      return state;
    } catch (error: any) {
      console.error("[MultiAgentDebateService] Critical debate pipeline error:", error);
      throw error;
    }
  }
}

export const debateService = new MultiAgentDebateService();
