import { generateText, generateObject, streamText } from "ai";
export { generateText, generateObject, streamText } from "ai";
import { createOpenAI, openai } from "@ai-sdk/openai";
import Anthropic from "@anthropic-ai/sdk";
import { langfuse } from "@/lib/langfuse";
import { memoryClient } from "@/lib/mem0";
import { getApplicableRules, extractUserRewriteFeedback } from "@/services/learningService";
import { withRateLimitRetry } from "./rateLimiter";
import { DEFAULT_OPENAI_MODEL_NAME, DEFAULT_ANTHROPIC_MODEL_NAME } from "./provider";
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
 * Create or get an Anthropic client.
 */
export function getAnthropicClient(apiKey?: string): Anthropic {
  const key = apiKey || process.env.ANTHROPIC_API_KEY || "";
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
 * with integrated rate-limit handling, automatic retries, and comprehensive error trapping.
 */
export async function callLLM(options: GenerateTextOptions): Promise<AIResponse> {
  const provider = resolveProvider(options.provider, options.model);

  let finalSystemPrompt = options.systemPrompt;
  if (options.useMemory && options.userId) {
    try {
      const searchResponse = await memoryClient.search(options.prompt, {
        userId: options.userId,
        topK: 3,
      } as any);
      
      const memoryStr = searchResponse?.results
        ? searchResponse.results.map((r: any) => `- ${r.memory}`).join("\n")
        : "";
        
      if (memoryStr) {
        finalSystemPrompt = `${finalSystemPrompt || ""}\n\n[USER PREFERENCES & CONTEXT]:\n${memoryStr}`;
      }
    } catch (e) {
      console.warn("[callLLM] Mem0 injection failed:", e);
    }
  }

  if (provider === "anthropic") {
    const client = getAnthropicClient(options.apiKey);
    const model = (options.model as string) || DEFAULT_ANTHROPIC_MODEL;
    const maxTokens = options.maxTokens || 4096;

    try {
      const response = await withRateLimitRetry(
        () =>
          client.messages.create({
            model,
            max_tokens: maxTokens,
            temperature: options.temperature,
            system: finalSystemPrompt,
            messages: [{ role: "user", content: options.prompt }],
          }),
        {
          operationName: `callLLM(anthropic:${model})`,
          maxRetries: options.retries ?? 3,
        }
      );

      const textContent = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      const promptTokens = response.usage?.input_tokens ?? 0;
      const completionTokens = response.usage?.output_tokens ?? 0;

      return {
        text: textContent,
        provider: "anthropic",
        model,
        tokensUsed: promptTokens + completionTokens,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
      };
    } catch (error: any) {
      console.error(`[callLLM] Anthropic API call failed for model "${model}":`, error);
      throw new Error(`Anthropic LLM call failed: ${error?.message || error}`);
    }
  }

  // Default: OpenAI
  const modelName = (options.model as string) || DEFAULT_OPENAI_MODEL;
  const modelInstance = getOpenAIModelInstance(modelName, options.apiKey);

  let trace: any = null;
  let generation: any = null;
  try {
    trace = langfuse.trace({
      name: "callLLM",
      input: options.prompt,
    });

    generation = trace.generation({
      name: "openai-generation",
      model: modelName,
      input: options.prompt,
    });
  } catch (traceErr) {
    console.warn("[callLLM] Langfuse initialization skipped or failed:", traceErr);
  }

  try {
    const result = await withRateLimitRetry(
      () =>
        generateText({
          model: modelInstance,
          prompt: options.prompt,
          system: finalSystemPrompt,
          temperature: options.temperature,
        }),
      {
        operationName: `callLLM(openai:${modelName})`,
        maxRetries: options.retries ?? 3,
      }
    );

    if (generation) {
      try {
        generation.end({
          output: result.text,
          usage: {
            promptTokens: (result.usage as any)?.promptTokens,
            completionTokens: (result.usage as any)?.completionTokens,
            totalTokens: (result.usage as any)?.totalTokens,
          },
        });
        await langfuse.flushAsync().catch(() => {});
      } catch (endErr) {
        console.warn("[callLLM] Langfuse generation end recording failed:", endErr);
      }
    }

    return {
      text: result.text,
      provider: "openai",
      model: modelName,
      tokensUsed: (result.usage as any)?.totalTokens,
      usage: {
        promptTokens: (result.usage as any)?.promptTokens,
        completionTokens: (result.usage as any)?.completionTokens,
        totalTokens: (result.usage as any)?.totalTokens,
      },
    };
  } catch (error: any) {
    if (generation) {
      try {
        generation.end({
          output: null,
          error: error?.message || String(error),
        });
        await langfuse.flushAsync().catch(() => {});
      } catch (_) {}
    }
    console.error(`[callLLM] OpenAI API call failed for model "${modelName}":`, error);
    throw new Error(`OpenAI LLM call failed: ${error?.message || error}`);
  }
}

/**
 * Multi-turn chat completion wrapper supporting OpenAI and Anthropic
 * with rate-limit handling and error recovery.
 */
export async function chatLLM(options: ChatOptions): Promise<AIResponse> {
  const provider = resolveProvider(options.provider, options.model);

  if (provider === "anthropic") {
    const client = getAnthropicClient(options.apiKey);
    const model = (options.model as string) || DEFAULT_ANTHROPIC_MODEL;
    const maxTokens = options.maxTokens || 4096;

    const systemMessages = options.messages.filter((m) => m.role === "system");
    const conversationMessages = options.messages.filter((m) => m.role !== "system");

    const systemPrompt = systemMessages.map((m) => m.content).join("\n\n") || undefined;

    const formattedMessages = conversationMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    try {
      const response = await withRateLimitRetry(
        () =>
          client.messages.create({
            model,
            max_tokens: maxTokens,
            temperature: options.temperature,
            system: systemPrompt,
            messages: formattedMessages,
          }),
        {
          operationName: `chatLLM(anthropic:${model})`,
          maxRetries: options.retries ?? 3,
        }
      );

      const textContent = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      const promptTokens = response.usage?.input_tokens ?? 0;
      const completionTokens = response.usage?.output_tokens ?? 0;

      return {
        text: textContent,
        provider: "anthropic",
        model,
        tokensUsed: promptTokens + completionTokens,
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
      };
    } catch (error: any) {
      console.error(`[chatLLM] Anthropic chat call failed for model "${model}":`, error);
      throw new Error(`Anthropic chat completion failed: ${error?.message || error}`);
    }
  }

  // OpenAI
  const modelName = (options.model as string) || DEFAULT_OPENAI_MODEL;
  const modelInstance = getOpenAIModelInstance(modelName, options.apiKey);

  const systemMessage = options.messages.find((m) => m.role === "system")?.content;
  const nonSystemMessages = options.messages.filter((m) => m.role !== "system");

  try {
    const result = await withRateLimitRetry(
      () =>
        generateText({
          model: modelInstance,
          messages: nonSystemMessages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
          system: systemMessage,
          temperature: options.temperature,
        }),
      {
        operationName: `chatLLM(openai:${modelName})`,
        maxRetries: options.retries ?? 3,
      }
    );

    return {
      text: result.text,
      provider: "openai",
      model: modelName,
      tokensUsed: (result.usage as any)?.totalTokens,
      usage: {
        promptTokens: (result.usage as any)?.promptTokens,
        completionTokens: (result.usage as any)?.completionTokens,
        totalTokens: (result.usage as any)?.totalTokens,
      },
    };
  } catch (error: any) {
    console.error(`[chatLLM] OpenAI chat call failed for model "${modelName}":`, error);
    throw new Error(`OpenAI chat completion failed: ${error?.message || error}`);
  }
}

/**
 * Stream text generation using Vercel AI SDK or Anthropic Stream API
 * with error boundary protection.
 */
export async function streamLLMText(options: GenerateTextOptions) {
  const provider = resolveProvider(options.provider, options.model);

  if (provider === "anthropic") {
    const client = getAnthropicClient(options.apiKey);
    const model = (options.model as string) || DEFAULT_ANTHROPIC_MODEL;

    try {
      return client.messages.stream({
        model,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature,
        system: options.systemPrompt,
        messages: [{ role: "user", content: options.prompt }],
      });
    } catch (error: any) {
      console.error(`[streamLLMText] Failed to initiate Anthropic stream for model "${model}":`, error);
      throw new Error(`Anthropic stream initiation failed: ${error?.message || error}`);
    }
  }

  // OpenAI streaming via ai sdk
  const modelName = (options.model as string) || DEFAULT_OPENAI_MODEL;
  const modelInstance = getOpenAIModelInstance(modelName, options.apiKey);

  try {
    return streamText({
      model: modelInstance,
      prompt: options.prompt,
      system: options.systemPrompt,
      temperature: options.temperature,
    });
  } catch (error: any) {
    console.error(`[streamLLMText] Failed to initiate OpenAI stream for model "${modelName}":`, error);
    throw new Error(`OpenAI stream initiation failed: ${error?.message || error}`);
  }
}

// ============================================================================
// Specialized Academic Writing & Research Assistant Services
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
- Follow formatting conventions and guidelines provided.`;

  const promptParts = [
    `Section Title: ${options.sectionTitle}`,
    `Paper Topic: ${options.paperTopic}`,
  ];

  if (options.targetJournal) {
    promptParts.push(`Target Journal / Venue: ${options.targetJournal}`);
  }
  if (options.outline) {
    promptParts.push(`Section Outline / Key Points:\n${options.outline}`);
  }
  if (options.context) {
    promptParts.push(`Preceding Context / Manuscript Background:\n${options.context}`);
  }
  if (options.guidelines) {
    promptParts.push(`Journal Guidelines / Word Count / Special Constraints:\n${options.guidelines}`);
  }

  promptParts.push("\nPlease draft this complete, cohesive section now:");

  return callLLM({
    prompt: promptParts.join("\n\n"),
    systemPrompt,
    provider: options.provider || "anthropic", // Claude default for nuanced academic writing
    model: options.model,
    apiKey: options.apiKey,
    temperature: 0.3,
    retries: options.retries,
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

  let prompt = `Original Text:\n"""\n${options.text}\n"""\n\nGoal: ${options.mode}`;
  if (options.feedback) {
    prompt += `\nSpecific Revision Feedback: ${options.feedback}`;
  }
  if (options.guidelines) {
    prompt += `\nStylistic Guidelines: ${options.guidelines}`;
  }
  prompt += `\n\nProvide the refined academic text below:`;

  return callLLM({
    prompt,
    systemPrompt,
    provider: options.provider || "anthropic",
    model: options.model,
    apiKey: options.apiKey,
    temperature: 0.2,
    retries: options.retries,
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

  const sections: string[] = [`Paper Title: ${options.title}`];
  if (options.introduction) sections.push(`Introduction Context:\n${options.introduction}`);
  if (options.methods) sections.push(`Methodology:\n${options.methods}`);
  if (options.results) sections.push(`Key Results:\n${options.results}`);
  if (options.conclusion) sections.push(`Conclusion & Implications:\n${options.conclusion}`);

  sections.push(`Please draft an abstract of under ${wordLimit} words based on the above information:`);

  return callLLM({
    prompt: sections.join("\n\n"),
    systemPrompt,
    provider: options.provider || "openai",
    model: options.model || DEFAULT_OPENAI_MODEL,
    apiKey: options.apiKey,
    temperature: 0.2,
    retries: options.retries,
  });
}

/**
 * Synthesize literature findings across multiple papers.
 */
export async function synthesizeLiterature(options: SynthesizeLiteratureOptions): Promise<AIResponse> {
  const systemPrompt = `You are a research scientist synthesizing prior literature.
Analyze the provided papers to identify consensus, methodological divergences, controversies, and open research gaps.
Do not simply summarize each paper serially; provide an integrated thematic synthesis with appropriate citations.`;

  const paperSummaries = options.papers
    .map((p, idx) => {
      return `[Paper ${idx + 1}]
Title: ${p.title}
Authors: ${p.authors || "Unknown"}
Year: ${p.year || "n/a"}
Abstract: ${p.abstract || "n/a"}
Key Findings: ${p.keyFindings || "n/a"}`;
    })
    .join("\n\n");

  const prompt = `Topic: ${options.topic}
${options.researchQuestion ? `Research Question: ${options.researchQuestion}\n` : ""}
Papers to synthesize:
${paperSummaries}

Please synthesize these studies into a cohesive literature review narrative highlighting:
1. State of current knowledge
2. Methodological comparisons
3. Identified gaps and conflicts
4. How this motivates further investigation`;

  return callLLM({
    prompt,
    systemPrompt,
    provider: options.provider || "anthropic",
    model: options.model,
    apiKey: options.apiKey,
    temperature: 0.3,
    retries: options.retries,
  });
}

/**
 * Simulate peer review critique to identify vulnerabilities in a section.
 */
export async function generatePeerReviewCritique(options: PeerReviewCritiqueOptions): Promise<AIResponse> {
  const criteriaList = options.criteria?.length
    ? options.criteria.map((c) => `- ${c}`).join("\n")
    : `- Soundness of methodology and sample size
- Overstated claims or unsupported causal assertions
- Missing alternative hypotheses or confounding variables
- Presentation clarity and completeness of data`;

  const systemPrompt = `You are a rigorous, constructive, and demanding peer reviewer for a top-tier scientific journal.
Provide an insightful review of the submitted section pointing out strengths, methodological limitations, potential reviewer objections, and actionable suggestions.`;

  const prompt = `Section Under Review: ${options.sectionName}

Manuscript Text:
"""
${options.text}
"""

Review Criteria:
${criteriaList}

Please provide your detailed peer review critique, categorized into:
1. Major Strengths
2. Critical Vulnerabilities / Questionable Claims
3. Recommended Revisions & Clarifications`;

  return callLLM({
    prompt,
    systemPrompt,
    provider: options.provider || "anthropic",
    model: options.model || DEFAULT_ANTHROPIC_MODEL,
    apiKey: options.apiKey,
    temperature: 0.2,
    retries: options.retries,
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

  const prompt = `Reviewer Comment:
"""
${options.reviewerComment}
"""

${options.manuscriptContext ? `Context from Manuscript:\n${options.manuscriptContext}\n` : ""}
${options.changesMade ? `Changes Implemented / Author Response Notes:\n${options.changesMade}\n` : ""}

Draft a complete, polite, and professional author response letter entry for this reviewer comment:`;

  return callLLM({
    prompt,
    systemPrompt,
    provider: options.provider || "anthropic",
    model: options.model,
    apiKey: options.apiKey,
    temperature: 0.2,
    retries: options.retries,
  });
}
