import { desc, eq } from "drizzle-orm";
import { db } from "@/services/db";
import { documents, papers, rpaJobs, submissions } from "@/services/db/schema";
import { decrypt, encrypt } from "@/services/security/encryption";
import { mimeTypeForFilename, readPaperFile } from "@/services/storage/paperFiles";
import type { SubmissionPayload } from "@/services/submission/connection-types";
import type { ConnectionDetails, WorkflowResult } from "./submission-bot";

/**
 * Persistence helpers for the RPA submission Inngest function.
 *
 * Browser session state (portal cookies) is needed to resume after a CAPTCHA or
 * 2FA pause. It is stored encrypted on the rpa_jobs row instead of being returned
 * from Inngest steps, so portal session cookies never land in Inngest step history.
 */

interface ResumeState {
  storageState?: string;
  stateData?: Record<string, unknown>;
  stepsCompleted?: string[];
}

export interface AttemptOutcome {
  status: WorkflowResult["status"];
  message?: string;
  trackingId?: string;
}

export async function loadConnection(
  submissionId: number,
  jobId: string,
  resume?: { captchaSolution?: string; twoFACode?: string }
): Promise<ConnectionDetails> {
  const sub = await db.query.submissions.findFirst({
    where: eq(submissions.id, submissionId),
    with: { connection: true },
  });
  const conn = sub?.connection;
  if (!conn) throw new Error("No connection found for submission");

  const details: ConnectionDetails = {
    siteUrl: conn.siteUrl,
    username: decrypt(conn.encryptedUsername),
    password: decrypt(conn.encryptedPassword),
    captchaStrategy: conn.captchaStrategy ?? "auto",
  };
  if (!resume) return details;

  const [job] = await db.select({ stateData: rpaJobs.stateData }).from(rpaJobs).where(eq(rpaJobs.id, jobId));
  const sealed = (job?.stateData as { resume?: string } | null)?.resume;
  const saved: ResumeState = sealed ? JSON.parse(decrypt(sealed)) : {};

  return {
    ...details,
    ...resume,
    storageState: saved.storageState,
    stateData: saved.stateData,
    resumedSteps: saved.stepsCompleted,
  };
}

/** Builds what the bot actually submits: metadata from the submission, text and file from the paper. */
export async function buildSubmissionPayload(submissionId: number): Promise<Partial<SubmissionPayload>> {
  const sub = await db.query.submissions.findFirst({ where: eq(submissions.id, submissionId) });
  if (!sub) throw new Error(`Submission ${submissionId} not found`);

  const [paper] = await db
    .select({ title: papers.title, fileUrl: papers.originalFileUrl })
    .from(papers)
    .where(eq(papers.id, sub.paperId));
  const [doc] = await db
    .select({ content: documents.content, abstract: documents.abstract })
    .from(documents)
    .where(eq(documents.paperId, sub.paperId))
    .orderBy(desc(documents.createdAt))
    .limit(1);

  const attachments: SubmissionPayload["attachments"] = [];
  if (paper?.fileUrl) {
    const file = await readPaperFile(paper.fileUrl);
    if (file) {
      attachments.push({ filename: file.filename, mimeType: file.contentType || mimeTypeForFilename(file.filename), buffer: file.buffer });
    }
  }

  return {
    title: sub.submittedTitle || paper?.title || "Untitled Paper",
    abstract: sub.submittedAbstract || doc?.abstract || "",
    content: doc?.content || "",
    keywords: Array.isArray(sub.submittedKeywords) ? (sub.submittedKeywords as string[]) : [],
    authors: Array.isArray(sub.submittedAuthors) ? (sub.submittedAuthors as SubmissionPayload["authors"]) : [],
    articleType: sub.submittedArticleType || "Research Article",
    publishMode: sub.publishMode === "publish" ? "publish" : "draft",
    attachments,
  };
}

/** Records the attempt on the RPA job and returns only non-sensitive fields to Inngest. */
export async function recordAttemptOutcome(jobId: string, result: WorkflowResult): Promise<AttemptOutcome> {
  const paused = result.status === "requires_captcha" || result.status === "requires_2fa";
  const resumeState: ResumeState = {
    storageState: result.storageState,
    stateData: result.stateData,
    stepsCompleted: result.stepsCompleted,
  };

  await db
    .update(rpaJobs)
    .set({
      status: paused ? "paused" : result.status === "success" ? "completed" : "error",
      currentStep: paused ? (result.status === "requires_captcha" ? "captcha" : "2fa") : result.status,
      stateData: paused
        ? {
            kind: result.status === "requires_captcha" ? "captcha" : "2fa",
            captchaUrl: result.captchaUrl ?? null,
            screenshotUrl: result.screenshotUrl ?? null,
            resume: encrypt(JSON.stringify(resumeState)),
          }
        : null,
      errorLog: result.status === "error" ? result.errorLog || result.message || "Unknown error" : null,
      updatedAt: new Date(),
    })
    .where(eq(rpaJobs.id, jobId));

  return { status: result.status, message: result.message, trackingId: result.trackingId };
}
