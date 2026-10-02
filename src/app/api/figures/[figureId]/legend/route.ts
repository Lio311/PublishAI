import { NextResponse } from "next/server";
import { db } from "@/services/db";
import { figures } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { requireFigureOwner } from "@/services/api/route-auth";

export async function PUT(request: Request, { params }: { params: Promise<{ figureId: string }> }) {
  try {
    const { figureId } = await params;
    const guard = await requireFigureOwner(figureId);
    if (guard instanceof NextResponse) return guard;

    const { legend } = await request.json();

    if (!legend || typeof legend !== "string" || legend.length > 5000) {
      return NextResponse.json({ error: "Legend text is required" }, { status: 400 });
    }

    const [updatedFigure] = await db
      .update(figures)
      .set({ originalLegend: legend })
      .where(eq(figures.id, figureId))
      .returning();

    return NextResponse.json({ figure: updatedFigure });
  } catch {
    return NextResponse.json({ error: "Failed to update legend" }, { status: 500 });
  }
}
