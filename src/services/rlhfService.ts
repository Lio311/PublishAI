import { db } from "@/services/db";
import { rlhfFeedbackLogs, promptStrategies, abTestAllocations, journals, submissions, paperVersions, journalConnections } from "@/services/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import fs from "fs/promises";
import path from "path";
import os from "os";

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

export async function exportDatasetForFineTuning(
  journalId?: number, 
  outcomeFilter?: 'accepted' | 'rejected' | 'revision_required'
): Promise<string> {
  const conditions = [];
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

export async function assignPromptStrategy(submissionId: number): Promise<string> {
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

export async function getJournalAnalytics(journalId: number): Promise<any> {
  const stats = await db.select({
    outcome: rlhfFeedbackLogs.outcome,
    count: sql<number>`count(*)`
  })
  .from(rlhfFeedbackLogs)
  .where(eq(rlhfFeedbackLogs.journalId, journalId))
  .groupBy(rlhfFeedbackLogs.outcome);

  const total = stats.reduce((acc, curr) => acc + Number(curr.count), 0);
  
  const timelineData = await db.select({
    date: sql<string>`DATE(${rlhfFeedbackLogs.createdAt})`,
    outcome: rlhfFeedbackLogs.outcome,
    count: sql<number>`count(*)`
  })
  .from(rlhfFeedbackLogs)
  .where(eq(rlhfFeedbackLogs.journalId, journalId))
  .groupBy(sql`DATE(${rlhfFeedbackLogs.createdAt})`, rlhfFeedbackLogs.outcome)
  .orderBy(sql`DATE(${rlhfFeedbackLogs.createdAt})`);

  const timelineMap = new Map<string, any>();
  for (const row of timelineData) {
    if (!timelineMap.has(row.date)) {
      timelineMap.set(row.date, { date: row.date, accepted: 0, rejected: 0, revision: 0, total: 0 });
    }
    const entry = timelineMap.get(row.date);
    if (row.outcome === 'accepted') entry.accepted = Number(row.count);
    if (row.outcome === 'rejected') entry.rejected = Number(row.count);
    if (row.outcome === 'revision_required') entry.revision = Number(row.count);
    entry.total += Number(row.count);
    timelineMap.set(row.date, entry);
  }

  const timelineArray = Array.from(timelineMap.values()).map(entry => ({
    ...entry,
    successRate: entry.total > 0 ? ((entry.accepted / entry.total) * 100).toFixed(1) : 0
  }));

  return {
    totalSubmissions: total,
    outcomes: stats.map(s => ({
      status: s.outcome,
      count: Number(s.count),
      percentage: total > 0 ? (Number(s.count) / total) * 100 : 0
    })),
    timeline: timelineArray
  };
}
