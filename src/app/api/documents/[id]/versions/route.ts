import { NextRequest, NextResponse } from "next/server";
import { DUMMY_DOCUMENTS, DocumentVersion } from "@/services/api/dummy-data";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const docId = parseInt(id, 10);

    const doc = DUMMY_DOCUMENTS.find((d) => d.id === docId) || DUMMY_DOCUMENTS[0];
    const versions: DocumentVersion[] = doc.versions || [
      {
        id: 1,
        versionNumber: 1,
        changesSummary: "Initial AI-assisted draft generated",
        format: "markdown",
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 2,
        versionNumber: 2,
        changesSummary: "Updated methodology and formatted equations",
        format: "markdown",
        createdAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      documentId: docId,
      versions,
      currentVersion: versions[versions.length - 1]?.versionNumber || 1,
    });
  } catch (error) {
    console.error("[API documents/[id]/versions GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch versions" }, { status: 500 });
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
    const { changesSummary, format, fileUrl } = body;

    const newVersion: DocumentVersion = {
      id: Math.floor(Math.random() * 1000) + 1,
      versionNumber: body.versionNumber || 3,
      changesSummary: changesSummary || "Automated snapshot",
      format: format || "markdown",
      fileUrl: fileUrl || undefined,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        success: true,
        message: "Version snapshot created successfully (scaffolded)",
        version: newVersion,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API documents/[id]/versions POST] Error:", error);
    return NextResponse.json({ error: "Failed to create version" }, { status: 500 });
  }
}
