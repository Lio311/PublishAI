import { NextRequest, NextResponse } from "next/server";
import { DUMMY_DOCUMENTS, DocumentSection } from "@/lib/api/dummy-data";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const docId = parseInt(id, 10);

    const doc = DUMMY_DOCUMENTS.find((d) => d.id === docId) || DUMMY_DOCUMENTS[0];
    const sections: DocumentSection[] = doc.sections || [
      { id: "sec_abstract", title: "Abstract", content: "Abstract text...", wordCount: 180, status: "reviewed", order: 1 },
      { id: "sec_intro", title: "Introduction", content: "Introduction text...", wordCount: 1100, status: "reviewed", order: 2 },
      { id: "sec_methods", title: "Methodology", content: "Methods description...", wordCount: 1400, status: "generated", order: 3 },
      { id: "sec_results", title: "Results", content: "Key experimental results...", wordCount: 1600, status: "draft", order: 4 },
      { id: "sec_discussion", title: "Discussion", content: "Discussion and future directions...", wordCount: 950, status: "draft", order: 5 },
      { id: "sec_references", title: "References", content: "Citations and bibliography...", wordCount: 500, status: "reviewed", order: 6 },
    ];

    return NextResponse.json({
      documentId: docId,
      sections,
      totalSections: sections.length,
      totalWords: sections.reduce((acc, s) => acc + s.wordCount, 0),
    });
  } catch (error) {
    console.error("[API documents/[id]/sections GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, content, status } = body;

    if (!title) {
      return NextResponse.json({ error: "Section title is required" }, { status: 400 });
    }

    const wordCount = content ? content.trim().split(/\s+/).filter(Boolean).length : 0;
    const newSection: DocumentSection = {
      id: "sec_" + Math.random().toString(36).substring(2, 9),
      title,
      content: content || "",
      wordCount,
      status: status || "draft",
      order: body.order || 99,
    };

    return NextResponse.json(
      {
        success: true,
        message: "Section saved successfully (scaffolded)",
        section: newSection,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API documents/[id]/sections POST] Error:", error);
    return NextResponse.json({ error: "Failed to save section" }, { status: 500 });
  }
}
