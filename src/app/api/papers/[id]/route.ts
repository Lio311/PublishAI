import { NextRequest, NextResponse } from "next/server";
import { db } from "@/services/db";
import { papers, paperStages, journals } from "@/services/db/schema";
import { auth } from "@/app/auth";
import { eq, and, asc } from "drizzle-orm";
import { applyRateLimit } from "@/services/rate-limit";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.coerce.number().int().positive("Paper ID must be a positive integer"),
});

const updatePaperSchema = z
  .object({
    title: z.string().trim().min(1, "Title cannot be empty").max(500, "Title is too long").optional(),
    status: z
      .enum(["pending", "in_progress", "awaiting_approval", "approved", "completed", "failed"])
      .optional(),
    targetJournalId: z.coerce.number().int().positive().nullable().optional(),
    currentJournalId: z.coerce.number().int().positive().nullable().optional(),
    doi: z.string().trim().max(100).nullable().optional(),
    cascadeQueue: z.array(z.string().trim()).nullable().optional(),
    originalFileUrl: z.string().url().max(1000).nullable().optional(),
    originalFormat: z.string().trim().max(50).nullable().optional(),
  })
  .strict();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = await applyRateLimit(req, "read", session.user.id);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const rawParams = await params;
    const paramParse = paramsSchema.safeParse(rawParams);
    if (!paramParse.success) {
      return NextResponse.json(
        { error: "Invalid paper ID", details: paramParse.error.flatten() },
        { status: 400 }
      );
    }
    const paperId = paramParse.data.id;

    const paper = await db.query.papers.findFirst({
      where: eq(papers.id, paperId),
      with: { targetJournal: true },
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    if (paper.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const stages = await db
      .select()
      .from(paperStages)
      .where(eq(paperStages.paperId, paperId))
      .orderBy(asc(paperStages.id));

    return NextResponse.json({
      paper,
      stages,
    });
  } catch (error) {
    console.error("[API papers/[id] GET] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

    const rateLimitResponse = await applyRateLimit(req, "write", session.user.id);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const rawParams = await params;
    const paramParse = paramsSchema.safeParse(rawParams);
    if (!paramParse.success) {
      return NextResponse.json(
        { error: "Invalid paper ID", details: paramParse.error.flatten() },
        { status: 400 }
      );
    }
    const paperId = paramParse.data.id;

    // Verify paper exists and ownership
    const existingPaper = await db.query.papers.findFirst({
      where: eq(papers.id, paperId),
      columns: { id: true, userId: true },
    });

    if (!existingPaper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    if (existingPaper.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse and validate body
    let rawBody;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Malformed JSON payload in request body" },
        { status: 400 }
      );
    }

    const bodyParse = updatePaperSchema.safeParse(rawBody);
    if (!bodyParse.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: bodyParse.error.flatten() },
        { status: 400 }
      );
    }

    const body = bodyParse.data;

    // Validate referenced journal if provided
    if (body.targetJournalId) {
      const journalExists = await db.query.journals.findFirst({
        where: eq(journals.id, body.targetJournalId),
        columns: { id: true },
      });
      if (!journalExists) {
        return NextResponse.json(
          { error: "Target journal not found" },
          { status: 400 }
        );
      }
    }

    if (body.currentJournalId) {
      const journalExists = await db.query.journals.findFirst({
        where: eq(journals.id, body.currentJournalId),
        columns: { id: true },
      });
      if (!journalExists) {
        return NextResponse.json(
          { error: "Current journal not found" },
          { status: 400 }
        );
      }
    }

    const updateData: Partial<typeof papers.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (body.title !== undefined) updateData.title = body.title;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.targetJournalId !== undefined) updateData.targetJournalId = body.targetJournalId;
    if (body.currentJournalId !== undefined) updateData.currentJournalId = body.currentJournalId;
    if (body.doi !== undefined) updateData.doi = body.doi;
    if (body.cascadeQueue !== undefined) updateData.cascadeQueue = body.cascadeQueue;
    if (body.originalFileUrl !== undefined) updateData.originalFileUrl = body.originalFileUrl;
    if (body.originalFormat !== undefined) updateData.originalFormat = body.originalFormat;

    const [updated] = await db
      .update(papers)
      .set(updateData)
      .where(and(eq(papers.id, paperId), eq(papers.userId, session.user.id)))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Paper updated successfully",
      paper: updated,
    });
  } catch (error) {
    console.error("[API papers/[id] PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update paper" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = await applyRateLimit(req, "write", session.user.id);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const rawParams = await params;
    const paramParse = paramsSchema.safeParse(rawParams);
    if (!paramParse.success) {
      return NextResponse.json(
        { error: "Invalid paper ID", details: paramParse.error.flatten() },
        { status: 400 }
      );
    }
    const paperId = paramParse.data.id;

    // Check existence and ownership before delete
    const existingPaper = await db.query.papers.findFirst({
      where: eq(papers.id, paperId),
      columns: { id: true, userId: true },
    });

    if (!existingPaper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    if (existingPaper.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [deleted] = await db
      .delete(papers)
      .where(and(eq(papers.id, paperId), eq(papers.userId, session.user.id)))
      .returning();

    return NextResponse.json({
      success: true,
      message: `Paper ${paperId} deleted successfully`,
      deletedId: deleted.id,
    });
  } catch (error) {
    console.error("[API papers/[id] DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to delete paper" }, { status: 500 });
  }
}
