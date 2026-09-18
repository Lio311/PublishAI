import { NextResponse } from "next/server";
import { db } from "@/services/db";
import { sandboxRuns, generatedCharts } from "@/services/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/app/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const paperId = parseInt(id, 10);
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
