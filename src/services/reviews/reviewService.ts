import { z } from "zod";
import { generateObject, generateText, getOpenAIModelInstance } from "../ai/aiService";

export interface ReviewPoint {
  id?: string;
  reviewerId: string;
  pointNumber: number;
  comment: string;
  category?: "methodology" | "clarity" | "literature" | "data" | "grammar" | "general";
  severity?: "major" | "minor" | "suggestion";
  suggestedAction?: string;
  draftResponse: string;
}

export interface ProcessReviewOptions {
  paperTitle?: string;
  manuscriptContext?: string;
  model?: string;
  apiKey?: string;
  temperature?: number;
}

export interface ProcessReviewResult {
  summary: string;
  comments: ReviewPoint[];
  totalComments: number;
}

/**
 * Fallback heuristic parser when AI SDK or API keys are unavailable.
 * Parses raw text into discrete reviewer points and provides high-quality template responses.
 */
export function fallbackParseReviewComments(
  rawText: string,
  options?: ProcessReviewOptions
): ProcessReviewResult {
  const lines = rawText.split(/\r?\n/);
  const comments: ReviewPoint[] = [];

  let currentReviewer = "Reviewer 1";
  let currentPointNumber = 0;
  let currentCommentBuffer: string[] = [];
  const currentCategory: ReviewPoint["category"] = "general";
  const currentSeverity: ReviewPoint["severity"] = "minor";

  const flushCurrent = () => {
    if (currentCommentBuffer.length > 0) {
      const fullComment = currentCommentBuffer.join(" ").trim();
      if (fullComment.length > 0) {
        currentPointNumber++;
        
        // Infer category from text
        const lower = fullComment.toLowerCase();
        let cat: ReviewPoint["category"] = "general";
        if (/(method|protocol|control|assay|algorithm|model|parameter|experiment)/i.test(lower)) {
          cat = "methodology";
        } else if (/(data|result|figure|table|p-value|statistic|statistically|sample)/i.test(lower)) {
          cat = "data";
        } else if (/(clarify|unclear|explain|confusing|ambiguous|readable|flow)/i.test(lower)) {
          cat = "clarity";
        } else if (/(cite|citation|reference|prior work|literature|author|paper)/i.test(lower)) {
          cat = "literature";
        } else if (/(typo|grammar|spelling|punctuation|wording|tense)/i.test(lower)) {
          cat = "grammar";
        }

        // Infer severity
        let sev: ReviewPoint["severity"] = "minor";
        if (/(major|crucial|essential|fatal|flaw|critical|invalid|fundamental)/i.test(lower)) {
          sev = "major";
        } else if (/(suggest|consider|minor|optional|typo|spelling|could)/i.test(lower)) {
          sev = "suggestion";
        }

        // Build suggested action
        let action = "Revise and clarify the corresponding section in the manuscript.";
        if (cat === "methodology") {
          action = "Expand experimental methodology and detail validation controls.";
        } else if (cat === "data") {
          action = "Provide supporting data, statistics, or supplementary figures.";
        } else if (cat === "literature") {
          action = "Incorporate cited references and contextualize within prior literature.";
        } else if (cat === "grammar") {
          action = "Perform copyediting and fix grammatical inaccuracies.";
        }

        // Generate polite and academic draft response
        const draftResponse = `Thank you for this valuable ${sev} observation regarding ${cat}. We agree with the reviewer and have revised the manuscript accordingly. Specifically, we have updated the text to address this concern and provided additional clarification in the revised draft.`;

        comments.push({
          id: `rc-${Date.now()}-${comments.length + 1}`,
          reviewerId: currentReviewer,
          pointNumber: currentPointNumber,
          comment: fullComment,
          category: cat,
          severity: sev,
          suggestedAction: action,
          draftResponse,
        });
      }
      currentCommentBuffer = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushCurrent();
      continue;
    }

    // Check for Reviewer header
    const reviewerHeaderMatch = trimmed.match(/^(?:(?:Reviewer|Referee)\s*([0-9]+|#?[0-9]+)|Editor(?:\x27s)?\s*(?:Comments)?)/i);
    if (reviewerHeaderMatch) {
      flushCurrent();
      if (/editor/i.test(trimmed)) {
        currentReviewer = "Editor";
      } else {
        const num = reviewerHeaderMatch[1]?.replace("#", "") || "1";
        currentReviewer = `Reviewer ${num}`;
      }
      currentPointNumber = 0;
      continue;
    }

    // Check for numbered point or bullet
    const itemMatch = trimmed.match(/^(?:(?:[0-9]+[.)]|\([0-9]+\)|\[[0-9]+\]|[-*•]|Point\s*[0-9]+[:.]?|Comment\s*[0-9]+[:.]?)\s+)(.+)$/i);
    if (itemMatch) {
      flushCurrent();
      currentCommentBuffer.push(itemMatch[1] || trimmed);
    } else {
      currentCommentBuffer.push(trimmed);
    }
  }

  flushCurrent();

  // If text was a single unformatted paragraph or no points detected
  if (comments.length === 0 && rawText.trim().length > 0) {
    comments.push({
      id: `rc-${Date.now()}-1`,
      reviewerId: "Reviewer 1",
      pointNumber: 1,
      comment: rawText.trim(),
      category: "general",
      severity: "minor",
      suggestedAction: "Address the reviewer feedback across the manuscript.",
      draftResponse: "Thank you for reviewing our manuscript. We have carefully reviewed your feedback and implemented comprehensive revisions to improve the clarity, rigor, and presentation of our work.",
    });
  }

  return {
    summary: `Successfully parsed ${comments.length} discrete reviewer comment point(s).`,
    comments,
    totalComments: comments.length,
  };
}

/**
 * Core function that accepts raw reviewer comments text, parses it into
 * discrete individual points, and generates an AI draft response for each point.
 */
export async function processReviewComments(
  rawText: string,
  options?: ProcessReviewOptions
): Promise<ProcessReviewResult> {
  if (!rawText || !rawText.trim()) {
    return {
      summary: "No reviewer comments provided.",
      comments: [],
      totalComments: 0,
    };
  }

  try {
    const model = getOpenAIModelInstance(options?.model || "gpt-4o", options?.apiKey);

    const prompt = `You are an elite academic peer-review analyst and manuscript rebuttal strategist for high-impact journals.
Your task is to analyze the provided raw reviewer comments block, separate them into discrete actionable points, and compose an articulate, polite, and persuasive AI draft author response for every point.

Manuscript Title: ${options?.paperTitle || "Scientific Manuscript"}
${options?.manuscriptContext ? `Manuscript Context / Abstract:\n${options.manuscriptContext}\n` : ""}

Raw Reviewer Comments:
"""
${rawText}
"""

Deconstruct these comments into individual discrete points. For each point:
1. Identify the reviewer (e.g. "Reviewer 1", "Reviewer 2", "Editor").
2. Assign the sequential point number for that reviewer.
3. Isolate the discrete comment / critique.
4. Classify category (methodology, clarity, literature, data, grammar, general) and severity (major, minor, suggestion).
5. Recommend a suggestedAction.
6. Generate a formal, respectful, evidence-based author draftResponse directly addressing the concern.`;

    const { object } = await generateObject({
      model,
      schema: z.object({
        summary: z.string().describe("Executive summary of all reviewer comments"),
        comments: z.array(
          z.object({
            reviewerId: z.string().default("Reviewer 1").describe("Identifier such as Reviewer 1, Reviewer 2, Editor"),
            pointNumber: z.number().describe("Sequential point number for this reviewer"),
            comment: z.string().describe("The isolated discrete comment or question"),
            category: z.enum(["methodology", "clarity", "literature", "data", "grammar", "general"]).default("general"),
            severity: z.enum(["major", "minor", "suggestion"]).default("minor"),
            suggestedAction: z.string().optional().describe("Specific revision action"),
            draftResponse: z.string().describe("Academic author rebuttal / draft response"),
          })
        ),
      }),
      prompt,
      temperature: options?.temperature ?? 0.2,
    });

    const commentsWithIds: ReviewPoint[] = object.comments.map((c, idx) => ({
      ...c,
      id: `rc-${Date.now()}-${idx + 1}`,
    }));

    return {
      summary: object.summary,
      comments: commentsWithIds,
      totalComments: commentsWithIds.length,
    };
  } catch (error: any) {
    console.warn("[reviewService] generateObject failed or OpenAI unavailable, falling back to heuristic parser:", error?.message);
    return fallbackParseReviewComments(rawText, options);
  }
}

export class ReviewService {
  /**
   * Process raw reviewer comments into discrete points with AI draft responses.
   */
  async processReviewComments(
    rawText: string,
    options?: ProcessReviewOptions
  ): Promise<ProcessReviewResult> {
    return processReviewComments(rawText, options);
  }

  /**
   * Alias for processReviewComments.
   */
  async parseAndDraftResponses(
    rawText: string,
    options?: ProcessReviewOptions
  ): Promise<ProcessReviewResult> {
    return processReviewComments(rawText, options);
  }
}

export const reviewService = new ReviewService();
