import { generateText, generateObject, streamText } from "ai";
export { generateText, generateObject, streamText } from "ai";
import { createOpenAI, openai } from "@ai-sdk/openai";
import Anthropic from "@anthropic-ai/sdk";
import { langfuse } from "@/lib/langfuse";
import { memoryClient } from "@/lib/mem0";
import { getApplicableRules, extractUserRewriteFeedback } from "@/services/learningService";
import { withRateLimitRetry, withModelFallback, withTimeout } from "./rateLimiter";
import {
  DEFAULT_OPENAI_MODEL_NAME,
  DEFAULT_ANTHROPIC_MODEL_NAME,
  getModelFallbackChain,
  ModelCandidate,
} from "./provider";
import {
  SYSTEM_PROMPT_GUARDRAILS,
  sanitizePromptInput,
  wrapPromptContext,
  redactApiKeys,
} from "./promptSanitizer";
import {
  AIProvider,
  AIModel,
  GenerateTextOptions,
  ChatOptions,
  AIResponse,
  DraftSectionOptions,
  RefineWritingOptions,
  GenerateAbstractOptions,
  SynthesizeLiteratureOptions,
  PeerReviewCritiqueOptions,
  ReviewResponseOptions,
} from "./types";

export const DEFAULT_OPENAI_MODEL = DEFAULT_OPENAI_MODEL_NAME;
export const DEFAULT_ANTHROPIC_MODEL = DEFAULT_ANTHROPIC_MODEL_NAME;

/**
 * Determine the provider based on provider name or model identifier.
 */
export function resolveProvider(provider?: AIProvider, model?: AIModel): AIProvider {
  if (provider) return provider;
  if (model && (model.startsWith("claude") || model.includes("anthropic"))) {
    return "anthropic";
  }
  return "openai";
}

/**
 * Create or get an Anthropic client with credential validation.
 */
export function getAnthropicClient(apiKey?: string): Anthropic {
  const key = apiKey || process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "Anthropic API key is not configured. Please set ANTHROPIC_API_KEY or provide an apiKey in options."
    );
  }
  return new Anthropic({ apiKey: key });
}

/**
 * Get the OpenAI language model instance with optional custom API key.
 */
export function getOpenAIModelInstance(modelName: string = DEFAULT_OPENAI_MODEL, apiKey?: string) {
  if (apiKey) {
    const customOpenAI = createOpenAI({ apiKey });
    return customOpenAI(modelName);
  }
  return openai(modelName);
}

/**
 * Core LLM text generation wrapper supporting both OpenAI and Anthropic
 * with integrated rate-limit handling, automatic model fallbacks, prompt injection defense,
 * timeouts, and comprehensive error trapping.
 */
export async function callLLM(options: GenerateTextOptions): Promise<AIResponse> {
  const primaryProvider = resolveProvider(options.provider, options.model);
  const primaryModel =
    (options.model as string) ||
    (primaryProvider === "anthropic" ? DEFAULT_ANTHROPIC_MODEL : DEFAULT_OPENAI_MODEL);

  // 1. Sanitize user prompt to neutralize injection tokens and secrets
  const sanitizedUserPrompt = sanitizePromptInput(options.prompt, { warnOnInjection: true });

  // 2. Build system prompt reinforced with prompt injection isolation guardrails
  let finalSystemPrompt = options.systemPrompt
    ? `${options.systemPrompt}\n\n${SYSTEM_PROMPT_GUARDRAILS}`
    : SYSTEM_PROMPT_GUARDRAILS;

  // 3. User preferences memory injection with safe XML wrapping
  if (options.useMemory && options.userId) {
    try {
      const searchResponse = await memoryClient.search(sanitizedUserPrompt, {
        userId: options.userId,
        topK: 3,
      } as any);

      const memoryStr = searchResponse?.results
        ? searchResponse.results.map((r: any) => `- ${r.memory}`).join("\n")
        : "";

      if (memoryStr) {
        finalSystemPrompt = `${finalSystemPrompt}\n\n${wrapPromptContext(
          "user_preferences",
          memoryStr,
          "User personalized style guidelines"
        )}`;
      }
    } catch (e) {
      console.warn("[callLLM] Mem0 memory retrieval skipped or failed:", redactApiKeys(String(e)));
    }
  }

  // 4. Determine fallback candidates chain
  const candidateList: ModelCandidate[] = options.fallbackModels?.length
    ? [
        { model: primaryModel, provider: primaryProvider },
        ...options.fallbackModels.map((m) => ({
          model: m as string,
          provider: resolveProvider(undefined, m),
        })),
      ]
    : getModelFallbackChain(primaryModel, primaryProvider);

  const timeoutMs = options.timeoutMs ?? 30000;
  const maxRetries = options.retries ?? 2;

  // 5. Execute with automated model fallback and rate-limit recovery
  try {
    const { result, usedCandidate } = await withModelFallback(
      async (candidate) => {
        if (candidate.provider === "anthropic") {
          const client = getAnthropicClient(options.apiKey);
          const maxTokens = options.maxTokens || 4096;

          const response = await withTimeout(
            client.messages.create({
              model: candidate.model,
              max_tokens: maxTokens,
              temperature: options.temperature,
              system: finalSystemPrompt,
              messages: [{ role: "user", content: sanitizedUserPrompt }],
            }),
            timeoutMs,
            `callLLM(anthropic:${candidate.model})`
          );

          const textContent = response.content
            .filter((block): block is Anthropic.TextBlock => block.type === "text")
            .map((block) => block.text)
            .join("\n");

          const promptTokens = response.usage?.input_tokens ?? 0;
          const completionTokens = response.usage?.output_tokens ?? 0;

          return {
            text: textContent,
            provider: "anthropic" as AIProvider,
            model: candidate.model,
            tokensUsed: promptTokens + completionTokens,
            usage: {
              promptTokens,
              completionTokens,
              totalTokens: promptTokens + completionTokens,
            },
          };
        }

        // OpenAI execution path
        const modelInstance = getOpenAIModelInstance(candidate.model, options.apiKey);

        let trace: any = null;
        let generation: any = null;
        try {
          trace = langfuse.trace({
            name: "callLLM",
            input: sanitizedUserPrompt,
          });

          generation = trace.generation({
            name: "openai-generation",
            model: candidate.model,
            input: sanitizedUserPrompt,
          });
        } catch {
          // Non-blocking telemetry
        }

        try {
          const genResult = await withTimeout(
            generateText({
              model: modelInstance,
              prompt: sanitizedUserPrompt,
              system: finalSystemPrompt,
              temperature: options.temperature,
            }),
            timeoutMs,
            `callLLM(openai:${candidate.model})`
          );

          if (generation) {
            try {
              generation.end({
                output: genResult.text,
                usage: {
                  promptTokens: (genResult.usage as any)?.promptTokens,
                  completionTokens: (genResult.usage as any)?.completionTokens,
                  totalTokens: (genResult.usage as any)?.totalTokens,
                },
              });
              await langfuse.flushAsync().catch(() => {});
            } catch {
              // Ignore telemetry flush errors
            }
          }

          return {
            text: genResult.text,
            provider: "openai" as AIProvider,
            model: candidate.model,
            tokensUsed: (genResult.usage as any)?.totalTokens,
            usage: {
              promptTokens: (genResult.usage as any)?.promptTokens,
              completionTokens: (genResult.usage as any)?.completionTokens,
              totalTokens: (genResult.usage as any)?.totalTokens,
            },
          };
        } catch (openaiErr: any) {
          if (generation) {
            try {
              generation.end({
                output: null,
                error: redactApiKeys(openaiErr?.message || String(openaiErr)),
              });
              await langfuse.flushAsync().catch(() => {});
            } catch {}
          }
          throw openaiErr;
        }
      },
      {
        candidates: candidateList,
        operationName: `callLLM(${primaryModel})`,
        retryOptions: { maxRetries },
      }
    );

    return result;
  } catch (finalError: any) {
    const safeErrMsg = redactApiKeys(finalError?.message || String(finalError));
    console.error(`[callLLM] All candidate models failed for primary "${primaryModel}":`, safeErrMsg);
    throw new Error(`LLM call failed after model fallbacks: ${safeErrMsg}`);
  }
}

/**
 * Multi-turn chat completion wrapper supporting OpenAI and Anthropic
 * with automated model fallbacks, rate-limit handling, and prompt sanitization.
 */
export async function chatLLM(options: ChatOptions): Promise<AIResponse> {
  const primaryProvider = resolveProvider(options.provider, options.model);
  const primaryModel =
    (options.model as string) ||
    (primaryProvider === "anthropic" ? DEFAULT_ANTHROPIC_MODEL : DEFAULT_OPENAI_MODEL);

  const timeoutMs = options.timeoutMs ?? 30000;
  const maxRetries = options.retries ?? 2;

  // Sanitize all message inputs
  const sanitizedMessages = options.messages.map((m) => ({
    role: m.role,
    content: sanitizePromptInput(m.content),
  }));

  const systemMessages = sanitizedMessages.filter((m) => m.role === "system");
  const conversationMessages = sanitizedMessages.filter((m) => m.role !== "system");

  const systemPrompt = [
    ...systemMessages.map((m) => m.content),
    SYSTEM_PROMPT_GUARDRAILS,
  ].join("\n\n");

  const candidateList: ModelCandidate[] = options.fallbackModels?.length
    ? [
        { model: primaryModel, provider: primaryProvider },
        ...options.fallbackModels.map((m) => ({
          model: m as string,
          provider: resolveProvider(undefined, m),
        })),
      ]
    : getModelFallbackChain(primaryModel, primaryProvider);

  try {
    const { result } = await withModelFallback(
      async (candidate) => {
        if (candidate.provider === "anthropic") {
          const client = getAnthropicClient(options.apiKey);
          const maxTokens = options.maxTokens || 4096;

          const formattedAnthropicMessages = conversationMessages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));

          const response = await withTimeout(
            client.messages.create({
              model: candidate.model,
              max_tokens: maxTokens,
              temperature: options.temperature,
              system: systemPrompt,
              messages: formattedAnthropicMessages,
            }),
            timeoutMs,
            `chatLLM(anthropic:${candidate.model})`
          );

          const textContent = response.content
            .filter((block): block is Anthropic.TextBlock => block.type === "text")
            .map((block) => block.text)
            .join("\n");

          const promptTokens = response.usage?.input_tokens ?? 0;
          const completionTokens = response.usage?.output_tokens ?? 0;

          return {
            text: textContent,
            provider: "anthropic" as AIProvider,
            model: candidate.model,
            tokensUsed: promptTokens + completionTokens,
            usage: {
              promptTokens,
              completionTokens,
              totalTokens: promptTokens + completionTokens,
            },
          };
        }

        // OpenAI chat execution
        const modelInstance = getOpenAIModelInstance(candidate.model, options.apiKey);

        const genResult = await withTimeout(
          generateText({
            model: modelInstance,
            messages: conversationMessages.map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
            system: systemPrompt,
            temperature: options.temperature,
          }),
          timeoutMs,
          `chatLLM(openai:${candidate.model})`
        );

        return {
          text: genResult.text,
          provider: "openai" as AIProvider,
          model: candidate.model,
          tokensUsed: (genResult.usage as any)?.totalTokens,
          usage: {
            promptTokens: (genResult.usage as any)?.promptTokens,
            completionTokens: (genResult.usage as any)?.completionTokens,
            totalTokens: (genResult.usage as any)?.totalTokens,
          },
        };
      },
      {
        candidates: candidateList,
        operationName: `chatLLM(${primaryModel})`,
        retryOptions: { maxRetries },
      }
    );

    return result;
  } catch (error: any) {
    const safeErrMsg = redactApiKeys(error?.message || String(error));
    console.error(`[chatLLM] Chat failed across candidate models:`, safeErrMsg);
    throw new Error(`Chat completion failed: ${safeErrMsg}`);
  }
}

/**
 * Stream text generation with prompt injection protection and error boundary.
 */
export async function streamLLMText(options: GenerateTextOptions) {
  const provider = resolveProvider(options.provider, options.model);
  const sanitizedPrompt = sanitizePromptInput(options.prompt);
  const systemPrompt = options.systemPrompt
    ? `${options.systemPrompt}\n\n${SYSTEM_PROMPT_GUARDRAILS}`
    : SYSTEM_PROMPT_GUARDRAILS;

  if (provider === "anthropic") {
    const client = getAnthropicClient(options.apiKey);
    const model = (options.model as string) || DEFAULT_ANTHROPIC_MODEL;

    try {
      return client.messages.stream({
        model,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature,
        system: systemPrompt,
        messages: [{ role: "user", content: sanitizedPrompt }],
      });
    } catch (error: any) {
      const safeErrMsg = redactApiKeys(error?.message || String(error));
      console.error(`[streamLLMText] Anthropic stream initiation failed:`, safeErrMsg);
      throw new Error(`Anthropic stream initiation failed: ${safeErrMsg}`);
    }
  }

  // OpenAI streaming
  const modelName = (options.model as string) || DEFAULT_OPENAI_MODEL;
  const modelInstance = getOpenAIModelInstance(modelName, options.apiKey);

  try {
    return streamText({
      model: modelInstance,
      prompt: sanitizedPrompt,
      system: systemPrompt,
      temperature: options.temperature,
    });
  } catch (error: any) {
    const safeErrMsg = redactApiKeys(error?.message || String(error));
    console.error(`[streamLLMText] OpenAI stream initiation failed:`, safeErrMsg);
    throw new Error(`OpenAI stream initiation failed: ${safeErrMsg}`);
  }
}

// ============================================================================
// Specialized Academic Writing & Research Assistant Services
// Protected against prompt injection via XML boundary isolation
// ============================================================================

/**
 * Draft a publication-grade academic section (Abstract, Intro, Methods, Results, Discussion).
 */
export async function draftSection(options: DraftSectionOptions): Promise<AIResponse> {
  const systemPrompt = `You are an elite academic co-author and principal investigator specialized in scientific writing and publishing for high-impact journals (Nature, Science, Cell, IEEE, Lancet).
Your objective is to produce rigorous, publication-grade academic text adhering to strict scholarly norms, objective prose, and domain-appropriate terminology.
Rules:
- Maintain an authoritative, clear, and precise academic tone.
- Ensure cohesive logical transitions between paragraphs.
- Never invent citations; indicate missing citations with placeholders like [Author, Year] or [Citation needed].
- Follow formatting conventions and guidelines provided strictly within data tags.`;

  const promptParts = [
    `Section Title: ${sanitizePromptInput(options.sectionTitle)}`,
    wrapPromptContext("paper_topic", options.paperTopic),
  ];

  if (options.targetJournal) {
    promptParts.push(`Target Journal / Venue: ${sanitizePromptInput(options.targetJournal)}`);
  }
  if (options.outline) {
    promptParts.push(wrapPromptContext("section_outline", options.outline, "Author provided outline"));
  }
  if (options.context) {
    promptParts.push(wrapPromptContext("manuscript_context", options.context, "Preceding manuscript text"));
  }
  if (options.guidelines) {
    promptParts.push(wrapPromptContext("journal_guidelines", options.guidelines, "Journal constraints"));
  }

  promptParts.push("\nPlease draft this complete, cohesive section now based exclusively on the information above:");

  return callLLM({
    prompt: promptParts.join("\n\n"),
    systemPrompt,
    provider: options.provider || "anthropic",
    model: options.model,
    fallbackModels: options.fallbackModels,
    apiKey: options.apiKey,
    temperature: 0.3,
    retries: options.retries,
    timeoutMs: options.timeoutMs,
  });
}

/**
 * Refine, rewrite, or polish existing academic manuscript text.
 */
export async function refineAcademicWriting(options: RefineWritingOptions): Promise<AIResponse> {
  const instructionsByMode: Record<RefineWritingOptions["mode"], string> = {
    academic_tone: "Elevate the prose to formal academic English, replacing colloquialisms with rigorous scientific terminology while avoiding unnecessary verbosity.",
    clarity: "Improve readability, eliminate ambiguities, and ensure the logical flow and reasoning are immediately transparent to peer reviewers.",
    conciseness: "Tighten phrasing, remove redundancy, and shorten the text while preserving 100% of the scientific content, claims, and data points.",
    formalize: "Transform informal or rough drafting notes into structured, elegant scholarly manuscript text.",
    expand: "Elaborate thoroughly on the underlying mechanisms, methodology, implications, and scholarly nuance without padding or fluff.",
    fix_grammar: "Correct all grammatical, orthographical, punctuational, and syntax errors with zero alteration to intended meaning.",
  };

  const systemPrompt = `You are an expert scientific editor for leading academic journals.
Task: ${instructionsByMode[options.mode] || instructionsByMode.academic_tone}
Ensure scientific accuracy, preserve author citations and specific numbers/metrics, and adhere to publication standards.`;

  const promptParts = [
    `Refinement Goal: ${options.mode}`,
    wrapPromptContext("original_text", options.text, "Manuscript text to be refined"),
  ];

  if (options.feedback) {
    promptParts.push(wrapPromptContext("revision_feedback", options.feedback, "Specific revision suggestions"));
  }
  if (options.guidelines) {
    promptParts.push(wrapPromptContext("stylistic_guidelines", options.guidelines, "Stylistic constraints"));
  }

  promptParts.push("\nProvide the refined academic text below:");

  return callLLM({
    prompt: promptParts.join("\n\n"),
    systemPrompt,
    provider: options.provider || "anthropic",
    model: options.model,
    fallbackModels: options.fallbackModels,
    apiKey: options.apiKey,
    temperature: 0.2,
    retries: options.retries,
    timeoutMs: options.timeoutMs,
  });
}

/**
 * Synthesize a comprehensive scientific abstract from paper components.
 */
export async function generateAbstract(options: GenerateAbstractOptions): Promise<AIResponse> {
  const wordLimit = options.wordLimit || 250;
  const systemPrompt = `You are a scientific editor crafting a compelling, high-impact manuscript abstract.
The abstract must follow the standard structure:
1. Background & Problem: Contextual gap and research question.
2. Objectives / Hypothesis: What this paper investigates.
3. Methodology: Experimental or theoretical approach.
4. Primary Results: Specific quantitative and qualitative findings.
5. Significance & Impact: Broader implications for the field.
Strict constraint: Do not exceed ${wordLimit} words. Avoid unexplained jargon or undefined abbreviations.`;

  const promptParts: string[] = [
    `Paper Title: ${sanitizePromptInput(options.title)}`,
  ];
  if (options.introduction) promptParts.push(wrapPromptContext("introduction_context", options.introduction));
  if (options.methods) promptParts.push(wrapPromptContext("methodology", options.methods));
  if (options.results) promptParts.push(wrapPromptContext("primary_results", options.results));
  if (options.conclusion) promptParts.push(wrapPromptContext("conclusions", options.conclusion));

  promptParts.push(`\nPlease draft an abstract of strictly under ${wordLimit} words based on the information above:`);

  return callLLM({
    prompt: promptParts.join("\n\n"),
    systemPrompt,
    provider: options.provider || "openai",
    model: options.model || DEFAULT_OPENAI_MODEL,
    fallbackModels: options.fallbackModels,
    apiKey: options.apiKey,
    temperature: 0.2,
    retries: options.retries,
    timeoutMs: options.timeoutMs,
  });
}

/**
 * Synthesize literature findings across multiple papers with indirect injection defense.
 */
export async function synthesizeLiterature(options: SynthesizeLiteratureOptions): Promise<AIResponse> {
  const systemPrompt = `You are a research scientist synthesizing prior literature.
Analyze the provided papers to identify consensus, methodological divergences, controversies, and open research gaps.
Do not simply summarize each paper serially; provide an integrated thematic synthesis with appropriate citations.`;

  const paperSummaries = options.papers
    .map((p, idx) => {
      const title = sanitizePromptInput(p.title);
      const authors = sanitizePromptInput(p.authors || "Unknown");
      const year = sanitizePromptInput(String(p.year || "n/a"));
      const abstract = sanitizePromptInput(p.abstract || "n/a");
      const findings = sanitizePromptInput(p.keyFindings || "n/a");
      return wrapPromptContext(
        `paper_${idx + 1}`,
        `Title: ${title}\nAuthors: ${authors}\nYear: ${year}\nAbstract: ${abstract}\nKey Findings: ${findings}`,
        `Benchmark Paper ${idx + 1}`
      );
    })
    .join("\n\n");

  const promptParts = [
    `Topic: ${sanitizePromptInput(options.topic)}`,
  ];
  if (options.researchQuestion) {
    promptParts.push(`Research Question: ${sanitizePromptInput(options.researchQuestion)}`);
  }
  promptParts.push(`Papers to synthesize:\n${paperSummaries}`);
  promptParts.push(`\nPlease synthesize these studies into a cohesive literature review narrative highlighting:
1. State of current knowledge
2. Methodological comparisons
3. Identified gaps and conflicts
4. How this motivates further investigation`);

  return callLLM({
    prompt: promptParts.join("\n\n"),
    systemPrompt,
    provider: options.provider || "anthropic",
    model: options.model,
    fallbackModels: options.fallbackModels,
    apiKey: options.apiKey,
    temperature: 0.3,
    retries: options.retries,
    timeoutMs: options.timeoutMs,
  });
}

/**
 * Simulate peer review critique to identify vulnerabilities in a section.
 */
export async function generatePeerReviewCritique(options: PeerReviewCritiqueOptions): Promise<AIResponse> {
  const criteriaList = options.criteria?.length
    ? options.criteria.map((c) => `- ${sanitizePromptInput(c)}`).join("\n")
    : `- Soundness of methodology and sample size
- Overstated claims or unsupported causal assertions
- Missing alternative hypotheses or confounding variables
- Presentation clarity and completeness of data`;

  const systemPrompt = `You are a rigorous, constructive, and demanding peer reviewer for a top-tier scientific journal.
Provide an insightful review of the submitted section pointing out strengths, methodological limitations, potential reviewer objections, and actionable suggestions.`;

  const promptParts = [
    `Section Under Review: ${sanitizePromptInput(options.sectionName)}`,
    wrapPromptContext("manuscript_text", options.text, "Manuscript section under evaluation"),
    wrapPromptContext("review_criteria", criteriaList, "Evaluation criteria"),
    `\nPlease provide your detailed peer review critique, categorized into:
1. Major Strengths
2. Critical Vulnerabilities / Questionable Claims
3. Recommended Revisions & Clarifications`,
  ];

  return callLLM({
    prompt: promptParts.join("\n\n"),
    systemPrompt,
    provider: options.provider || "anthropic",
    model: options.model || DEFAULT_ANTHROPIC_MODEL,
    fallbackModels: options.fallbackModels,
    apiKey: options.apiKey,
    temperature: 0.2,
    retries: options.retries,
    timeoutMs: options.timeoutMs,
  });
}

/**
 * Generate a point-by-point response to peer reviewer comments.
 */
export async function generateResponseToReviewers(options: ReviewResponseOptions): Promise<AIResponse> {
  const systemPrompt = `You are an author crafting a formal, polite, and persuasive response to a journal peer reviewer.
Guidelines:
- Thank the reviewer sincerely for their constructive feedback.
- Explicitly quote the reviewer's concern.
- Address the concern point-by-point with evidence and scientific rationale.
- Clearly state what revisions were made in the manuscript and reference where they appear.`;

  const promptParts = [
    wrapPromptContext("reviewer_comment", options.reviewerComment, "Reviewer comment"),
  ];

  if (options.manuscriptContext) {
    promptParts.push(wrapPromptContext("manuscript_context", options.manuscriptContext, "Excerpt from manuscript"));
  }
  if (options.changesMade) {
    promptParts.push(wrapPromptContext("author_changes", options.changesMade, "Revisions made by author"));
  }

  promptParts.push("\nDraft a complete, polite, and professional author response letter entry for this reviewer comment:");

  return callLLM({
    prompt: promptParts.join("\n\n"),
    systemPrompt,
    provider: options.provider || "anthropic",
    model: options.model,
    fallbackModels: options.fallbackModels,
    apiKey: options.apiKey,
    temperature: 0.2,
    retries: options.retries,
    timeoutMs: options.timeoutMs,
  });
}
