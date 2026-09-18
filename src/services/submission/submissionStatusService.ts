/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/services/db";
import { submissions, submissionLogs } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import {
  JournalSubmissionStatus,
  SubmissionPipelineStatus,
  EditorialStage,
  StatusMetadata,
  SubmissionTrackingSummary,
  SubmissionStatusHistoryEntry,
  ReviewDecisionFeedback,
  VALID_STATUS_TRANSITIONS,
} from "./types";

export const STATUS_METADATA: Record<JournalSubmissionStatus, StatusMetadata> = {
  draft: {
    status: "draft",
    label: "Draft",
    description: "Manuscript is in preparation and has not been dispatched to the journal.",
    isTerminal: false,
    requiresAuthorAction: true,
    badgeVariant: "outline",
    recommendedAction: "Complete checklist, attach cover letter, and submit.",
  },
  submitted: {
    status: "submitted",
    label: "Submitted",
    description: "Manuscript submitted to editorial office. Initial technical checks pending.",
    isTerminal: false,
    requiresAuthorAction: false,
    badgeVariant: "secondary",
    recommendedAction: "Monitor inbox for editorial office receipt confirmation.",
  },
  with_editor: {
    status: "with_editor",
    label: "With Editor",
    description: "Manuscript assigned to Associate Editor for initial scope and quality screening.",
    isTerminal: false,
    requiresAuthorAction: false,
    badgeVariant: "secondary",
    recommendedAction: "No author action required. Editor is deciding on peer review.",
  },
  under_review: {
    status: "under_review",
    label: "Under Review",
    description: "Manuscript sent out to peer reviewers.",
    isTerminal: false,
    requiresAuthorAction: false,
    badgeVariant: "default",
    recommendedAction: "Peer review in progress. Typical duration 4-8 weeks.",
  },
  reviews_received: {
    status: "reviews_received",
    label: "Reviews Received",
    description: "Peer reviewer comments received. Handling editor synthesizing decision.",
    isTerminal: false,
    requiresAuthorAction: false,
    badgeVariant: "secondary",
    recommendedAction: "Awaiting editorial decision letter.",
  },
  revision_requested: {
    status: "revision_requested",
    label: "Revision Requested",
    description: "Editorial decision issued requesting minor or major revisions.",
    isTerminal: false,
    requiresAuthorAction: true,
    badgeVariant: "warning",
    recommendedAction: "Review peer review comments and draft rebuttal response letter.",
  },
  revised_submitted: {
    status: "revised_submitted",
    label: "Revision Submitted",
    description: "Revised manuscript and response to reviewers submitted back to journal.",
    isTerminal: false,
    requiresAuthorAction: false,
    badgeVariant: "secondary",
    recommendedAction: "Editor reviewing revision package.",
  },
  accepted: {
    status: "accepted",
    label: "Accepted",
    description: "Manuscript accepted for publication by Editor-in-Chief.",
    isTerminal: false,
    requiresAuthorAction: false,
    badgeVariant: "success",
    recommendedAction: "Prepare for production, licensing, and proofreading.",
  },
  in_proofs: {
    status: "in_proofs",
    label: "In Proofs",
    description: "Typesetting completed. Author query and galley proof review required.",
    isTerminal: false,
    requiresAuthorAction: true,
    badgeVariant: "warning",
    recommendedAction: "Review author proofs and return corrections within 48-72 hours.",
  },
  published: {
    status: "published",
    label: "Published",
    description: "Article officially published and assigned final DOI / volume / issue.",
    isTerminal: true,
    requiresAuthorAction: false,
    badgeVariant: "success",
    recommendedAction: "Share publication link and promote research findings.",
  },
  rejected: {
    status: "rejected",
    label: "Rejected",
    description: "Manuscript was declined for publication by the journal.",
    isTerminal: true,
    requiresAuthorAction: true,
    badgeVariant: "destructive",
    recommendedAction: "Examine rejection rationale and prepare for target transfer or resubmission.",
  },
  withdrawn: {
    status: "withdrawn",
    label: "Withdrawn",
    description: "Manuscript submission withdrawn by author request.",
    isTerminal: true,
    requiresAuthorAction: false,
    badgeVariant: "destructive",
    recommendedAction: "Submission closed. May be repurposed for another venue.",
  },
};

// In-memory fallback tracking store for scaffolding/mocking while DB schema is in progress
const inMemoryStatusStore = new Map<number, {
  status: JournalSubmissionStatus;
  stage?: EditorialStage;
  updatedAt: Date;
  history: SubmissionStatusHistoryEntry[];
  latestFeedback?: ReviewDecisionFeedback;
}>();

export class SubmissionStatusService {
  /**
   * Validate whether a status transition is permitted by editorial state rules
   */
  static isValidTransition(
    currentStatus: JournalSubmissionStatus,
    targetStatus: JournalSubmissionStatus
  ): boolean {
    const validTargets = VALID_STATUS_TRANSITIONS[currentStatus];
    if (!validTargets) return false;
    return validTargets.includes(targetStatus);
  }

  /**
   * Get all permitted next statuses for a given status
   */
  static getAvailableTransitions(currentStatus: JournalSubmissionStatus): JournalSubmissionStatus[] {
    return VALID_STATUS_TRANSITIONS[currentStatus] || [];
  }

  /**
   * Retrieve human-readable metadata and recommendations for a status
   */
  static getStatusMetadata(status: JournalSubmissionStatus): StatusMetadata {
    return STATUS_METADATA[status] || {
      status,
      label: status,
      description: "Unknown submission status",
      isTerminal: false,
      requiresAuthorAction: false,
      badgeVariant: "outline",
    };
  }

  /**
   * Calculate difference in calendar days between two dates
   */
  static calculateDays(from: Date, to: Date = new Date()): number {
    const diffTime = Math.abs(to.getTime() - from.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Transition a submission's status and persist audit history
   */
  static async transitionStatus(
    submissionId: number,
    newStatus: JournalSubmissionStatus,
    options: {
      actor?: "system" | "author" | "editor" | "webhook";
      notes?: string;
      stage?: EditorialStage;
      metadata?: Record<string, unknown>;
      force?: boolean;
    } = {}
  ): Promise<{ success: boolean; error?: string }> {
    const { actor = "system", notes, stage, metadata = {}, force = false } = options;

    let currentStatus: JournalSubmissionStatus = "draft";

    // Attempt to load current status from DB or in-memory fallback
    try {
      if (db?.query?.submissions) {
        const record = await db.query.submissions.findFirst({
          where: eq(submissions.id, submissionId),
        });
        if (record?.status) {
          currentStatus = record.status as JournalSubmissionStatus;
        }
      }
    } catch {
      // If DB fails or table is not ready, read from in-memory fallback
      const inMem = inMemoryStatusStore.get(submissionId);
      if (inMem) {
        currentStatus = inMem.status;
      }
    }

    if (!force && !this.isValidTransition(currentStatus, newStatus)) {
      return {
        success: false,
        error: `Invalid status transition from '${currentStatus}' to '${newStatus}'`,
      };
    }

    const historyEntry: SubmissionStatusHistoryEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      submissionId,
      previousStatus: currentStatus,
      newStatus,
      stage,
      timestamp: new Date().toISOString(),
      actor,
      notes,
      metadata,
    };

    // Update DB if available
    let dbUpdated = false;
    try {
      if (db) {
        await db.update(submissions).set({
          status: newStatus as any,
          lastAttemptAt: new Date(),
        }).where(eq(submissions.id, submissionId));

        await db.insert(submissionLogs).values({
          submissionId,
          level: "info",
          message: `Status transitioned to ${newStatus}${notes ? `: ${notes}` : ""}`,
          details: { stage, actor, metadata, historyEntry } as any,
        });

        dbUpdated = true;
      }
    } catch (dbErr: any) {
      console.warn(
        `[SubmissionStatusService] DB update skipped or failed (blocked on DB schema / offline): ${dbErr.message}`
      );
    }

    // Always update in-memory store for fallback reliability
    const existing = inMemoryStatusStore.get(submissionId) || {
      status: currentStatus,
      updatedAt: new Date(),
      history: [],
    };

    existing.status = newStatus;
    existing.stage = stage;
    existing.updatedAt = new Date();
    existing.history.push(historyEntry);
    inMemoryStatusStore.set(submissionId, existing);

    return { success: true };
  }

  /**
   * Record peer review / editorial decision feedback
   */
  static async recordReviewDecision(
    submissionId: number,
    feedback: ReviewDecisionFeedback
  ): Promise<void> {
    const mem = inMemoryStatusStore.get(submissionId) || {
      status: "under_review",
      updatedAt: new Date(),
      history: [],
    };
    mem.latestFeedback = feedback;
    inMemoryStatusStore.set(submissionId, mem);

    // Map decision to next status
    let nextStatus: JournalSubmissionStatus = "reviews_received";
    if (feedback.decision === "minor_revision" || feedback.decision === "major_revision") {
      nextStatus = "revision_requested";
    } else if (feedback.decision === "accept") {
      nextStatus = "accepted";
    } else if (feedback.decision === "reject") {
      nextStatus = "rejected";
    }

    await this.transitionStatus(submissionId, nextStatus, {
      actor: "editor",
      notes: `Decision issued: ${feedback.decision}. ${feedback.editorComments || ""}`,
      metadata: { feedback },
    });
  }

  /**
   * Get complete tracking summary for a submission
   */
  static async getTrackingSummary(submissionId: number): Promise<SubmissionTrackingSummary> {
    let paperId = 0;
    let paperTitle = "Untitled Manuscript";
    let journalName = "Academic Journal";
    let platform = "ojs" as const;
    let currentStatus: JournalSubmissionStatus = "draft";
    let pipelineStatus: SubmissionPipelineStatus = "draft";
    let confirmationId: string | undefined;
    let submittedAt: Date | undefined;
    const historyList: SubmissionStatusHistoryEntry[] = [];

    try {
      if (db?.query?.submissions) {
        const record = await db.query.submissions.findFirst({
          where: eq(submissions.id, submissionId),
          with: {
            connection: true,
          } as any,
        });

        if (record) {
          paperId = record.paperId;
          paperTitle = record.submittedTitle || paperTitle;
          currentStatus = (record.status as JournalSubmissionStatus) || currentStatus;
          pipelineStatus = (record.status as SubmissionPipelineStatus) || pipelineStatus;
          confirmationId = record.confirmationId || undefined;
          submittedAt = record.submittedAt ? new Date(record.submittedAt) : undefined;

          const conn = (record as any).connection;
          if (conn) {
            journalName = conn.displayName || journalName;
            platform = conn.platform || platform;
          }
        }
      }
    } catch {
      // Fall back gracefully
    }

    const inMem = inMemoryStatusStore.get(submissionId);
    if (inMem) {
      currentStatus = inMem.status;
      if (inMem.history) {
        historyList.push(...inMem.history);
      }
    }

    const metadata = this.getStatusMetadata(currentStatus);
    const now = new Date();
    const submissionDate = submittedAt || inMem?.updatedAt || now;
    const lastUpdated = inMem?.updatedAt || now;

    return {
      submissionId,
      paperId,
      paperTitle,
      journal: {
        journalName,
        platform,
      },
      currentStatus,
      pipelineStatus,
      currentStage: inMem?.stage,
      manuscriptTrackingId: confirmationId,
      submissionDate: submissionDate.toISOString(),
      lastUpdatedDate: lastUpdated.toISOString(),
      daysInCurrentStatus: this.calculateDays(lastUpdated, now),
      totalDaysInWorkflow: this.calculateDays(submissionDate, now),
      history: historyList,
      latestFeedback: inMem?.latestFeedback,
      nextStep: {
        actionRequired: metadata.requiresAuthorAction,
        description: metadata.recommendedAction || "Awaiting status update.",
      },
    };
  }
}
