import { NextRequest, NextResponse } from "next/server";
import { db } from "@/services/db";
import { papers, paperStages } from "@/services/db/schema";
import { auth } from "@/app/auth";
import { eq, and } from "drizzle-orm";

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
    const paperId = parseInt(id, 10);
    
    if (isNaN(paperId)) {
      return NextResponse.json({ error: "Invalid paper ID format" }, { status: 400 });
    }

    const [paper] = await db
      .select()
      .from(papers)
      .where(and(eq(papers.id, paperId), eq(papers.userId, session.user.id)));

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const stages = await db
      .select()
      .from(paperStages)
      .where(eq(paperStages.paperId, paperId))
      .orderBy(paperStages.id);

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

    const { id } = await params;
    const paperId = parseInt(id, 10);
    
    if (isNaN(paperId)) {
      return NextResponse.json({ error: "Invalid paper ID format" }, { status: 400 });
    }
    
    const body = await req.json();

    const updateData: any = { updatedAt: new Date() };
    if (body.title !== undefined) updateData.title = body.title;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.targetJournalId !== undefined) updateData.targetJournalId = body.targetJournalId ? Number(body.targetJournalId) : null;
    if (body.doi !== undefined) updateData.doi = body.doi;

    const [updated] = await db
      .update(papers)
      .set(updateData)
      .where(and(eq(papers.id, paperId), eq(papers.userId, session.user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Paper not found or not authorized" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Paper updated successfully in database",
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

    const { id } = await params;
    const paperId = parseInt(id, 10);
    
    if (isNaN(paperId)) {
      return NextResponse.json({ error: "Invalid paper ID format" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(papers)
      .where(and(eq(papers.id, paperId), eq(papers.userId, session.user.id)))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Paper not found or not authorized" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Paper ${id} deleted successfully from database`,
      deletedId: id,
    });
  } catch (error) {
    console.error("[API papers/[id] DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to delete paper" }, { status: 500 });
  }
}
