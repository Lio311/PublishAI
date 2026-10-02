import { NextResponse } from "next/server";
import { extractFiguresFromDocument } from "@/services/visionAi.service";
import { requirePaperOwner } from "@/services/api/route-auth";
import { applyRateLimit } from "@/services/rate-limit";
import { db } from "@/services/db";
import { papers } from "@/services/db/schema";
import { eq } from "drizzle-orm";

/**
 * Extracts figures from one of the caller's own papers. The document is resolved
 * server-side from the paper record; arbitrary URLs are not accepted (SSRF).
 */
export async function POST(request: Request) {
  try {
    const { paperId } = await request.json().catch(() => ({}));
    const id = Number(paperId);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "paperId is required" }, { status: 400 });
    }

    const guard = await requirePaperOwner(id);
    if (guard instanceof NextResponse) return guard;
    const limited = await applyRateLimit(request, "ai", guard.userId);
    if (limited) return limited;

    const [paper] = await db.select({ fileUrl: papers.originalFileUrl }).from(papers).where(eq(papers.id, id));
    if (!paper?.fileUrl) {
      return NextResponse.json({ error: "Paper has no uploaded document" }, { status: 400 });
    }

    const figures = await extractFiguresFromDocument(paper.fileUrl);
    return NextResponse.json({ figures });
  } catch (error) {
    console.error("[API figures/extract] Error:", error);
    return NextResponse.json({ error: "Failed to extract figures" }, { status: 500 });
  }
}
