import { and, desc, eq } from "drizzle-orm";
import { db } from "@/services/db";
import { rpaJobs, submissions } from "@/services/db/schema";

export type RpaJob = typeof rpaJobs.$inferSelect;

/** Loads an RPA job only if it belongs to one of the user's submissions. */
export async function findOwnedRpaJob(jobId: string, userId: string): Promise<(RpaJob & { submissionUserId: string }) | null> {
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) return null;
  const [row] = await db
    .select({ job: rpaJobs, submissionUserId: submissions.userId })
    .from(rpaJobs)
    .innerJoin(submissions, eq(rpaJobs.submissionId, submissions.id))
    .where(and(eq(rpaJobs.id, jobId), eq(submissions.userId, userId)));
  return row ? { ...row.job, submissionUserId: row.submissionUserId } : null;
}

export async function findLatestRpaJobForPaper(paperId: number, userId: string): Promise<RpaJob | null> {
  const [row] = await db
    .select({ job: rpaJobs })
    .from(rpaJobs)
    .innerJoin(submissions, eq(rpaJobs.submissionId, submissions.id))
    .where(and(eq(submissions.paperId, paperId), eq(submissions.userId, userId)))
    .orderBy(desc(rpaJobs.createdAt))
    .limit(1);
  return row?.job ?? null;
}

const STEP_PROGRESS: Record<string, number> = {
  logging_in: 30,
  uploading: 50,
  filling_forms: 70,
};

/** Client-facing view of a job. Never includes the encrypted resume state. */
export function presentRpaJob(job: RpaJob) {
  const state = (job.stateData as { kind?: string; captchaUrl?: string; screenshotUrl?: string } | null) ?? {};
  const status =
    job.status === "running"
      ? job.currentStep && job.currentStep in STEP_PROGRESS
        ? job.currentStep
        : "initializing"
      : job.status === "pending"
        ? "initializing"
        : job.status;

  const message =
    job.status === "paused"
      ? state.kind === "2fa"
        ? "The journal portal requires a two-factor authentication code."
        : "The journal portal requires a CAPTCHA to be solved."
      : job.status === "error"
        ? job.errorLog || "Submission failed"
        : job.status === "completed"
          ? "Submission completed"
          : "Submitting to the journal portal...";

  return {
    jobId: job.id,
    status,
    message,
    progress: job.status === "completed" ? 100 : job.status === "error" ? 100 : job.status === "paused" ? 75 : STEP_PROGRESS[job.currentStep ?? ""] ?? 10,
    interventionKind: job.status === "paused" ? state.kind ?? "captcha" : null,
    captchaUrl: state.captchaUrl ?? null,
    screenshotUrl: state.screenshotUrl ?? null,
  };
}
