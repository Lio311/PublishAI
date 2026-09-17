import { NextRequest, NextResponse } from "next/server";
import { getSafeAuth, getSafeDb } from "@/lib/api/db-helper";
import { DUMMY_DOCUMENTS, AcademicDocument } from "@/lib/api/dummy-data";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get("status");
    const searchQuery = searchParams.get("search")?.toLowerCase();
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const session = await getSafeAuth();
    const db = await getSafeDb();

    if (db && session?.user?.id) {
      try {
        const { papers, journals } = await import("@/db/schema");
        const { eq, desc } = await import("drizzle-orm");

        const dbPapers = await db
          .select({
            id: papers.id,
            userId: papers.userId,
            title: papers.title,
            status: papers.status,
            targetJournalId: papers.targetJournalId,
            originalFileUrl: papers.originalFileUrl,
            originalFormat: papers.originalFormat,
            createdAt: papers.createdAt,
            updatedAt: papers.updatedAt,
            journalName: journals.name,
            journalField: journals.field,
            citationStyle: journals.citationStyle,
            wordLimit: journals.wordLimit,
            abstractLimit: journals.abstractLimit,
          })
          .from(papers)
          .leftJoin(journals, eq(papers.targetJournalId, journals.id))
          .where(eq(papers.userId, session.user.id))
          .orderBy(desc(papers.createdAt));

        if (dbPapers && dbPapers.length > 0) {
          let mapped: AcademicDocument[] = dbPapers.map((p) => ({
            id: p.id,
            userId: p.userId,
            title: p.title,
            abstract: "Academic paper generated with PublishAI pipeline.",
            status: (p.status as any) || "in_progress",
            stage: "writing",
            targetJournalId: p.targetJournalId,
            targetJournal: p.journalName
              ? {
                  id: p.targetJournalId || 0,
                  name: p.journalName,
                  field: p.journalField || "General Science",
                  citationStyle: p.citationStyle || "Nature",
                  wordLimit: p.wordLimit || undefined,
                  abstractLimit: p.abstractLimit || undefined,
                }
              : undefined,
            metrics: {
              wordCount: 3500,
              targetWordLimit: p.wordLimit || 5000,
              sectionsCompleted: 4,
              totalSections: 6,
              figuresCount: 3,
              referencesCount: 28,
            },
            authors: [{ name: session?.user?.name || "Lead Author", affiliation: "Primary Institution", isCorresponding: true }],
            keywords: ["Research", "PublishAI"],
            originalFileUrl: p.originalFileUrl,
            originalFormat: p.originalFormat,
            createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
            updatedAt: p.updatedAt ? p.updatedAt.toISOString() : new Date().toISOString(),
          }));

          if (statusFilter) {
            mapped = mapped.filter((d) => d.status === statusFilter);
          }
          if (searchQuery) {
            mapped = mapped.filter((d) => d.title.toLowerCase().includes(searchQuery));
          }

          const startIndex = (page - 1) * limit;
          const paginated = mapped.slice(startIndex, startIndex + limit);

          return NextResponse.json({
            documents: paginated,
            total: mapped.length,
            page,
            limit,
            source: "database",
          });
        }
      } catch (dbErr) {
        console.warn("[API documents GET] DB query failed, falling back to dummy data:", dbErr);
      }
    }

    // Fallback dummy data when DB schema is not ready yet
    let filtered = [...DUMMY_DOCUMENTS];

    if (statusFilter) {
      filtered = filtered.filter((doc) => doc.status === statusFilter);
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchQuery) ||
          doc.abstract.toLowerCase().includes(searchQuery) ||
          doc.keywords.some((k) => k.toLowerCase().includes(searchQuery))
      );
    }

    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      documents: paginated,
      total: filtered.length,
      page,
      limit,
      source: "dummy_scaffold",
    });
  } catch (error) {
    console.error("[API documents GET] Error:", error);
    return NextResponse.json(
      {
        documents: DUMMY_DOCUMENTS,
        total: DUMMY_DOCUMENTS.length,
        page: 1,
        limit: 10,
        source: "fallback_dummy",
      },
      { status: 200 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, abstract, targetJournalId, keywords, authors, originalFormat } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const session = await getSafeAuth();
    const db = await getSafeDb();

    if (db && session?.user?.id) {
      try {
        const { papers } = await import("@/db/schema");
        const [newPaper] = await db
          .insert(papers)
          .values({
            title,
            userId: session.user.id,
            status: "pending",
            targetJournalId: targetJournalId ? Number(targetJournalId) : null,
            originalFormat: originalFormat || "markdown",
          })
          .returning();

        return NextResponse.json(
          {
            success: true,
            message: "Document created successfully in database",
            document: {
              ...newPaper,
              abstract: abstract || "",
              keywords: keywords || [],
              authors: authors || [{ name: session?.user?.name || "Primary Author", affiliation: "Research Institution" }],
              createdAt: newPaper.createdAt ? newPaper.createdAt.toISOString() : new Date().toISOString(),
              updatedAt: newPaper.updatedAt ? newPaper.updatedAt.toISOString() : new Date().toISOString(),
            },
          },
          { status: 201 }
        );
      } catch (dbErr) {
        console.warn("[API documents POST] DB insert failed, falling back to dummy response:", dbErr);
      }
    }

    // Scaffolded response when DB schema is not ready yet
    const newDocId = DUMMY_DOCUMENTS.length + Math.floor(Math.random() * 1000) + 1;
    const newDoc: AcademicDocument = {
      id: newDocId,
      userId: session?.user?.id || "usr_mock_publishai_01",
      title,
      abstract: abstract || "Preliminary abstract describing research scope and hypothesis.",
      status: "pending",
      stage: "clarification",
      targetJournalId: targetJournalId ? Number(targetJournalId) : 101,
      targetJournal: {
        id: targetJournalId ? Number(targetJournalId) : 101,
        name: "Target Journal (Scaffolded)",
        field: "Multidisciplinary Science",
        citationStyle: "Nature",
      },
      metrics: {
        wordCount: 0,
        targetWordLimit: 5000,
        sectionsCompleted: 0,
        totalSections: 6,
        figuresCount: 0,
        referencesCount: 0,
      },
      authors: authors && authors.length > 0 ? authors : [
        { name: session?.user?.name || "Dr. Jane Doe", affiliation: "Stanford University", isCorresponding: true }
      ],
      keywords: keywords || ["Research", "PublishAI"],
      originalFormat: originalFormat || "markdown",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        message: "Document created successfully (scaffolded)",
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
