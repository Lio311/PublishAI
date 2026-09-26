import { NextRequest, NextResponse } from "next/server";
import { db } from "@/services/db";
import { papers, figures, figureAnalyses } from "@/services/db/schema";
import { eq, inArray, asc } from "drizzle-orm";
import { auth } from "@/app/auth";
import { applyRateLimit } from "@/services/rate-limit";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.coerce.number().int().positive("Paper ID must be a positive integer"),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = await applyRateLimit(req, "read", session.user.id);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const rawParams = await params;
    const parseResult = paramsSchema.safeParse(rawParams);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid paper ID", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }
    const paperId = parseResult.data.id;

    const paper = await db.query.papers.findFirst({
      where: eq(papers.id, paperId),
      columns: { id: true, userId: true },
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    if (paper.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const paperFigures = await db
      .select()
      .from(figures)
      .where(eq(figures.paperId, paperId))
      .orderBy(asc(figures.figureNumber));

    let figuresWithAnalyses: Array<typeof paperFigures[number] & { analyses: (typeof figureAnalyses.$inferSelect)[] }> = [];

    if (paperFigures.length > 0) {
      const figureIds = paperFigures.map((f) => f.id);
      const allAnalyses = await db
        .select()
        .from(figureAnalyses)
        .where(inArray(figureAnalyses.figureId, figureIds));

      const analysisMap = new Map<string, (typeof figureAnalyses.$inferSelect)[]>();
      for (const analysis of allAnalyses) {
        const list = analysisMap.get(analysis.figureId) || [];
        list.push(analysis);
        analysisMap.set(analysis.figureId, list);
      }

      figuresWithAnalyses = paperFigures.map((fig) => ({
        ...fig,
        analyses: analysisMap.get(fig.id) || [],
      }));
    }

    return NextResponse.json({ figures: figuresWithAnalyses });
  } catch (error) {
    console.error("[API papers/[id]/figures GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch figures" }, { status: 500 });
  }
}
