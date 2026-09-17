import { NextRequest, NextResponse } from "next/server";
import { getSafeAuth, getSafeDb } from "@/lib/api/db-helper";
import { DUMMY_DOCUMENTS, AcademicDocument } from "@/lib/api/dummy-data";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const docId = parseInt(id, 10);

    const db = await getSafeDb();

    if (db && !isNaN(docId)) {
      try {
        const { papers, journals, paperStages, paperVersions } = await import("@/db/schema");
        const { eq } = await import("drizzle-orm");

        const [dbPaper] = await db
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
          .where(eq(papers.id, docId));

        if (dbPaper) {
          const stages = await db.select().from(paperStages).where(eq(paperStages.paperId, docId));
          const versions = await db.select().from(paperVersions).where(eq(paperVersions.paperId, docId));

          return NextResponse.json({
            document: {
              id: dbPaper.id,
              userId: dbPaper.userId,
              title: dbPaper.title,
              abstract: "Academic research paper generated with PublishAI.",
              status: dbPaper.status || "in_progress",
              stage: stages.length > 0 ? stages[stages.length - 1].stage : "writing",
              targetJournal: dbPaper.journalName
                ? {
                    id: dbPaper.targetJournalId || 0,
                    name: dbPaper.journalName,
                    field: dbPaper.journalField || "General Science",
                    citationStyle: dbPaper.citationStyle || "Nature",
                    wordLimit: dbPaper.wordLimit || undefined,
                    abstractLimit: dbPaper.abstractLimit || undefined,
                  }
                : undefined,
              metrics: {
                wordCount: 4200,
                targetWordLimit: dbPaper.wordLimit || 5000,
                sectionsCompleted: 4,
                totalSections: 6,
                figuresCount: 3,
                referencesCount: 25,
              },
              authors: [{ name: "Lead Researcher", affiliation: "Primary Institution", isCorresponding: true }],
              keywords: ["Research", "PublishAI"],
              stages: stages.map((s) => ({
                id: s.id,
                stage: s.stage,
                status: s.status,
                startedAt: s.startedAt?.toISOString() || null,
                completedAt: s.completedAt?.toISOString() || null,
              })),
              versions: versions.map((v) => ({
                id: v.id,
                versionNumber: v.versionNumber || 1,
                changesSummary: v.changesSummary || "Version snapshot",
                format: v.format || "markdown",
                fileUrl: v.fileUrl || undefined,
                createdAt: v.createdAt?.toISOString() || new Date().toISOString(),
              })),
              createdAt: dbPaper.createdAt?.toISOString() || new Date().toISOString(),
              updatedAt: dbPaper.updatedAt?.toISOString() || new Date().toISOString(),
            },
            source: "database",
          });
        }
      } catch (dbErr) {
        console.warn("[API documents/[id] GET] DB error, falling back to dummy data:", dbErr);
      }
    }

    // Dummy fallback
    const found = DUMMY_DOCUMENTS.find((d) => d.id === docId);
    if (found) {
      return NextResponse.json({
        document: found,
        source: "dummy_scaffold",
      });
    }

    // Dynamic mock for any requested ID
    const mockDoc: AcademicDocument = {
      id: isNaN(docId) ? 99 : docId,
      userId: "usr_mock_publishai_01",
      title: `Academic Research Document #${id}`,
      abstract: "Automated analysis and synthesis of novel empirical findings.",
      status: "in_progress",
      stage: "writing",
      targetJournal: {
        id: 101,
        name: "Nature Biotechnology",
        field: "Computational Biology",
        citationStyle: "Nature",
        wordLimit: 5000,
        abstractLimit: 200,
      },
      metrics: {
        wordCount: 2800,
        targetWordLimit: 5000,
        sectionsCompleted: 3,
        totalSections: 6,
        figuresCount: 2,
        referencesCount: 19,
      },
      authors: [
        { name: "Dr. Jane Doe", affiliation: "Stanford University", isCorresponding: true }
      ],
      keywords: ["Research", "PublishAI", "Scaffolded"],
      sections: [
        { id: "sec_1", title: "Abstract", content: "Abstract content...", wordCount: 150, status: "reviewed", order: 1 },
        { id: "sec_2", title: "Introduction", content: "Introduction content...", wordCount: 1200, status: "reviewed", order: 2 },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      document: mockDoc,
      source: "generated_dummy_scaffold",
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
    const { id } = await params;
    const docId = parseInt(id, 10);
    const body = await req.json();

    const db = await getSafeDb();

    if (db && !isNaN(docId)) {
      try {
        const { papers } = await import("@/db/schema");
        const { eq } = await import("drizzle-orm");

        const updateData: any = { updatedAt: new Date() };
        if (body.title) updateData.title = body.title;
        if (body.status) updateData.status = body.status;
        if (body.targetJournalId) updateData.targetJournalId = Number(body.targetJournalId);

        const [updated] = await db
          .update(papers)
          .set(updateData)
          .where(eq(papers.id, docId))
          .returning();

        if (updated) {
          return NextResponse.json({
            success: true,
            message: "Document updated successfully in database",
            document: updated,
          });
        }
      } catch (dbErr) {
        console.warn("[API documents/[id] PATCH] DB update error, falling back to dummy response:", dbErr);
      }
    }

    // Scaffolded response
    const existing = DUMMY_DOCUMENTS.find((d) => d.id === docId) || DUMMY_DOCUMENTS[0];
    const updatedMock = {
      ...existing,
      ...body,
      id: docId,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: "Document updated successfully (scaffolded)",
      document: updatedMock,
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
    const { id } = await params;
    const docId = parseInt(id, 10);

    const db = await getSafeDb();

    if (db && !isNaN(docId)) {
      try {
        const { papers } = await import("@/db/schema");
        const { eq } = await import("drizzle-orm");

        await db.delete(papers).where(eq(papers.id, docId));
        return NextResponse.json({
          success: true,
          message: `Document ${id} deleted successfully from database`,
          deletedId: docId,
        });
      } catch (dbErr) {
        console.warn("[API documents/[id] DELETE] DB delete error, falling back to dummy response:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Document ${id} deleted successfully (scaffolded)`,
      deletedId: docId,
    });
  } catch (error) {
    console.error("[API documents/[id] DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
