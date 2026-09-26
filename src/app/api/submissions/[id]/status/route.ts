import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/auth";
import { db } from "@/services/db";
import { submissions } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit } from "@/services/rate-limit";
import { SubmissionService } from "@/services/submission";

const updateStatusSchema = z.object({
  status: z.string().min(1, "Status is required"),
  notes: z.string().optional(),
  stage: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  force: z.boolean().optional(),
});

export async function GET(
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

    // Verify submission existence and ownership
    let existingSubmission: any = null;
    try {
      if (db?.query?.submissions) {
        existingSubmission = await db.query.submissions.findFirst({
          where: eq(submissions.id, submissionId),
        });
      }
    } catch (dbErr) {
      console.warn("[API submissions/[id]/status] DB query fallback:", dbErr);
    }

    if (!existingSubmission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    if (existingSubmission.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: Not authorized to view this submission" },
        { status: 403 }
      );
    }

    const [summary, events] = await Promise.all([
      SubmissionService.getSubmissionStatus(submissionId),
      SubmissionService.getSubmissionEvents(submissionId),
    ]);

    return NextResponse.json({
      success: true,
      submissionId,
      status: summary?.currentStatus || existingSubmission?.status || "unknown",
      summary,
      events,
    });
  } catch (error: any) {
    console.error("[API submissions/[id]/status GET] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Verify submission existence and ownership
    const existingSubmission = await db.query.submissions.findFirst({
      where: eq(submissions.id, submissionId),
    });

    if (!existingSubmission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }
    
    if (existingSubmission.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: Not authorized to modify this submission" },
        { status: 403 }
      );
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parseResult = updateStatusSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { status, notes, stage, metadata, force } = parseResult.data;

    const result = await SubmissionService.updateSubmissionStatus(submissionId, status, {
      actor: "author",
      notes,
      stage,
      metadata,
      force,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update submission status" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Submission status updated successfully",
      status,
      event: result.event,
    });
  } catch (error: any) {
    console.error("[API submissions/[id]/status PATCH] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
