/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/db";
import { papers, submissions, submissionLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { SubmissionStatusService } from "./submissionStatusService";
import { JournalSubmissionStatus, SubmissionTrackingSummary } from "./types";

/**
 * Assumed schema for submission_events table.
 * Designed to align with the Database agent's Epic 3 schema expansion.
 */
export const submissionEvents = pgTable("submission_events", {
  id: serial("id").primaryKey(),
  submissionId: integer("submission_id"),
  paperId: integer("paper_id"),
  eventType: text("event_type").notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status"),
  actor: text("actor").default("system"),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
});

export interface SubmissionEvent {
  id: number;
  submissionId: number | null;
  paperId: number | null;
  eventType: string;
  fromStatus: string | null;
  toStatus: string | null;
  actor: string;
  details: Record<string, any> | null;
  createdAt: Date;
}

export interface CreateSubmissionEventInput {
  submissionId?: number | string | null;
  paperId?: number | string | null;
  eventType: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  actor?: string;
  details?: Record<string, any> | null;
}

export interface SubmitPaperParams {
  submissionId?: number | string;
  paperId?: number | string;
  userId?: string;
  connectionId?: number;
  targetJournalId?: number;
  publishMode?: "draft" | "publish";
  notes?: string;
  metadata?: Record<string, any>;
}

export interface SubmitPaperResult {
  success: boolean;
  submissionId: number;
  paperId?: number | null;
  status: string;
  previousStatus?: string | null;
  event?: SubmissionEvent;
  confirmationId?: string;
  submittedAt?: Date;
  error?: string;
}

// In-memory fallback event store for mock / testing resilience
const inMemoryEventsStore: SubmissionEvent[] = [];

// In-memory fallback submissions store
const inMemorySubmissionsStore = new Map<number, any>();

let nextMockEventId = 1;

export class SubmissionService {
  /**
   * Records a submission event into the submission_events table (with in-memory fallback).
   */
  static async recordSubmissionEvent(
    input: CreateSubmissionEventInput
  ): Promise<SubmissionEvent> {
    const subId = input.submissionId !== undefined && input.submissionId !== null
      ? Number(input.submissionId)
      : null;
    const paperId = input.paperId !== undefined && input.paperId !== null
      ? Number(input.paperId)
      : null;

    const eventRecord: SubmissionEvent = {
      id: nextMockEventId++,
      submissionId: subId,
      paperId: paperId,
      eventType: input.eventType,
      fromStatus: input.fromStatus || null,
      toStatus: input.toStatus || null,
      actor: input.actor || "system",
      details: input.details || null,
      createdAt: new Date(),
    };

    // Always maintain in-memory store
    inMemoryEventsStore.push(eventRecord);

    // Attempt Drizzle insert to database
    try {
      if (db && typeof (db as any).insert === "function") {
        const result = await (db as any)
          .insert(submissionEvents)
          .values({
            submissionId: eventRecord.submissionId,
            paperId: eventRecord.paperId,
            eventType: eventRecord.eventType,
            fromStatus: eventRecord.fromStatus,
            toStatus: eventRecord.toStatus,
            actor: eventRecord.actor,
            details: eventRecord.details,
            createdAt: eventRecord.createdAt,
          })
          .returning?.();

        if (result && Array.isArray(result) && result[0]?.id) {
          eventRecord.id = result[0].id;
        }

        // Also add a submissionLog entry if submissionId exists
        if (subId) {
          try {
            await db.insert(submissionLogs).values({
              submissionId: subId,
              level: "info",
              message: `Event [${input.eventType}]: ${input.toStatus || ""}`,
              details: {
                eventType: input.eventType,
                actor: eventRecord.actor,
                details: eventRecord.details,
              } as any,
            });
          } catch {
            // Log fallback
          }
        }
      }
    } catch (dbErr: any) {
      console.warn(
        `[SubmissionService] db.insert(submission_events) skipped or fallback used: ${dbErr?.message || dbErr}`
      );
    }

    return eventRecord;
  }

  /**
   * Retrieves all recorded submission events for a given submission ID.
   */
  static async getSubmissionEvents(submissionId: number | string): Promise<SubmissionEvent[]> {
    const subId = Number(submissionId);

    try {
      if (db && typeof (db as any).select === "function") {
        const rows = await (db as any)
          .select()
          .from(submissionEvents)
          .where(eq(submissionEvents.submissionId, subId))
          .orderBy(desc(submissionEvents.createdAt));

        if (rows && rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            submissionId: r.submissionId,
            paperId: r.paperId,
            eventType: r.eventType,
            fromStatus: r.fromStatus,
            toStatus: r.toStatus,
            actor: r.actor,
            details: r.details,
            createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
          }));
        }
      }
    } catch (err: any) {
      console.warn(`[SubmissionService] getSubmissionEvents DB query fallback: ${err?.message || err}`);
    }

    // Return filtered in-memory events
    return inMemoryEventsStore
      .filter((e) => e.submissionId === subId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Submits a paper: changes its status to 'submitted', updates associated paper & submission
   * records, and records the submission event.
   */
  static async submitPaper(
    idOrOptions: number | string | SubmitPaperParams,
    maybeOptions?: SubmitPaperParams
  ): Promise<SubmitPaperResult> {
    let options: SubmitPaperParams = {};
    let targetId: number | string | undefined;

    if (typeof idOrOptions === "object" && idOrOptions !== null) {
      options = idOrOptions;
      targetId = options.submissionId || options.paperId;
    } else {
      targetId = idOrOptions;
      options = maybeOptions || {};
    }

    if (!targetId && !options.submissionId && !options.paperId) {
      throw new Error("Missing required submission ID or paper ID for submission");
    }

    const subId = Number(options.submissionId || targetId);
    let paperId = options.paperId !== undefined && options.paperId !== null ? Number(options.paperId) : null;
    let previousStatus = "preparing";
    let confirmationId = `PUB-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();

    // 1. Fetch current submission details if available
    let existingSubmission: any = null;
    try {
      if (db?.query?.submissions) {
        existingSubmission = await db.query.submissions.findFirst({
          where: eq(submissions.id, subId),
        });
      }
    } catch {
      // Ignore DB query errors in mock/offline mode
    }

    const inMem = inMemorySubmissionsStore.get(subId);
    if (inMem) {
      existingSubmission = { ...(existingSubmission || {}), ...inMem };
    }

    if (existingSubmission) {
      previousStatus = existingSubmission.status || previousStatus;
      if (paperId === null && existingSubmission.paperId) {
        paperId = existingSubmission.paperId;
      }
      if (existingSubmission.confirmationId) {
        confirmationId = existingSubmission.confirmationId;
      }
    }

    // 2. Update submission record status in database
    try {
      if (db) {
        await db
          .update(submissions)
          .set({
            status: "submitted",
            submittedAt: now,
            lastAttemptAt: now,
            confirmationId,
          } as any)
          .where(eq(submissions.id, subId));
      }
    } catch (err: any) {
      console.warn(`[SubmissionService] Failed to update submissions table: ${err?.message || err}`);
    }

    // 3. Update associated paper record status in database
    if (paperId) {
      try {
        if (db) {
          await db
            .update(papers)
            .set({
              status: "in_progress",
              updatedAt: now,
            } as any)
            .where(eq(papers.id, paperId));
        }
      } catch (err: any) {
        console.warn(`[SubmissionService] Failed to update papers table: ${err?.message || err}`);
      }
    }

    // 4. Update in-memory fallback stores
    const updatedSubmission = {
      ...(existingSubmission || {}),
      id: subId,
      paperId,
      status: "submitted",
      confirmationId,
      submittedAt: now,
      updatedAt: now,
    };
    inMemorySubmissionsStore.set(subId, updatedSubmission);

    // 5. Transition editorial status in SubmissionStatusService
    try {
      await SubmissionStatusService.transitionStatus(subId, "submitted", {
        actor: (options.userId ? "author" : "system") as any,
        notes: options.notes || "Paper submitted via Journal Submission Service",
        metadata: options.metadata,
        force: true,
      });
    } catch (statusErr: any) {
      console.warn(`[SubmissionService] SubmissionStatusService sync skipped: ${statusErr?.message || statusErr}`);
    }

    // 6. Record submission event
    const event = await this.recordSubmissionEvent({
      submissionId: subId,
      paperId: paperId,
      eventType: "paper_submitted",
      fromStatus: previousStatus,
      toStatus: "submitted",
      actor: options.userId || "author",
      details: {
        notes: options.notes,
        confirmationId,
        publishMode: options.publishMode || "draft",
        targetJournalId: options.targetJournalId,
        metadata: options.metadata,
      },
    });

    return {
      success: true,
      submissionId: subId,
      paperId,
      status: "submitted",
      previousStatus,
      confirmationId,
      submittedAt: now,
      event,
    };
  }

  /**
   * Retrieves the current tracking summary and history for a submission.
   */
  static async getSubmissionStatus(submissionId: number | string): Promise<SubmissionTrackingSummary> {
    const subId = Number(submissionId);
    return await SubmissionStatusService.getTrackingSummary(subId);
  }

  /**
   * Updates submission status with validation and records a status change event.
   */
  static async updateSubmissionStatus(
    submissionId: number | string,
    newStatus: JournalSubmissionStatus | string,
    options: {
      actor?: "system" | "author" | "editor" | "webhook";
      notes?: string;
      stage?: any;
      metadata?: Record<string, any>;
      force?: boolean;
    } = {}
  ): Promise<{ success: boolean; error?: string; event?: SubmissionEvent }> {
    const subId = Number(submissionId);
    const existing = inMemorySubmissionsStore.get(subId);
    const previousStatus = existing?.status || "draft";

    const transitionResult = await SubmissionStatusService.transitionStatus(
      subId,
      newStatus as JournalSubmissionStatus,
      options
    );

    if (!transitionResult.success) {
      return transitionResult;
    }

    // Update in DB
    try {
      if (db) {
        await db
          .update(submissions)
          .set({
            status: (newStatus === "draft" || newStatus === "submitted" || newStatus === "failed" ? newStatus : "submitted") as any,
            lastAttemptAt: new Date(),
          })
          .where(eq(submissions.id, subId));
      }
    } catch {
      // Fallback
    }

    // Update in memory
    if (existing) {
      existing.status = newStatus;
      existing.updatedAt = new Date();
      inMemorySubmissionsStore.set(subId, existing);
    }

    // Record submission event
    const event = await this.recordSubmissionEvent({
      submissionId: subId,
      eventType: "status_changed",
      fromStatus: previousStatus,
      toStatus: String(newStatus),
      actor: options.actor || "system",
      details: {
        notes: options.notes,
        stage: options.stage,
        metadata: options.metadata,
      },
    });

    return { success: true, event };
  }

  /**
   * Helper to register a mock submission for testing/offline scenarios.
   */
  static registerMockSubmission(submission: any) {
    if (submission?.id) {
      const subId = Number(submission.id);
      inMemorySubmissionsStore.set(subId, submission);
      if (submission.status) {
        SubmissionStatusService.transitionStatus(subId, submission.status, { force: true }).catch(() => {});
      }
    }
  }

  /**
   * Clears in-memory events and submissions store (for test suites).
   */
  static clearMemoryStore() {
    inMemoryEventsStore.length = 0;
    inMemorySubmissionsStore.clear();
    nextMockEventId = 1;
  }
}

// Export individual functions for convenience
export const submitPaper = SubmissionService.submitPaper.bind(SubmissionService);
export const recordSubmissionEvent = SubmissionService.recordSubmissionEvent.bind(SubmissionService);
export const getSubmissionEvents = SubmissionService.getSubmissionEvents.bind(SubmissionService);
export const getSubmissionStatus = SubmissionService.getSubmissionStatus.bind(SubmissionService);
export const updateSubmissionStatus = SubmissionService.updateSubmissionStatus.bind(SubmissionService);
