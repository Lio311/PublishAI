import { NextRequest, NextResponse } from "next/server";
import { requireDocumentOwner } from "@/services/api/route-auth";
import { splitSections } from "@/services/documents/manuscriptStore";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireDocumentOwner((await params).id);
  if (guard instanceof NextResponse) return guard;

  const sections = splitSections(guard.document.content ?? "");
  return NextResponse.json({
    documentId: guard.document.id,
    sections,
    totalSections: sections.length,
    totalWords: sections.reduce((sum, s) => sum + s.wordCount, 0),
  });
}
