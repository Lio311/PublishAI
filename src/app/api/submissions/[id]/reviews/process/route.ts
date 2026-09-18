import { NextRequest, NextResponse } from "next/server";
import { reviewService } from "@/services/reviews/reviewService";
import { db } from "@/services/db";
import * as schema from "@/services/db/schema";
import { sql } from "drizzle-orm";

export async function POST(
  req: Request | NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await params;
    const submissionId = resolvedParams?.id;

    if (!submissionId) {
      return NextResponse.json(
        { error: "Submission ID is required" },
        { status: 400 }
      );
    }

    let rawText = "";
    let paperTitle: string | undefined;
    let manuscriptContext: string | undefined;
    let model: string | undefined;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      try {
        const body = await req.json();
        rawText = body.rawText || body.text || body.content || body.reviewerComments || "";
        paperTitle = body.paperTitle;
        manuscriptContext = body.manuscriptContext;
        model = body.model;
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON body" },
          { status: 400 }
        );
      }
    } else {
      const textBody = await req.text();
      try {
        const parsed = JSON.parse(textBody);
        rawText = parsed.rawText || parsed.text || parsed.content || parsed.reviewerComments || textBody;
        paperTitle = parsed.paperTitle;
        manuscriptContext = parsed.manuscriptContext;
        model = parsed.model;
      } catch {
        rawText = textBody;
      }
    }

    if (!rawText || !rawText.trim()) {
      return NextResponse.json(
        { error: "Reviewer comments text is required" },
        { status: 400 }
      );
    }

    // Process raw reviewer comments into discrete points with AI draft responses
    const result = await reviewService.processReviewComments(rawText, {
      paperTitle,
      manuscriptContext,
      model,
    });

    // Optionally save parsed comments to database (assume review_comments table exists)
    let savedToDatabase = false;
    let savedCount = 0;

    try {
      const numericSubmissionId = !isNaN(Number(submissionId)) ? Number(submissionId) : null;

      if ((schema as any).reviewComments && db) {
        const table = (schema as any).reviewComments;
        for (const item of result.comments) {
          await (db as any).insert(table).values({
            submissionId: numericSubmissionId ?? submissionId,
            reviewerId: item.reviewerId,
            pointNumber: item.pointNumber,
            commentText: item.comment,
            draftResponse: item.draftResponse,
            category: item.category,
            severity: item.severity,
            suggestedAction: item.suggestedAction,
            status: "drafted",
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          savedCount++;
        }
        savedToDatabase = true;
      } else if (db && typeof (db as any).execute === "function") {
        try {
          for (const item of result.comments) {
            await (db as any).execute(sql`
              INSERT INTO review_comments (
                submission_id, reviewer_id, point_number, comment_text, draft_response, category, severity, suggested_action
              ) VALUES (
                ${numericSubmissionId ?? submissionId},
                ${item.reviewerId},
                ${item.pointNumber},
                ${item.comment},
                ${item.draftResponse},
                ${item.category || "general"},
                ${item.severity || "minor"},
                ${item.suggestedAction || null}
              )
            `);
            savedCount++;
          }
          savedToDatabase = true;
        } catch (sqlErr: any) {
          console.warn("[reviews/process] review_comments table insert skipped:", sqlErr?.message);
        }
      }
    } catch (dbErr: any) {
      console.warn("[reviews/process] Optional database persistence skipped:", dbErr?.message);
    }

    return NextResponse.json({
      success: true,
      submissionId,
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
