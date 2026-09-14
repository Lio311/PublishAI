import { db } from "@/db";
import { rlhfFeedbackLogs, promptStrategies, abTestAllocations, journals } from "@/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";
import os from "os";

export async function logFeedbackOutcome(
  submissionId: string, 
  outcome: 'accepted' | 'rejected' | 'revision_required', 
  reviewerComments?: string
): Promise<void> {
  const submissions = (await db.execute(sql`SELECT "paper_version_id", "journal_id" FROM "submissions" WHERE "id" = ${submissionId}`)).rows;
  
  if (!submissions.length) {
    throw new Error("Submission not found");
  }

  const { paper_version_id, journal_id } = submissions[0];

  await db.insert(rlhfFeedbackLogs).values({
    submissionId,
    paperVersionId: paper_version_id as string,
    journalId: journal_id as string,
    outcome,
    reviewerComments,
    correctionData: {}
  });
}

export async function exportDatasetForFineTuning(
  journalId?: string, 
  outcomeFilter?: 'accepted' | 'rejected' | 'revision_required'
): Promise<string> {
  let conditions = [];
  if (journalId) conditions.push(eq(rlhfFeedbackLogs.journalId, journalId));
  if (outcomeFilter) conditions.push(eq(rlhfFeedbackLogs.outcome, outcomeFilter));

  const query = db.select().from(rlhfFeedbackLogs);
  const results = conditions.length > 0 
    ? await query.where(and(...conditions))
    : await query;

  const tmpDir = os.tmpdir();
  const filePath = path.join(tmpDir, `finetune_dataset_${Date.now()}.jsonl`);
  
  const lines = results.map(row => JSON.stringify({
    prompt: row.correctionData,
    completion: row.outcome
  })).join("\n");

  await fs.writeFile(filePath, lines);
  return filePath;
}

export async function assignPromptStrategy(submissionId: string): Promise<string> {
  const strategies = await db.select().from(promptStrategies).where(eq(promptStrategies.isActive, true));
  
  if (strategies.length === 0) {
    throw new Error("No active prompt strategies available");
  }

  const selected = strategies[Math.floor(Math.random() * strategies.length)];

  await db.insert(abTestAllocations).values({
    submissionId,
    promptStrategyId: selected.id
  });

  return selected.id;
}

export async function getJournalAnalytics(journalId: string): Promise<any> {
  const stats = await db.select({
    outcome: rlhfFeedbackLogs.outcome,
    count: sql<number>`count(*)`
  })
  .from(rlhfFeedbackLogs)
  .where(eq(rlhfFeedbackLogs.journalId, journalId))
  .groupBy(rlhfFeedbackLogs.outcome);

  const total = stats.reduce((acc, curr) => acc + Number(curr.count), 0);
  
  return {
    totalSubmissions: total,
    outcomes: stats.map(s => ({
      status: s.outcome,
      count: Number(s.count),
      percentage: total > 0 ? (Number(s.count) / total) * 100 : 0
    }))
  };
}
