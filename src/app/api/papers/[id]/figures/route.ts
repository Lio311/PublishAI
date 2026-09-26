import { NextResponse } from "next/server";
import { db } from "@/services/db";
import { papers, figures, figureAnalyses } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/app/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: paperId } = await params;
    const id = parseInt(paperId, 10);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid paper ID" }, { status: 400 });
    }

    const paper = await db.query.papers.findFirst({
      where: eq(papers.id, id),
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
