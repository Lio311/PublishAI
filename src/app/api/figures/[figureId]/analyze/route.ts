import { NextResponse } from "next/server";
import { db } from "@/services/db";
import { figures, figureAnalyses } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { analyzeFigureWithVisionAi } from "@/services/visionAi.service";
import { requireFigureOwner } from "@/services/api/route-auth";
import { applyRateLimit } from "@/services/rate-limit";

export async function POST(request: Request, { params }: { params: Promise<{ figureId: string }> }) {
  try {
    const { figureId } = await params;
    const guard = await requireFigureOwner(figureId);
    if (guard instanceof NextResponse) return guard;
    const limited = await applyRateLimit(request, "ai", guard.userId);
    if (limited) return limited;

    const { claims } = await request.json();

    const [figure] = await db.select().from(figures).where(eq(figures.id, figureId));
    if (!figure) {
      return NextResponse.json({ error: "Figure not found" }, { status: 404 });
    }

    const analysis = await analyzeFigureWithVisionAi(
      figure.imageUrl,
      figure.originalLegend || "",
      claims || []
    );

    const [savedAnalysis] = await db.insert(figureAnalyses).values({
      figureId: figure.id,
      modelUsed: analysis.modelUsed,
      legendAccuracyScore: analysis.legendAccuracyScore,
      claimVerificationStatus: analysis.claimVerificationStatus,
      suggestedLegend: analysis.suggestedLegend,
      issuesFound: analysis.issuesFound,
      rawAnalysis: analysis.rawAnalysis,
    }).returning();

    return NextResponse.json({ analysis: savedAnalysis });
  } catch {
    return NextResponse.json({ error: "Failed to analyze figure" }, { status: 500 });
  }
}
