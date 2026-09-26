import { inngest } from "../client";
import { submissionProcessEvent } from "../events";
import { db } from "@/services/db";
import { submissions, papers, users } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { runSubmissionWorkflow } from "@/services/rpa/submission-bot";
import {
  sendSubmissionSuccessEmail,
  sendSubmissionFailedEmail,
} from "@/services/email/submission-email";

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
        (event.data as any)?.event?.data?.submissionId ??
        (event.data as any)?.submissionId;

      if (submissionId) {
        await step.run("mark-failed", async () => {
          await db
            .update(submissions)
            .set({
              status: "failed",
              errorLog: error?.message || "Unknown error",
            })
            .where(eq(submissions.id, submissionId));
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

    // Increment attempt count and mark status
    await step.run("update-attempt-count", async () => {
      const sub = await db.query.submissions.findFirst({
        where: eq(submissions.id, submissionId),
      });
      if (sub) {
        await db
          .update(submissions)
          .set({
            attemptCount: (sub.attemptCount || 0) + 1,
            lastAttemptAt: new Date(),
            status: "submitting",
          })
          .where(eq(submissions.id, submissionId));
      }
    });

    const result = await step.run("execute-submission", async () => {
      // Load connection details and decrypt credentials
      const sub = await db.query.submissions.findFirst({
        where: eq(submissions.id, submissionId),
        with: { connection: true } as any,
      });
      const conn = (sub as any)?.connection;
      if (!conn) throw new Error("No connection found for submission");

      const { decrypt } = await import("@/services/security/encryption");
      return await runSubmissionWorkflow(submissionId.toString(), {
        siteUrl: conn.siteUrl,
        username: decrypt(conn.encryptedUsername),
        password: decrypt(conn.encryptedPassword),
      });
    });

    if (result.status === "error") {
      // Throwing an error will cause Inngest to retry based on retry policy
      throw new Error(`Submission failed: ${result.message}`);
    }

    if (result.status === "requires_captcha") {
      const captchaEvent = await step.waitForEvent("wait-for-captcha", {
        event: "submission/captcha-solved",
        timeout: "24h",
        match: "data.submissionId",
      });

      if (!captchaEvent) {
        throw new Error("Captcha not solved within 24 hours");
      }

      await step.run("resume-submission-after-captcha", async () => {
        const sub = await db.query.submissions.findFirst({
          where: eq(submissions.id, submissionId),
          with: { connection: true } as any,
        });
        const conn = (sub as any)?.connection;
        if (!conn) throw new Error("No connection found for submission");

        const { decrypt } = await import("@/services/security/encryption");

        return await runSubmissionWorkflow(submissionId.toString(), {
          siteUrl: conn.siteUrl,
          username: decrypt(conn.encryptedUsername),
          password: decrypt(conn.encryptedPassword),
          captchaSolution: (captchaEvent.data as any).solution,
        } as any);
      });
    }

    if (result.status === "requires_2fa") {
      const twoFAEvent = await step.waitForEvent("wait-for-2fa", {
        event: "submission/2fa-solved",
        timeout: "1h",
        match: "data.submissionId",
      });

      if (!twoFAEvent) {
        throw new Error("2FA not completed within 1 hour");
      }
    }

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
