import { eq } from "drizzle-orm";
import { db } from "@/services/db";
import { journalConnections, journals, submissions } from "@/services/db/schema";

/**
 * Fans a submission status change out to the background workflows:
 * - every change feeds the outcome-learning (RLHF) job,
 * - a rejection starts the cascade job that recommends alternative journals.
 *
 * Failures are logged, never thrown: the status change itself already succeeded.
 */
export async function emitSubmissionStatusEvents(submissionId: number, status: string, comments?: string): Promise<void> {
  try {
    const { inngest } = await import("@/inngest/client");
    const events: Array<{ name: string; data: Record<string, unknown> }> = [
      { name: "submission/status-updated", data: { submissionId, status, ...(comments ? { comments } : {}) } },
    ];

    if (status === "rejected") {
      const [row] = await db
        .select({ paperId: submissions.paperId, journalName: journals.name, connectionName: journalConnections.displayName })
        .from(submissions)
        .leftJoin(journalConnections, eq(submissions.connectionId, journalConnections.id))
        .leftJoin(journals, eq(journalConnections.journalId, journals.id))
        .where(eq(submissions.id, submissionId));
      if (row) {
        events.push({
          name: "paper/rejected",
          data: { paperId: row.paperId, currentJournalName: row.journalName || row.connectionName || "" },
        });
      }
    }

    await inngest.send(events as Parameters<typeof inngest.send>[0]);
  } catch (error) {
    console.error(`[statusEvents] Failed to emit events for submission ${submissionId}:`, error);
  }
}
