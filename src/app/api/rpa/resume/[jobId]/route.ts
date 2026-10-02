import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { requireUser } from '@/services/api/route-auth';
import { findOwnedRpaJob } from '@/services/rpa/job-status';
import { db } from '@/services/db';
import { rpaJobs } from '@/services/db/schema';
import { inngest } from '@/inngest/client';

/**
 * Resumes a paused submission by delivering the human input (CAPTCHA solution or
 * 2FA code) to the waiting submission workflow.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const guard = await requireUser();
  if (guard instanceof NextResponse) return guard;

  const { jobId } = await params;
  const body = await request.json().catch(() => ({}));
  const input = typeof body?.input === 'string' ? body.input.trim().slice(0, 500) : '';

  const job = await findOwnedRpaJob(jobId, guard.userId);
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }
  if (job.status !== 'paused') {
    return NextResponse.json({ error: 'Job is not waiting for input' }, { status: 409 });
  }

  const kind = (job.stateData as { kind?: string } | null)?.kind;
  if (kind === '2fa') {
    await inngest.send({ name: 'submission/2fa-solved', data: { submissionId: job.submissionId, code: input || undefined } });
  } else {
    if (!input) {
      return NextResponse.json({ error: 'A CAPTCHA solution is required' }, { status: 400 });
    }
    await inngest.send({ name: 'submission/captcha-solved', data: { submissionId: job.submissionId, solution: input } });
  }

  await db.update(rpaJobs).set({ status: 'running', currentStep: 'logging_in', updatedAt: new Date() }).where(eq(rpaJobs.id, jobId));
  return NextResponse.json({ success: true });
}
