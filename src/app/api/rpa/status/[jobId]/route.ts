import { NextResponse } from 'next/server';
import { requireUser } from '@/services/api/route-auth';
import { findOwnedRpaJob, presentRpaJob } from '@/services/rpa/job-status';

/**
 * Job status for the submission tracker. Status updates are written by the
 * submission Inngest function directly, so there is no write endpoint here.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const guard = await requireUser();
  if (guard instanceof NextResponse) return guard;

  const { jobId } = await params;
  try {
    const job = await findOwnedRpaJob(jobId, guard.userId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    return NextResponse.json(presentRpaJob(job));
  } catch (error) {
    console.error('[API rpa/status] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
