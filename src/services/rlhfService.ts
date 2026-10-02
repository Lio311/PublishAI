import { db } from "@/services/db";
import { rlhfFeedbackLogs, submissions, paperVersions, journalConnections } from "@/services/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function logFeedbackOutcome(
  submissionId: number, 
  outcome: 'accepted' | 'rejected' | 'revision_required', 
  reviewerComments?: string
): Promise<void> {
  const submission = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId)
  });

  if (!submission) {
    throw new Error("Submission not found");
  }

  const connection = await db.query.journalConnections.findFirst({
    where: eq(journalConnections.id, submission.connectionId)
  });

  const latestVersion = await db.query.paperVersions.findFirst({
    where: eq(paperVersions.paperId, submission.paperId),
    orderBy: [desc(paperVersions.versionNumber)]
  });

  if (!connection || !connection.journalId || !latestVersion) {
    throw new Error("Could not find related connection or paper version");
  }

  // Check for existing log to guarantee idempotency on retries
  const existing = await db.query.rlhfFeedbackLogs.findFirst({
    where: and(
      eq(rlhfFeedbackLogs.submissionId, submissionId),
      eq(rlhfFeedbackLogs.paperVersionId, latestVersion.id),
      eq(rlhfFeedbackLogs.outcome, outcome)
    )
  });

  if (existing) {
    await db.update(rlhfFeedbackLogs).set({
      reviewerComments,
      journalId: connection.journalId as number,
    }).where(eq(rlhfFeedbackLogs.id, existing.id));
    return;
  }

  await db.insert(rlhfFeedbackLogs).values({
    submissionId,
    paperVersionId: latestVersion.id,
    journalId: connection.journalId as number,
    outcome,
    reviewerComments,
    correctionData: {}
  });
}

/** Builds the fine-tuning dataset as JSONL (one prompt/completion pair per line). */
export async function buildFineTuningDataset(
  journalId?: number,
  outcomeFilter?: 'accepted' | 'rejected' | 'revision_required'
): Promise<string> {
  const conditions = [];
  if (journalId) conditions.push(eq(rlhfFeedbackLogs.journalId, journalId));
  if (outcomeFilter) conditions.push(eq(rlhfFeedbackLogs.outcome, outcomeFilter));

  const query = db.select().from(rlhfFeedbackLogs);
  const results = conditions.length > 0 ? await query.where(and(...conditions)) : await query;

  return results.map(row => JSON.stringify({
    prompt: row.correctionData,
    completion: row.outcome
  })).join("\n");
}

/**
 * Stores the dataset in private Blob storage. Serverless /tmp is discarded after
 * the invocation, so a file path there is useless to anyone.
 */
export async function storeFineTuningDataset(
  outcomeFilter?: 'accepted' | 'rejected' | 'revision_required'
): Promise<{ url: string; examples: number }> {
  const jsonl = await buildFineTuningDataset(undefined, outcomeFilter);
  const { put } = await import("@vercel/blob");
  const date = new Date().toISOString().slice(0, 10);
  const blob = await put(`datasets/finetune_${outcomeFilter ?? "all"}_${date}.jsonl`, jsonl, {
    access: "private",
    addRandomSuffix: true,
    contentType: "application/x-ndjson",
  });
  return { url: blob.url, examples: jsonl ? jsonl.split("\n").length : 0 };
}
