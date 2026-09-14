import { inngest } from "../client";
import { SubmissionService } from "@/lib/submission/submission-service";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { eq } from "drizzle-orm";

export const processSubmission = inngest.createFunction(
  { id: "process-submission", retries: 3 },
  { event: "submission/process" },
  async ({ event, step }) => {
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
      return await SubmissionService.executeSubmission(submissionId);
    });

    if (!result.success) {
      // Throwing an error will cause Inngest to retry the function based on the retry policy
      throw new Error(`Submission failed: ${result.error}`);
    }

    // Step to send confirmation email
    await step.run("send-confirmation-email", async () => {
      // Email sending logic here
      // import { sendEmail } from "@/lib/email/sender";
      // await sendEmail({ to: user.email, subject: "Submission Successful", ... });
    });

    return { success: true, confirmationId: result.confirmationId };
  }
);
