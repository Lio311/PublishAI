import { NextRequest, NextResponse } from "next/server";
import { db } from "@/services/db";
import { documents } from "@/services/db/schema";
import { auth } from "@/app/auth";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { userOwnsPaper } from "@/services/api/route-auth";

const patchDocSchema = z.object({
  title: z.string().optional(),
  abstract: z.string().optional(),
  content: z.string().optional(),
  status: z.string().optional(),
  targetJournalId: z.union([z.string(), z.number()]).nullable().optional(),
  paperId: z.union([z.string(), z.number()]).nullable().optional(),
  fileUrl: z.string().nullable().optional(),
  fileType: z.string().nullable().optional(),
  metadata: z.any().optional(),
  wordCount: z.union([z.string(), z.number()]).optional(),
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

    const { id } = await params;

    const [doc] = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, session.user.id)));

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return NextResponse.json({
      document: doc,
    });
  } catch (error) {
    console.error("[API documents/[id] GET] Error:", error);
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

    const { id } = await params;
    let body;
    try {
      body = patchDocSchema.parse(await req.json());
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const updateData: Partial<typeof documents.$inferInsert> = { updatedAt: new Date() };
    if (body.title !== undefined) updateData.title = body.title;
    if (body.abstract !== undefined) updateData.abstract = body.abstract;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.targetJournalId !== undefined) updateData.targetJournalId = body.targetJournalId ? Number(body.targetJournalId) : null;
    if (body.paperId !== undefined) {
      if (body.paperId && !(await userOwnsPaper(session.user.id, Number(body.paperId)))) {
        return NextResponse.json({ error: "Paper not found" }, { status: 404 });
      }
      updateData.paperId = body.paperId ? Number(body.paperId) : null;
    }
    if (body.fileUrl !== undefined) updateData.fileUrl = body.fileUrl;
    if (body.fileType !== undefined) updateData.fileType = body.fileType;
    if (body.metadata !== undefined) updateData.metadata = body.metadata;
    if (body.wordCount !== undefined) updateData.wordCount = Number(body.wordCount);

    const [updated] = await db
      .update(documents)
      .set(updateData)
      .where(and(eq(documents.id, id), eq(documents.userId, session.user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Document not found or not authorized" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Document updated successfully in database",
      document: updated,
    });
  } catch (error) {
    console.error("[API documents/[id] PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
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

    const { id } = await params;

    const [deleted] = await db
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, session.user.id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Document not found or not authorized" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Document ${id} deleted successfully from database`,
      deletedId: id,
    });
  } catch (error) {
    console.error("[API documents/[id] DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
