import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/app/auth";
import { db } from "@/services/db";
import { submissions, reviewThreads, reviewComments } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { reviewService } from "@/services/reviews/reviewService";
import { checkRateLimit } from "@/services/rate-limit";

const reviewInputSchema = z.object({
  rawText: z.string().optional(),
  text: z.string().optional(),
  content: z.string().optional(),
  reviewerComments: z.string().optional(),
  paperTitle: z.string().optional(),
  manuscriptContext: z.string().optional(),
  model: z.string().optional(),
});

export async function POST(
  req: Request | NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
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

    const resolvedParams = await params;
    const submissionIdParam = resolvedParams?.id;
    const numericSubmissionId = Number(submissionIdParam);

    if (isNaN(numericSubmissionId) || numericSubmissionId <= 0) {
      return NextResponse.json(
        { error: "Valid numeric submission ID is required" },
        { status: 400 }
      );
    }

    // Verify submission existence and ownership
    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, numericSubmissionId),
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    if (submission.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: Not authorized to process reviews for this submission" },
        { status: 403 }
      );
    }

    let parsedBody: z.infer<typeof reviewInputSchema>;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      let rawJson: unknown;
      try {
        rawJson = await req.json();
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON body" },
          { status: 400 }
        );
      }
      const parseResult = reviewInputSchema.safeParse(rawJson);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: "Validation error", details: parseResult.error.format() },
          { status: 400 }
        );
      }
      parsedBody = parseResult.data;
    } else {
      const textBody = await req.text();
      try {
        const jsonFromText = JSON.parse(textBody);
        const parseResult = reviewInputSchema.safeParse(jsonFromText);
        parsedBody = parseResult.success ? parseResult.data : { rawText: textBody };
      } catch {
        parsedBody = { rawText: textBody };
      }
    }

    const rawText = (
      parsedBody.rawText ||
      parsedBody.text ||
      parsedBody.content ||
      parsedBody.reviewerComments ||
      ""
    ).trim();

    if (!rawText) {
      return NextResponse.json(
        { error: "Reviewer comments text is required (provide rawText, text, content, or reviewerComments)" },
        { status: 400 }
      );
    }

    // Process raw reviewer comments into discrete points with AI draft responses
    const result = await reviewService.processReviewComments(rawText, {
      paperTitle: parsedBody.paperTitle,
      manuscriptContext: parsedBody.manuscriptContext,
      model: parsedBody.model,
    });

    // Save parsed comments to database using proper schema tables (reviewThreads -> reviewComments)
    let savedToDatabase = false;
    let savedCount = 0;

    try {
      if (db) {
        // Group parsed comments by reviewer ID
        const commentsByReviewer = new Map<string, typeof result.comments>();
        for (const item of result.comments) {
          const reviewerKey = item.reviewerId || "Reviewer 1";
          const group = commentsByReviewer.get(reviewerKey) || [];
          group.push(item);
          commentsByReviewer.set(reviewerKey, group);
        }

        for (const [reviewerId, revComments] of commentsByReviewer.entries()) {
          const [thread] = await db.insert(reviewThreads).values({
            submissionId: numericSubmissionId,
            title: `Review from ${reviewerId}`,
            reviewerId,
            status: "pending",
            roundNumber: 1,
            rawReport: rawText,
          }).returning();

          for (const item of revComments) {
            await db.insert(reviewComments).values({
              threadId: thread.id,
              commentNumber: item.pointNumber,
              reviewerText: item.comment,
              aiDraftedResponse: item.draftResponse,
              category: item.category || "general",
              severity: item.severity || "minor",
              suggestedAction: item.suggestedAction || null,
              status: "pending",
            });
            savedCount++;
          }
        }
        savedToDatabase = true;
      }
    } catch (dbErr: any) {
      console.warn("[reviews/process] Database persistence skipped or failed:", dbErr?.message || dbErr);
    }

    return NextResponse.json({
      success: true,
      submissionId: numericSubmissionId,
      summary: result.summary,
      totalComments: result.totalComments,
      comments: result.comments,
      savedToDatabase,
      savedCount,
    });
  } catch (error: any) {
    console.error("[POST /api/submissions/[id]/reviews/process] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error processing reviewer comments" },
      { status: 500 }
    );
  }
}
