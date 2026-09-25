import { NextResponse } from 'next/server';
import { db } from '@/services/db';
import { rpaJobs, submissions } from '@/services/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  
  try {
    const [job] = await db.select().from(rpaJobs).where(eq(rpaJobs.id, jobId));
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: job.status,
      message: job.currentStep || 'Running...',
      progress: job.status === 'completed' ? 100 : job.status === 'error' ? 0 : 50,
      stateData: job.stateData,
      errorLog: job.errorLog,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  
  try {
    const body = await request.json();
    const { status, currentStep, stateData, errorLog } = body;

    const [existing] = await db.select().from(rpaJobs).where(eq(rpaJobs.id, jobId));
    
    if (!existing) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    await db.update(rpaJobs)
      .set({
        status: status || existing.status,
        currentStep: currentStep || existing.currentStep,
        stateData: stateData || existing.stateData,
        errorLog: errorLog || existing.errorLog,
        updatedAt: new Date(),
      })
      .where(eq(rpaJobs.id, jobId));
      
    if (status === 'completed' && existing.submissionId) {
      await db.update(submissions).set({ status: 'submitted' }).where(eq(submissions.id, existing.submissionId));
    } else if (status === 'error' && existing.submissionId) {
      await db.update(submissions).set({ status: 'failed' }).where(eq(submissions.id, existing.submissionId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
