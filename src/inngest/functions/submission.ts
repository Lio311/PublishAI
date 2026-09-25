import { inngest } from "../client";
import { db } from "@/services/db";
import { submissions } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { runSubmissionWorkflow } from "@/services/rpa/submission-bot";

export const processSubmission = inngest.createFunction(
  { 
    id: "process-submission", 
    event: "submission/process", 
    retries: 3,
    onFailure: async ({ event, step }: { event: any, step: any }) => {
      const submissionId = event.data.event.data.submissionId;
      if (submissionId) {
        await step.run("mark-failed", async () => {
          await db.update(submissions).set({ status: "failed" }).where(eq(submissions.id, submissionId));
        });
      }
    }
  } as any,
  async ({ event, step }: { event: any, step: any }) => {
    const { submissionId } = event.data;

    // Increment attempt count
    await step.run("update-attempt-count", async () => {
      const sub = await db.query.submissions.findFirst({ where: eq(submissions.id, submissionId) });
      if (sub) {
        await db.update(submissions).set({
          attemptCount: (sub.attemptCount || 0) + 1,
          lastAttemptAt: new Date(),
          status: "submitting",
        }).where(eq(submissions.id, submissionId));
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
      // Throwing an error will cause Inngest to retry the function based on the retry policy
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
        
        // Pass the solution back to the navigator to continue
        return await runSubmissionWorkflow(submissionId.toString(), {
          siteUrl: conn.siteUrl,
          username: decrypt(conn.encryptedUsername),
          password: decrypt(conn.encryptedPassword),
          captchaSolution: captchaEvent.data.solution,
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

    // Step to send confirmation email
    await step.run("send-confirmation-email", async () => {
      // Email sending logic here
      // import { sendSubmissionSuccessEmail } from "@/services/email/submission-email";
      // await sendSubmissionSuccessEmail(user.email, paper.title, result.postUrl);
    });

    return { success: true };
  }
);
