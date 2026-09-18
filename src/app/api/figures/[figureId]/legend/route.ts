import { NextResponse } from "next/server";
import { db } from "@/services/db";
import { figures } from "@/services/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(request: Request, { params }: { params: Promise<{ figureId: string }> }) {
  try {
    const { legend } = await request.json();
    const { figureId } = await params;

    if (!legend) {
      return NextResponse.json({ error: "Legend text is required" }, { status: 400 });
    }

    const [updatedFigure] = await db
      .update(figures)
      .set({ originalLegend: legend })
      .where(eq(figures.id, figureId))
      .returning();

    return NextResponse.json({ figure: updatedFigure });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update legend" }, { status: 500 });
  }
}
