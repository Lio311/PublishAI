import { eventType } from "inngest";
import { z } from "zod";

/**
 * Event Schemas and Types for Inngest
 */

// 1. Paper uploaded for processing
export const paperUploadedSchema = z.object({
  paperId: z.number().int(),
  textContent: z.string().optional(),
  paperVersionId: z.number().int().optional(),
  documentUrl: z.string().optional(),
});
export const paperUploadedEvent = eventType("paper/uploaded", {
  schema: paperUploadedSchema,
});

// 2. Paper reviewer comments received for resubmission/rebuttal
export const paperReviewerCommentsReceivedSchema = z.object({
  paperId: z.number().int(),
  reviewerComments: z.string(),
  versionId: z.number().int().optional(),
});
export const paperReviewerCommentsReceivedEvent = eventType(
  "paper/reviewer-comments-received",
  {
    schema: paperReviewerCommentsReceivedSchema,
  }
);

// 3. Paper rejected trigger for cascade workflow
export const paperRejectedSchema = z.object({
  paperId: z.number().int(),
  currentJournalName: z.string(),
});
export const paperRejectedEvent = eventType("paper/rejected", {
  schema: paperRejectedSchema,
});

// 4. Preflight execution check
export const paperPreflightSchema = z.object({
  code: z.string(),
  dependencies: z.array(z.string()).optional(),
  datasets: z
    .array(
      z.object({
        url: z.string(),
        filename: z.string(),
      })
    )
    .optional(),
});
export const paperPreflightEvent = eventType("paper/preflight", {
  schema: paperPreflightSchema,
});

// Preflight failure event
export const paperPreflightFailedSchema = z.object({
  error: z.any().optional(),
  stderr: z.string().optional(),
  code: z.string(),
});
export const paperPreflightFailedEvent = eventType("paper.preflight.failed", {
  schema: paperPreflightFailedSchema,
});

// Preflight success event
export const paperPreflightSuccessSchema = z.object({
  stdout: z.string().optional(),
  results: z.any().optional(),
});
export const paperPreflightSuccessEvent = eventType("paper.preflight.success", {
  schema: paperPreflightSuccessSchema,
});

// 5. Submission background process trigger
export const submissionProcessSchema = z.object({
  submissionId: z.number().int(),
});
export const submissionProcessEvent = eventType("submission/process", {
  schema: submissionProcessSchema,
});

// 6. Submission status updated (RLHF flywheel)
export const submissionStatusUpdatedSchema = z.object({
  submissionId: z.number().int(),
  status: z.string(),
  comments: z.string().optional(),
});
export const submissionStatusUpdatedEvent = eventType(
  "submission/status-updated",
  {
    schema: submissionStatusUpdatedSchema,
  }
);

// 7. Submission review started (Multi-agent debate)
export const submissionReviewStartedSchema = z.object({
  paperId: z.number().int(),
});
export const submissionReviewStartedEvent = eventType(
  "submission/review-started",
  {
    schema: submissionReviewStartedSchema,
  }
);

// 8. Captcha solved event
export const submissionCaptchaSolvedSchema = z.object({
  submissionId: z.number().int(),
  solution: z.string(),
});
export const submissionCaptchaSolvedEvent = eventType(
  "submission/captcha-solved",
  {
    schema: submissionCaptchaSolvedSchema,
  }
);

// 9. 2FA solved event
export const submission2FaSolvedSchema = z.object({
  submissionId: z.number().int(),
  code: z.string().optional(),
});
export const submission2FaSolvedEvent = eventType("submission/2fa-solved", {
  schema: submission2FaSolvedSchema,
});

// 10. Dataset uploaded (Data science sandbox)
export const datasetUploadedSchema = z.object({
  paperId: z.number().int(),
});
export const datasetUploadedEvent = eventType("dataset/uploaded", {
  schema: datasetUploadedSchema,
});

// 11. Document uploaded (RAG chunking and pgvector)
export const documentUploadedSchema = z.object({
  documentId: z.string(),
});
export const documentUploadedEvent = eventType("document/uploaded", {
  schema: documentUploadedSchema,
});

// 12. Vision QA trigger
export const qaFiguresAnalyzedSchema = z.object({
  paperId: z.number().int(),
  paperVersionId: z.number().int(),
});
export const qaFiguresAnalyzedEvent = eventType("qa.figures.analyzed", {
  schema: qaFiguresAnalyzedSchema,
});

export type PaperUploadedData = z.infer<typeof paperUploadedSchema>;
export type PaperReviewerCommentsReceivedData = z.infer<
  typeof paperReviewerCommentsReceivedSchema
>;
export type PaperRejectedData = z.infer<typeof paperRejectedSchema>;
export type PaperPreflightData = z.infer<typeof paperPreflightSchema>;
export type SubmissionProcessData = z.infer<typeof submissionProcessSchema>;
export type SubmissionStatusUpdatedData = z.infer<
  typeof submissionStatusUpdatedSchema
>;
export type SubmissionReviewStartedData = z.infer<
  typeof submissionReviewStartedSchema
>;
export type SubmissionCaptchaSolvedData = z.infer<
  typeof submissionCaptchaSolvedSchema
>;
export type Submission2FaSolvedData = z.infer<typeof submission2FaSolvedSchema>;
export type DatasetUploadedData = z.infer<typeof datasetUploadedSchema>;
export type DocumentUploadedData = z.infer<typeof documentUploadedSchema>;
export type QaFiguresAnalyzedData = z.infer<typeof qaFiguresAnalyzedSchema>;
