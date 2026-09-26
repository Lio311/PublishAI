import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { withModelFallback, withTimeout, mapConcurrent } from "./rateLimiter";
import { DEFAULT_OPENAI_MODEL_NAME, DEFAULT_OPENAI_MINI_MODEL_NAME, DEFAULT_OPENAI_EMBEDDING_MODEL_NAME } from "./provider";
import { generateSafeEmbedding, searchDocumentChunks } from "./vectorSearch";
import {
  SYSTEM_PROMPT_GUARDRAILS,
  wrapPromptContext,
  sanitizePromptInput,
  redactApiKeys,
} from "./promptSanitizer";

export interface DebateState {
  findings: string;
  papers: { id: string; title: string; abstract: string; conclusions: string }[];
  turns: { speaker: string; message: string }[];
  maxTurns: number;
  synthesis?: string;
}

export interface DebateServiceOptions {
  model?: string;
  fallbackModels?: string[];
  embeddingModel?: string;
  concurrency?: number;
  maxRetries?: number;
  timeoutMs?: number;
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
   * Resilient to embedding API outages, vector DB timeouts, rate limits, and prompt injection.
   */
  async runDebate(
    initialState: DebateState,
    options?: DebateServiceOptions
  ): Promise<DebateState> {
    const state: DebateState = { ...initialState };
    const modelName = options?.model || this.defaultModel;
    const embeddingModelName = options?.embeddingModel || this.defaultEmbeddingModel;
    const concurrency = options?.concurrency ?? 3;
    const maxRetries = options?.maxRetries ?? 2;
    const timeoutMs = options?.timeoutMs ?? 30000;

    const agentModelCandidates = options?.fallbackModels?.length
      ? options.fallbackModels.map((m) => ({ model: m }))
      : [{ model: modelName }, { model: DEFAULT_OPENAI_MINI_MODEL_NAME }];

    try {
      // 1. Generate embedding for user findings with timeout and fallback models.
      // If embedding fails or vector DB is unavailable, degrade gracefully without crashing.
      let embedding: number[] | null = null;
      try {
        const embedResult = await generateSafeEmbedding(state.findings, {
          modelName: embeddingModelName,
          maxRetries,
          timeoutMs: 8000,
        });
        embedding = embedResult?.embedding ?? null;
      } catch (embedError: any) {
        console.warn(
          "[MultiAgentDebateService] Embedding generation failed; continuing with metadata context fallback:",
          redactApiKeys(embedError?.message || String(embedError))
        );
      }

      // 2. Controlled concurrent prompting of Benchmark Paper Agents with rate-limit protection
      const turns = await mapConcurrent(
        state.papers,
        concurrency,
        async (paper) => {
          try {
            // Retrieve relevant chunks via safe vector search with timeout
            let context = "";
            if (embedding) {
              try {
                const chunks = await searchDocumentChunks({
                  documentId: paper.id,
                  paperId: isNaN(Number(paper.id)) ? undefined : Number(paper.id),
                  queryEmbedding: embedding,
                  limit: 5,
                  timeoutMs: 5000,
                });

                if (chunks.length > 0) {
                  context = chunks.map((c) => c.content).join("\n\n");
                }
              } catch (chunkErr: any) {
                console.warn(
                  `[MultiAgentDebateService] Chunk search failed for paper ${paper.id}:`,
                  redactApiKeys(chunkErr?.message || String(chunkErr))
                );
              }
            }

            // Fallback context if no chunks retrieved or embeddings failed
            if (!context) {
              context = paper.abstract
                ? `Abstract: ${paper.abstract}\nConclusions: ${paper.conclusions}`
                : `Benchmark conclusions: ${paper.conclusions}`;
            }

            // Construct prompt with prompt injection isolation boundaries and guardrails
            const prompt = `
You are representing the benchmark paper "${sanitizePromptInput(paper.title)}".

${SYSTEM_PROMPT_GUARDRAILS}

Your Paper's Established Conclusions:
${wrapPromptContext("paper_conclusions", paper.conclusions)}

User's New Research Findings:
${wrapPromptContext("user_findings", state.findings)}

Relevant Context Retrieved from Your Full Text:
${wrapPromptContext("retrieved_context", context)}

Based strictly on this context and your conclusions, provide a 2-paragraph critique or agreement with the new findings from your paper's perspective. Include citations to the context provided.
`.trim();

            const { result } = await withModelFallback(
              async (candidate) => {
                return withTimeout(
                  generateText({
                    model: openai(candidate.model),
                    prompt,
                  }),
                  timeoutMs,
                  `debateService:paperAgent(${paper.title.slice(0, 20)})`
                );
              },
              {
                candidates: agentModelCandidates,
                operationName: `debateService:paperAgent(${paper.title.slice(0, 20)})`,
                retryOptions: { maxRetries },
              }
            );

            return { speaker: paper.title, message: result.text };
          } catch (agentError: any) {
            const safeErrMsg = redactApiKeys(agentError?.message || String(agentError));
            console.error(`[MultiAgentDebateService] Agent error for paper "${paper.title}":`, safeErrMsg);
            return {
              speaker: paper.title,
              message: `[Perspective unavailable due to model error: ${safeErrMsg}]`,
            };
          }
        }
      );

      state.turns = turns;

      // 3. Pipe the collected responses into a final Synthesis Agent prompt
      const synthesisHistory = state.turns
        .map((t) => `${sanitizePromptInput(t.speaker)}:\n${sanitizePromptInput(t.message)}`)
        .join("\n\n");

      const synthesisPrompt = `
Synthesize the following debate into a cohesive "Discussion" section for a new academic paper.

${SYSTEM_PROMPT_GUARDRAILS}

User Findings:
${wrapPromptContext("user_findings", state.findings)}

Debate History (Agent Perspectives):
${wrapPromptContext("debate_history", synthesisHistory)}

Draft a 500-word Discussion section integrating these perspectives. Highlight areas of consensus, divergences, and the broader implications of the findings.
`.trim();

      try {
        const { result: synthResult } = await withModelFallback(
          async (candidate) => {
            return withTimeout(
              generateText({
                model: openai(candidate.model),
                prompt: synthesisPrompt,
              }),
              timeoutMs,
              "debateService:synthesisAgent"
            );
          },
          {
            candidates: agentModelCandidates,
            operationName: "debateService:synthesisAgent",
            retryOptions: { maxRetries },
          }
        );

        state.synthesis = synthResult.text;
      } catch (synthError: any) {
        const safeErrMsg = redactApiKeys(synthError?.message || String(synthError));
        console.error("[MultiAgentDebateService] Synthesis generation failed:", safeErrMsg);
        state.synthesis = "Discussion synthesis could not be completed due to model rate-limits or service errors.";
      }

      return state;
    } catch (error: any) {
      const safeErrMsg = redactApiKeys(error?.message || String(error));
      console.error("[MultiAgentDebateService] Critical debate pipeline error:", safeErrMsg);
      throw new Error(`Debate pipeline error: ${safeErrMsg}`);
    }
  }
}

export const debateService = new MultiAgentDebateService();
