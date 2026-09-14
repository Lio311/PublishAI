import { NextResponse } from "next/server";
import { db } from "@/db";
import { sandboxRuns, generatedCharts } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const paperId = parseInt(params.id, 10);
    if (isNaN(paperId)) {
      return NextResponse.json({ error: "Invalid paper ID" }, { status: 400 });
    }
    
    // Get the latest sandbox run for this paper
    const [latestRun] = await db.select()
      .from(sandboxRuns)
      .where(eq(sandboxRuns.paperId, paperId))
      .orderBy(desc(sandboxRuns.createdAt))
      .limit(1);

    if (!latestRun) {
      return NextResponse.json({ run: null, charts: [] });
    }

    // Get the generated charts for this run
    const charts = await db.select()
      .from(generatedCharts)
      .where(eq(generatedCharts.sandboxRunId, latestRun.id));

    return NextResponse.json({ run: latestRun, charts });
  } catch (error: any) {
    console.error("Fetch sandbox run error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
