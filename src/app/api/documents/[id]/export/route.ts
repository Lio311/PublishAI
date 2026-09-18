import { NextRequest, NextResponse } from "next/server";
import { DUMMY_DOCUMENTS } from "@/services/api/dummy-data";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const docId = parseInt(id, 10);
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "pdf";

    const doc = DUMMY_DOCUMENTS.find((d) => d.id === docId) || DUMMY_DOCUMENTS[0];

    return NextResponse.json({
      success: true,
      documentId: docId,
      title: doc.title,
      format,
      downloadUrl: `/downloads/mock/${id}_manuscript.${format}`,
      fileSize: "1.4 MB",
      generatedAt: new Date().toISOString(),
      message: `Scaffolded export for document ${id} in ${format.toUpperCase()} format`,
    });
  } catch (error) {
    console.error("[API documents/[id]/export GET] Error:", error);
    return NextResponse.json({ error: "Failed to export document" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const docId = parseInt(id, 10);
    const body = await req.json();
    const format = body.format || "pdf";
    const options = body.options || {};

    return NextResponse.json({
      success: true,
      documentId: docId,
      format,
      options,
      status: "ready",
      downloadUrl: `/downloads/mock/${id}_manuscript.${format}`,
      generatedAt: new Date().toISOString(),
      message: `Export job completed for ${format.toUpperCase()} (scaffolded)`,
    });
  } catch (error) {
    console.error("[API documents/[id]/export POST] Error:", error);
    return NextResponse.json({ error: "Failed to process export job" }, { status: 500 });
  }
}
