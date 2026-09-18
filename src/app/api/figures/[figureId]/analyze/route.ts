import { NextResponse } from "next/server";
import { db } from "@/services/db";
import { figures, figureAnalyses } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { analyzeFigureWithVisionAi } from "@/services/visionAi.service";

export async function POST(request: Request, { params }: { params: Promise<{ figureId: string }> }) {
  try {
    const { claims } = await request.json();
    const { figureId } = await params;

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
  } catch (error) {
    return NextResponse.json({ error: "Failed to analyze figure" }, { status: 500 });
  }
}
