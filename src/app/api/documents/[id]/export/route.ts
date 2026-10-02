import { NextRequest, NextResponse } from "next/server";
import { requireDocumentOwner } from "@/services/api/route-auth";
import { documentService } from "@/services/documents/documentService";

/** Downloads one of the caller's documents as Word or PDF (`?format=docx|pdf`). */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireDocumentOwner((await params).id);
  if (guard instanceof NextResponse) return guard;
  const { document } = guard;

  const format = req.nextUrl.searchParams.get("format") === "pdf" ? "pdf" : "docx";
  try {
    const result = await documentService.exportDocument({
      title: document.title,
      content: document.content ?? "",
      format,
      abstractText: document.abstract ?? undefined,
    });
    const filename = `${document.title || "manuscript"}.${format}`;
    return new Response(new Uint8Array(result.buffer), {
      headers: {
        "Content-Type": result.mimeType,
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[API documents/[id]/export] Error:", error);
    return NextResponse.json({ error: "Failed to export document" }, { status: 500 });
  }
}
