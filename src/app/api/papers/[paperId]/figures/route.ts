import { NextResponse } from "next/server";
import { db } from "@/db";
import { figures, figureAnalyses } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ paperId: string }> }
) {
  const { paperId } = await params;
  try {
    const id = parseInt(paperId, 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid paper ID" }, { status: 400 });
    }

    const paperFigures = await db
      .select()
      .from(figures)
      .where(eq(figures.paperId, id));

    const figuresWithAnalyses = await Promise.all(paperFigures.map(async (fig) => {
      const analyses = await db
        .select()
        .from(figureAnalyses)
        .where(eq(figureAnalyses.figureId, fig.id));
      
      return { ...fig, analyses };
    }));

    return NextResponse.json({ figures: figuresWithAnalyses });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch figures" }, { status: 500 });
  }
}
