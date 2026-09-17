/**
 * Submission Status & Tracking Types for PublishAI
 */

/**
 * Low-level pipeline / execution status of a submission dispatch
 */
export type SubmissionPipelineStatus =
  | "draft"
  | "preparing"
  | "validating"
  | "submitting"
  | "submitted"
  | "failed";

/**
 * Editorial workflow status for journal submission lifecycle
 */
export type JournalSubmissionStatus =
  | "draft"
  | "submitted"
  | "with_editor"
  | "under_review"
  | "reviews_received"
  | "revision_requested"
  | "revised_submitted"
  | "accepted"
  | "in_proofs"
  | "published"
  | "rejected"
  | "withdrawn";

/**
 * Detailed editorial stage / sub-status
 */
export type EditorialStage =
  | "initial_qc"
  | "associate_editor_assigned"
  | "inviting_reviewers"
  | "peer_review_active"
  | "evaluating_reviews"
  | "awaiting_eic_decision"
  | "major_revision"
  | "minor_revision"
  | "copyediting"
  | "typesetting"
  | "final_publication";

/**
 * Information describing a status state
 */
export interface StatusMetadata {
  status: JournalSubmissionStatus;
  label: string;
  description: string;
  isTerminal: boolean;
  requiresAuthorAction: boolean;
  badgeVariant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline";
  recommendedAction?: string;
}

/**
 * Journal target profile
 */
export interface JournalTargetInfo {
  journalId?: number;
  journalName: string;
  publisher?: string;
  issn?: string;
  platform?: "wordpress" | "ojs" | "custom_api" | "email";
  submissionPortalUrl?: string;
  averageReviewDays?: number;
  impactFactor?: number;
}

/**
 * Individual status change log / audit entry
 */
export interface SubmissionStatusHistoryEntry {
  id: string;
  submissionId: number;
  previousStatus: JournalSubmissionStatus | null;
  newStatus: JournalSubmissionStatus;
  stage?: EditorialStage;
  timestamp: string;
  actor: "system" | "author" | "editor" | "webhook";
  notes?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Peer review comment / feedback summary attached to a status transition
 */
export interface ReviewDecisionFeedback {
  round: number;
  decision: "accept" | "minor_revision" | "major_revision" | "reject";
  editorComments?: string;
  decisionLetterUrl?: string;
  reviewersFeedback?: {
    reviewerNumber: number;
    recommendation?: string;
    publicComments: string;
    attachments?: string[];
  }[];
  revisionDeadline?: string;
}

/**
 * Comprehensive tracking summary for a submission
 */
export interface SubmissionTrackingSummary {
  submissionId: number;
  paperId: number;
  paperTitle: string;
  journal: JournalTargetInfo;
  currentStatus: JournalSubmissionStatus;
  pipelineStatus: SubmissionPipelineStatus;
  currentStage?: EditorialStage;
  manuscriptTrackingId?: string;
  submissionDate?: string;
  lastUpdatedDate: string;
  daysInCurrentStatus: number;
  totalDaysInWorkflow: number;
  history: SubmissionStatusHistoryEntry[];
  latestFeedback?: ReviewDecisionFeedback;
  nextStep?: {
    actionRequired: boolean;
    description: string;
    deadline?: string;
  };
}

/**
 * Validation rules for valid status transitions
 */
export const VALID_STATUS_TRANSITIONS: Record<JournalSubmissionStatus, JournalSubmissionStatus[]> = {
  draft: ["submitted", "withdrawn"],
  submitted: ["with_editor", "under_review", "rejected", "withdrawn"],
  with_editor: ["under_review", "revision_requested", "rejected", "withdrawn"],
  under_review: ["reviews_received", "revision_requested", "accepted", "rejected", "withdrawn"],
  reviews_received: ["revision_requested", "accepted", "rejected", "withdrawn"],
  revision_requested: ["revised_submitted", "withdrawn"],
  revised_submitted: ["with_editor", "under_review", "accepted", "rejected", "withdrawn"],
  accepted: ["in_proofs", "published", "withdrawn"],
  in_proofs: ["published", "withdrawn"],
  published: [],
  rejected: ["draft"], // Allows re-starting draft or resubmission after restructuring
  withdrawn: ["draft"],
};
