import { NextRequest, NextResponse } from "next/server";
import { db } from "@/services/db";
import { papers, sandboxRuns, generatedCharts } from "@/services/db/schema";
import { eq, desc } from "drizzle-orm";
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

    // Verify paper exists and belongs to the authenticated user
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

    // Get the latest sandbox run for this paper
    const [latestRun] = await db
      .select()
      .from(sandboxRuns)
      .where(eq(sandboxRuns.paperId, paperId))
      .orderBy(desc(sandboxRuns.createdAt))
      .limit(1);

    if (!latestRun) {
      return NextResponse.json({ run: null, charts: [] });
    }

    // Get the generated charts for this run
    const charts = await db
      .select()
      .from(generatedCharts)
      .where(eq(generatedCharts.sandboxRunId, latestRun.id));

    return NextResponse.json({ run: latestRun, charts });
  } catch (error) {
    console.error("[API papers/[id]/sandbox GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sandbox run" },
      { status: 500 }
    );
  }
}
