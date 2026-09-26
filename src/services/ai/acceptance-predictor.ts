import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { withModelFallback, withTimeout } from "./rateLimiter";
import { DEFAULT_OPENAI_MODEL_NAME, DEFAULT_OPENAI_MINI_MODEL_NAME } from "./provider";
import {
  SYSTEM_PROMPT_GUARDRAILS,
  wrapPromptContext,
  sanitizePromptInput,
  redactApiKeys,
} from "./promptSanitizer";

const PredictionResultSchema = z.object({
  probabilityScore: z.number().describe("The probability score from 0 to 100 for acceptance"),
  reasoning: z.string().describe("A detailed reasoning explaining why this score was given, analyzing the paper's fit to the journal, originality, and methodology constraints"),
  strengths: z.array(z.string()).describe("Key strengths of the submission regarding the journal"),
  weaknesses: z.array(z.string()).describe("Key weaknesses or missing elements"),
  recommendations: z.array(z.string()).describe("Actionable recommendations to improve the chances of acceptance")
});

export type PredictionResult = z.infer<typeof PredictionResultSchema>;

export interface PredictAcceptanceOptions {
  model?: string;
  fallbackModels?: string[];
  maxRetries?: number;
  timeoutMs?: number;
}

/**
 * Predicts the probability of a paper being accepted to a target journal.
 * Based on:
 * - Journal scope, impact factor, requirements
 * - Paper title, abstract, methodology clarity, key findings
 * - Known technical requirements (e.g., word count, declarations)
 * 
 * Features prompt injection isolation, model fallbacks (e.g. gpt-4o -> gpt-4o-mini),
 * timeout protection, and secret redaction.
 */
export async function predictAcceptance(
  paperDetails: { title: string; abstract: string; keyFindings: string },
  journalDetails: { name: string; field: string; rules: any; requiredSections: any },
  authorHistory?: string,
  options?: PredictAcceptanceOptions
): Promise<PredictionResult> {
  const primaryModel = options?.model || DEFAULT_OPENAI_MODEL_NAME;
  const fallbackCandidates = options?.fallbackModels?.length
    ? options.fallbackModels
    : [primaryModel, DEFAULT_OPENAI_MINI_MODEL_NAME];

  const uniqueCandidates = Array.from(new Set(fallbackCandidates)).map((m) => ({ model: m }));
  const maxRetries = options?.maxRetries ?? 2;
  const timeoutMs = options?.timeoutMs ?? 30000;

  // Sanitize and isolate untrusted manuscript contents within XML delimiters
  const manuscriptContent = `
Title: ${sanitizePromptInput(paperDetails.title)}
Abstract: ${sanitizePromptInput(paperDetails.abstract)}
Key Findings: ${sanitizePromptInput(paperDetails.keyFindings)}
`.trim();

  const journalContent = `
Name: ${sanitizePromptInput(journalDetails.name)}
Field: ${sanitizePromptInput(journalDetails.field)}
Rules: ${JSON.stringify(journalDetails.rules)}
Required Sections: ${JSON.stringify(journalDetails.requiredSections)}
`.trim();

  const prompt = `
You are an expert scientific editor and reviewer evaluating a manuscript's chance of acceptance to a specific journal.

${SYSTEM_PROMPT_GUARDRAILS}

Target Journal Details:
${wrapPromptContext("target_journal", journalContent)}

Manuscript Under Evaluation:
${wrapPromptContext("manuscript_submission", manuscriptContent)}

${authorHistory ? wrapPromptContext("author_history", authorHistory, "Historical publication track record") : ""}

Evaluate the manuscript objectively based strictly on:
1. Scope match (does it fit the journal's field and impact level?)
2. Originality & Significance (based on title, abstract, and key findings)
3. Structural adherence (does it seem to contain what the journal requires?)

Provide a probability score (0-100), reasoning, strengths, weaknesses, and recommendations.
`.trim();

  try {
    const { result } = await withModelFallback(
      async (candidate) => {
        return withTimeout(
          generateObject({
            model: openai(candidate.model),
            schema: PredictionResultSchema,
            prompt,
          }),
          timeoutMs,
          `predictAcceptance(${candidate.model})`
        );
      },
      {
        candidates: uniqueCandidates,
        operationName: "predictAcceptance",
        retryOptions: { maxRetries },
      }
    );

    return result.object;
  } catch (error: any) {
    const safeErrMsg = redactApiKeys(error?.message || String(error));
    console.error("[predictAcceptance] Failed across candidate models:", safeErrMsg);
    throw new Error(`Acceptance prediction failed: ${safeErrMsg}`);
  }
}
