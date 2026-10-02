import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/services/db";
import { papers } from "@/services/db/schema";
import { requirePaperOwner } from "@/services/api/route-auth";
import { filenameFromBlobUrl, openPaperFile } from "@/services/storage/paperFiles";

/** Streams the paper's original upload from private storage to its owner. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const paperId = Number((await params).id);
  const guard = await requirePaperOwner(paperId);
  if (guard instanceof NextResponse) return guard;

  const [paper] = await db
    .select({ fileUrl: papers.originalFileUrl, title: papers.title, format: papers.originalFormat })
    .from(papers)
    .where(eq(papers.id, paperId));
  if (!paper?.fileUrl) {
    return NextResponse.json({ error: "No file uploaded for this paper" }, { status: 404 });
  }

  const file = await openPaperFile(paper.fileUrl).catch(() => null);
  if (!file) {
    return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
  }

  const extension = paper.format ? `.${paper.format}` : "";
  const filename = paper.title ? `${paper.title}${extension}` : filenameFromBlobUrl(paper.fileUrl);
  return new Response(file.stream, {
    headers: {
      "Content-Type": file.blob.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
