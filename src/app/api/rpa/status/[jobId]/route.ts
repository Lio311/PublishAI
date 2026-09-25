import { NextResponse } from 'next/server';

// Temporary mock status storage
const jobStatuses: Record<string, any> = {};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  
  if (!jobStatuses[jobId]) {
    jobStatuses[jobId] = {
      status: 'initializing',
      message: 'Initializing submission...',
      progress: 10
    };
  }

  // For demonstration, let's auto-progress the status if it's not paused/completed
  const current = jobStatuses[jobId];
  if (current.status === 'initializing') {
    jobStatuses[jobId] = { status: 'logging_in', message: 'Logging into publisher portal...', progress: 30 };
  } else if (current.status === 'logging_in') {
    jobStatuses[jobId] = { status: 'uploading', message: 'Uploading manuscript files...', progress: 50 };
  } else if (current.status === 'uploading') {
    jobStatuses[jobId] = { status: 'filling_forms', message: 'Filling submission forms...', progress: 70 };
  } else if (current.status === 'filling_forms') {
    jobStatuses[jobId] = { status: 'paused', message: 'Please complete the APC payment on the portal.', progress: 75 };
  } else if (current.status === 'resumed') {
    jobStatuses[jobId] = { status: 'completed', message: 'Submission completed successfully.', progress: 100 };
  }

  return NextResponse.json(jobStatuses[jobId]);
}
