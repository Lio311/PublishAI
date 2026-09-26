import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/auth";
import { db } from "@/services/db";
import { submissions } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { inngest } from "@/inngest/client";
import { checkRateLimit } from "@/services/rate-limit";

const solveCaptchaSchema = z.object({
  submissionId: z.coerce.number().int().positive("submissionId must be a positive integer"),
  solution: z.string().min(1, "Captcha solution is required"),
});

export async function POST(req: Request) {
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

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parseResult = solveCaptchaSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { submissionId, solution } = parseResult.data;

    // Verify submission exists and belongs to the authenticated user
    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, submissionId),
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    if (submission.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: Not authorized to solve captcha for this submission" },
        { status: 403 }
      );
    }

    await inngest.send({
      name: "submission/captcha-solved",
      data: {
        submissionId,
        solution,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error solving captcha:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
