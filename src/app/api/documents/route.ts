import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { auth } from "@/auth";
import { eq, desc, and, ilike } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const searchQuery = searchParams.get("search")?.toLowerCase();
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = (page - 1) * limit;

    const conditions = [];
    conditions.push(eq(documents.userId, session.user.id));

    if (statusFilter) {
      conditions.push(eq(documents.status, statusFilter));
    }
    
    if (searchQuery) {
      conditions.push(ilike(documents.title, `%${searchQuery}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(documents)
      .where(whereClause)
      .orderBy(desc(documents.createdAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const allMatching = await db
      .select({ id: documents.id })
      .from(documents)
      .where(whereClause);
      
    return NextResponse.json({
      documents: data,
      total: allMatching.length,
      page,
      limit,
    });
  } catch (error) {
    console.error("[API documents GET] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, abstract, content, status, targetJournalId, paperId, fileUrl, fileType, metadata } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const [newDoc] = await db
      .insert(documents)
      .values({
        userId: session.user.id,
        title,
        abstract: abstract || null,
        content: content || null,
        status: status || "draft",
        paperId: paperId ? Number(paperId) : null,
        targetJournalId: targetJournalId ? Number(targetJournalId) : null,
        fileUrl: fileUrl || null,
        fileType: fileType || null,
        metadata: metadata || null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Document created successfully in database",
        document: newDoc,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API documents POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create document" },
      { status: 500 }
    );
  }
}
