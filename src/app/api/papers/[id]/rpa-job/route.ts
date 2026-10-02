import { NextResponse } from "next/server";
import { requirePaperOwner } from "@/services/api/route-auth";
import { findLatestRpaJobForPaper, presentRpaJob } from "@/services/rpa/job-status";

/** The most recent automated-submission job for a paper, or `{ job: null }`. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const paperId = Number((await params).id);
  const guard = await requirePaperOwner(paperId);
  if (guard instanceof NextResponse) return guard;

  const job = await findLatestRpaJobForPaper(paperId, guard.userId);
  return NextResponse.json({ job: job ? presentRpaJob(job) : null });
}
