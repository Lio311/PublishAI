import { openai } from "@ai-sdk/openai";
import { db } from "@/services/db";
import { aiSystemFeedback } from "@/services/db/schema";
import { generateObject } from "@/services/ai/aiService";
import { resolveProvider } from "@/services/ai/aiService";
import { z } from "zod";
import { eq, and } from "drizzle-orm";

const feedbackExtractionSchema = z.object({
  category: z.enum([
    'tone_and_style',
    'scientific_accuracy',
    'hallucination',
    'formatting',
    'logic_and_flow',
    'other'
  ]).describe("Categorize the core issue or preference highlighted by the feedback."),
  productInsight: z.string().describe("Internal telemetry note for the product team. What did the AI do wrong, or what did the user want?"),
  isActionable: z.boolean().describe("True if this feedback can be generalized into a rule for future AI prompts."),
  ruleText: z.string().nullable().describe("The actionable rule to inject into future prompts. E.g., 'Avoid passive voice'. Null if not actionable or not generalizable.")
});

/**
 * Extracts learning rules and telemetry from user rewrite instructions.
 */
export async function extractUserRewriteFeedback(
  userId: string,
  originalText: string,
  userFeedback: string,
  mode: string,
  journalId?: number
): Promise<void> {
  const prompt = `
You are analyzing user feedback on an AI-generated academic text.
The user asked to rewrite the text with the following instructions:
"${userFeedback}"

Original Text (snippet):
"${originalText.substring(0, 500)}..."

Rewrite Mode: ${mode}

Your task is to analyze this feedback for two purposes:
1. Product Telemetry: Categorize the feedback and write a brief insight on what the AI struggled with or what the user wanted.
2. Prompt Injection Rule: If this is a generalizable preference (e.g., tone, style, specific terminology), extract it into a short, direct rule (e.g., "Always use active voice" or "Prefer the term 'participants' over 'subjects'"). If it's a specific instruction only relevant to this exact text (e.g., "Add a sentence about Smith's 2021 paper"), set isActionable to false and ruleText to null.
`;

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"), // Fast model for telemetry
      schema: feedbackExtractionSchema,
      prompt,
    });

    await db.insert(aiSystemFeedback).values({
      userId,
      journalId: journalId || null,
      sourceType: "user_rewrite",
      category: object.category,
      productInsight: object.productInsight,
      isActionable: object.isActionable,
      ruleText: object.ruleText,
    });
  } catch (error) {
    console.error("Failed to extract user rewrite feedback:", error);
  }
}

/**
 * Extracts learning rules and telemetry from reviewer comments (outcomes).
 */
export async function extractReviewerFeedback(
  submissionId: number,
  journalId: number,
  outcome: 'accepted' | 'rejected' | 'revision_required',
  reviewerComments: string
): Promise<void> {
  const prompt = `
You are analyzing peer reviewer feedback for a scientific paper submission.
Outcome: ${outcome}
Reviewer Comments:
"${reviewerComments}"

Your task is to analyze this feedback for two purposes:
1. Product Telemetry: Categorize the main criticism or praise and write an insight on what the AI-generated paper lacked or did well.
2. Prompt Injection Rule: If the reviewers highlight a generalizable preference or pitfall for this journal (e.g., "Lacks deep statistical methodology", "Formatting doesn't match journal guidelines"), extract a short rule for the AI when drafting future papers for this journal.
`;

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o"), // Stronger model for parsing complex reviewer comments
      schema: feedbackExtractionSchema,
      prompt,
    });

    // Check for existing feedback record to ensure step idempotency on retries
    const existing = await db
      .select({ id: aiSystemFeedback.id })
      .from(aiSystemFeedback)
      .where(
        and(
          eq(aiSystemFeedback.sourceId, submissionId.toString()),
          eq(aiSystemFeedback.sourceType, "reviewer_feedback")
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(aiSystemFeedback)
        .set({
          journalId,
          category: object.category,
          productInsight: object.productInsight,
          isActionable: object.isActionable,
          ruleText: object.ruleText,
        })
        .where(eq(aiSystemFeedback.id, existing[0].id));
      return;
    }

    await db.insert(aiSystemFeedback).values({
      journalId,
      sourceType: "reviewer_feedback",
      sourceId: submissionId.toString(),
      category: object.category,
      productInsight: object.productInsight,
      isActionable: object.isActionable,
      ruleText: object.ruleText,
    });
  } catch (error) {
    console.error("Failed to extract reviewer feedback:", error);
    throw error;
  }
}

/**
 * Retrieves applicable actionable rules for a user and/or journal.
 */
export async function getApplicableRules(userId?: string, journalId?: number): Promise<string> {
  const conditions = [eq(aiSystemFeedback.isActionable, true)];
  
  if (userId && journalId) {
    // Should match (userId = userId OR journalId = journalId)
    // To keep it simple, fetch all and filter in memory, or use `or` from drizzle.
    // Let's do two queries or an OR query.
  }

  // A simplified approach for now:
  let rulesText = "";

  if (userId) {
    const userRules = await db.select().from(aiSystemFeedback).where(
      and(
        eq(aiSystemFeedback.userId, userId),
        eq(aiSystemFeedback.isActionable, true)
      )
    );
    if (userRules.length > 0) {
      rulesText += "User specific writing preferences:\n";
      userRules.forEach(r => {
        if (r.ruleText) rulesText += `- ${r.ruleText}\n`;
      });
    }
  }

  if (journalId) {
    const journalRules = await db.select().from(aiSystemFeedback).where(
      and(
        eq(aiSystemFeedback.journalId, journalId),
        eq(aiSystemFeedback.isActionable, true)
      )
    );
    if (journalRules.length > 0) {
      rulesText += "\nJournal specific requirements and past reviewer feedback:\n";
      journalRules.forEach(r => {
        if (r.ruleText) rulesText += `- ${r.ruleText}\n`;
      });
    }
  }

  return rulesText;
}
