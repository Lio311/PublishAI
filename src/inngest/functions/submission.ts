import { NonRetriableError } from "inngest";
import { inngest } from "../client";
import { submissionProcessEvent } from "../events";
import { db } from "@/services/db";
import { submissions, papers, users, rpaJobs } from "@/services/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { buildSubmissionPayload, loadConnection, recordAttemptOutcome } from "@/services/rpa/submission-job";
import {
  sendSubmissionSuccessEmail,
  sendSubmissionFailedEmail,
} from "@/services/email/submission-email";

/**
 * The portal bot drives a real browser through Playwright. It is loaded only when a submission
 * actually runs, so the rest of the Inngest functions still load on hosts without a browser
 * (such as Vercel functions).
 */
async function loadSubmissionBot() {
  try {
    const { runSubmissionWorkflow } = await import("@/services/rpa/submission-bot");
    return runSubmissionWorkflow;
  } catch (error) {
    throw new NonRetriableError(
      "Automated portal submission needs a browser runtime (Playwright), which is not available on this deployment.",
      { cause: error }
    );
  }
}

export const processSubmission = inngest.createFunction(
  {
    id: "process-submission",
    triggers: [submissionProcessEvent],
    concurrency: {
      key: "event.data.submissionId",
      limit: 1,
    },
    idempotency: "event.data.submissionId",
    retries: 3,
    onFailure: async ({ event, step, error }) => {
      const submissionId =
        event.data.event?.data?.submissionId;

      if (submissionId) {
        await step.run("mark-failed", async () => {
          await db
            .update(submissions)
            .set({
              status: "failed",
              errorLog: error?.message || "Unknown error",
            })
            .where(eq(submissions.id, submissionId));
          await db
            .update(rpaJobs)
            .set({ status: "error", errorLog: error?.message || "Unknown error", updatedAt: new Date() })
            .where(and(eq(rpaJobs.submissionId, submissionId), inArray(rpaJobs.status, ["pending", "running", "paused"])));
        });

        // Notify user of submission failure
        await step.run("send-failure-email", async () => {
          try {
            const sub = await db.query.submissions.findFirst({
              where: eq(submissions.id, submissionId),
            });
            if (!sub) return;

            const [user] = await db
              .select({ email: users.email })
              .from(users)
              .where(eq(users.id, sub.userId));
            const [paper] = await db
              .select({ title: papers.title })
              .from(papers)
              .where(eq(papers.id, sub.paperId));

            if (user?.email && paper?.title) {
              await sendSubmissionFailedEmail(
                user.email,
                paper.title,
                error?.message || "Submission encountered an unexpected error"
              );
            }
          } catch (e) {
            console.error("Failed to send failure email notification:", e);
          }
        });
      }
    },
  },
  async ({ event, step }) => {
    const { submissionId } = event.data;

    // Increment attempt count, mark status and open an RPA job the UI can track
    const jobId = await step.run("start-submission-job", async () => {
      const sub = await db.query.submissions.findFirst({
        where: eq(submissions.id, submissionId),
      });
      if (!sub) throw new NonRetriableError(`Submission ${submissionId} not found`);

      await db
        .update(submissions)
        .set({
          attemptCount: (sub.attemptCount || 0) + 1,
          lastAttemptAt: new Date(),
          status: "submitting",
        })
        .where(eq(submissions.id, submissionId));

      const [job] = await db
        .insert(rpaJobs)
        .values({ submissionId, status: "running", currentStep: "logging_in" })
        .returning({ id: rpaJobs.id });
      return job.id;
    });

    const runAttempt = (stepId: string, resume?: { captchaSolution?: string; twoFACode?: string }) =>
      step.run(stepId, async () => {
        const runSubmissionWorkflow = await loadSubmissionBot();
        const result = await runSubmissionWorkflow(String(submissionId), await loadConnection(submissionId, jobId, resume), await buildSubmissionPayload(submissionId));
        return recordAttemptOutcome(jobId, result);
      });

    let outcome = await runAttempt("execute-submission");

    if (outcome.status === "requires_captcha") {
      const captchaEvent = await step.waitForEvent("wait-for-captcha", {
        event: "submission/captcha-solved",
        timeout: "24h",
        match: "data.submissionId",
      });
      if (!captchaEvent) {
        throw new NonRetriableError("Captcha not solved within 24 hours");
      }
      outcome = await runAttempt("resume-submission-after-captcha", { captchaSolution: captchaEvent.data.solution });
    }

    if (outcome.status === "requires_2fa") {
      const twoFAEvent = await step.waitForEvent("wait-for-2fa", {
        event: "submission/2fa-solved",
        timeout: "1h",
        match: "data.submissionId",
      });
      if (!twoFAEvent) {
        throw new NonRetriableError("2FA not completed within 1 hour");
      }
      outcome = await runAttempt("resume-submission-after-2fa", { twoFACode: twoFAEvent.data.code });
    }

    if (outcome.status !== "success") {
      // A second roadblock or an error after resuming: fail (onFailure marks the submission).
      throw new Error(`Submission did not complete: ${outcome.message || outcome.status}`);
    }
    const result = outcome;

    await step.run("mark-submitted", async () => {
      await db
        .update(submissions)
        .set({
          status: "submitted",
          submittedAt: new Date(),
          confirmationId: result.trackingId ?? null,
          errorLog: null,
        })
        .where(eq(submissions.id, submissionId));
    });

    // Send real confirmation email to author
    await step.run("send-confirmation-email", async () => {
      try {
        const sub = await db.query.submissions.findFirst({
          where: eq(submissions.id, submissionId),
        });
        if (!sub) return;

        const [user] = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, sub.userId));
        const [paper] = await db
          .select({ title: papers.title })
          .from(papers)
          .where(eq(papers.id, sub.paperId));

        if (user?.email && paper?.title) {
          const postUrl = sub.remotePostUrl || "";
          await sendSubmissionSuccessEmail(
            user.email,
            paper.title,
            postUrl,
            { confirmationId: result.trackingId || sub.confirmationId || undefined }
          );
        }
      } catch (e) {
        console.error("Failed to send submission success email notification:", e);
      }
    });

    return { success: true, trackingId: result.trackingId };
  }
);
