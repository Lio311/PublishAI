import { extractReviewerFeedback } from "@/services/learningService";
import { db } from "@/services/db";
import { sql } from "drizzle-orm";
import { inngest } from "@/inngest/client";
import { submissionStatusUpdatedEvent } from "../events";
import { logFeedbackOutcome } from "@/services/rlhfService";

export const processSubmissionOutcome = inngest.createFunction(
  {
    id: "process-submission-outcome",
    triggers: [submissionStatusUpdatedEvent],
    concurrency: {
      key: "event.data.submissionId",
      limit: 1,
    },
    idempotency: "event.data.submissionId",
    retries: 2,
  },
  async ({ event, step }) => {
    const { submissionId, status, comments } = event.data;

    let outcome: "accepted" | "rejected" | "revision_required" | null = null;
    if (status === "accepted") outcome = "accepted";
    else if (status === "rejected") outcome = "rejected";
    else if (status === "needs_revision" || status === "revision_requested") {
      outcome = "revision_required";
    }

    if (outcome) {
      await step.run("log-feedback-outcome", async () => {
        await logFeedbackOutcome(submissionId, outcome!, comments);
      });

      await step.run("extract-reviewer-analytics", async () => {
        if (!comments) return;

        // Fetch target journalId via papers table
        const res = await db.execute(sql`
          SELECT p.target_journal_id 
          FROM submissions s 
          JOIN papers p ON s.paper_id = p.id 
          WHERE s.id = ${submissionId}
        `);
        const target_journal_id = res.rows[0]?.target_journal_id;

        if (target_journal_id) {
          await extractReviewerFeedback(
            submissionId,
            target_journal_id as number,
            outcome!,
            comments
          );
        }
      });
    }

    return { success: true, processedOutcome: outcome };
  }
);
