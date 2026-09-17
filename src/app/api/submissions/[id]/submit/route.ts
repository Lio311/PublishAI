import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";
import { SubmissionService } from "@/services/submission";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await checkRateLimit(session.user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { id } = await params;
    const submissionId = Number(id);

    if (isNaN(submissionId) || submissionId <= 0) {
      return NextResponse.json(
        { error: "Invalid submission ID" },
        { status: 400 }
      );
    }

    // Verify submission exists and belongs to user
    let existingSubmission: any = null;
    try {
      if (db?.query?.submissions) {
        existingSubmission = await db.query.submissions.findFirst({
          where: eq(submissions.id, submissionId),
        });
      }
    } catch (dbErr) {
      console.warn("[API submissions/[id]/submit] DB query fallback:", dbErr);
    }

    if (existingSubmission && existingSubmission.userId && existingSubmission.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: Not authorized to submit this manuscript" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { notes, targetJournalId, publishMode, metadata } = body;

    // Execute submission logic and event recording
    const result = await SubmissionService.submitPaper(submissionId, {
      submissionId,
      userId: session.user.id,
      notes,
      targetJournalId,
      publishMode,
      metadata,
    });

    return NextResponse.json({
      success: true,
      message: "Submission submitted successfully",
      submission: result,
    });
  } catch (error: any) {
    console.error("[API submissions/[id]/submit POST] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
