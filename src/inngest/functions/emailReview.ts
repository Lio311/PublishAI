import { inngest } from "../client";
import {
  emailReviewReceivedEvent,
  paperReviewerCommentsReceivedEvent,
} from "../events";
import { processIncomingReviewEmail } from "@/services/emailService";
import { db } from "@/services/db";
import { submissions, reviewThreads, reviewComments } from "@/services/db/schema";
import { eq } from "drizzle-orm";

export const processIncomingEmailReview = inngest.createFunction(
  {
    id: "process-incoming-email-review",
    triggers: [emailReviewReceivedEvent],
    concurrency: {
      key: "event.data.sender",
      limit: 2,
    },
    idempotency: "event.data.id",
    retries: 2,
  },
  async ({ event, step }) => {
    const emailData = event.data;

    // Step 1: Run the asynchronous PDF parsing and submission correlation
    const result = await step.run("extract-email-review-data", async () => {
      return await processIncomingReviewEmail({
        sender: emailData.sender,
        recipient: emailData.recipient,
        subject: emailData.subject,
        body: emailData.body,
        attachments: emailData.attachments,
      });
    });

    // Step 2: If a matching submission was identified and review comments were extracted
    if (result.submissionId && result.comments.length > 0) {
      const subIdNum = Number(result.submissionId);

      await step.run("persist-review-comments-and-notify", async () => {
        if (!isNaN(subIdNum)) {
          const sub = await db.query.submissions.findFirst({
            where: eq(submissions.id, subIdNum),
          });

          if (sub) {
            // Persist review thread and comments to database
            const [thread] = await db
              .insert(reviewThreads)
              .values({
                submissionId: subIdNum,
                title: `Review received via email from ${emailData.sender}`,
                reviewerId: emailData.sender,
                status: "pending",
                roundNumber: 1,
                rawReport: emailData.body,
              })
              .returning();

            for (let i = 0; i < result.comments.length; i++) {
              await db.insert(reviewComments).values({
                threadId: thread.id,
                commentNumber: i + 1,
                reviewerText: result.comments[i],
                status: "pending",
                category: "review-feedback",
              });
            }

            // Trigger resubmission/rebuttal workflow if paperId is associated
            if (sub.paperId) {
              await inngest.send({
                name: "paper/reviewer-comments-received",
                data: {
                  paperId: sub.paperId,
                  reviewerComments: result.comments.join("\n\n"),
                },
              });
            }
          }
        }
      });
    }

    return {
      success: true,
      submissionId: result.submissionId,
      commentsCount: result.comments.length,
    };
  }
);
