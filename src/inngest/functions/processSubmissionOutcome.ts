import { inngest } from "@/inngest/client";
import { logFeedbackOutcome } from "@/services/rlhfService";

export const processSubmissionOutcome = inngest.createFunction(
  { id: "process-submission-outcome", event: "submission.status.updated" } as any,
  async ({ event, step }: { event: any, step: any }) => {
    const { submissionId, status, comments } = event.data;
    
    let outcome: 'accepted' | 'rejected' | 'revision_required' | null = null;
    if (status === 'accepted') outcome = 'accepted';
    else if (status === 'rejected') outcome = 'rejected';
    else if (status === 'needs_revision') outcome = 'revision_required';
    
    if (outcome) {
      await step.run('log-feedback-outcome', async () => {
        await logFeedbackOutcome(submissionId, outcome, comments);
      });
    }
  }
);
