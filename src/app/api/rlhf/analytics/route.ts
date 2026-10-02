import { NextResponse } from "next/server";
import { db } from "@/services/db";
import { rlhfFeedbackLogs } from "@/services/db/schema";
import { sql } from "drizzle-orm";
import { requireAdmin } from '@/services/api/route-auth';

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const stats = await db.select({
      outcome: rlhfFeedbackLogs.outcome,
      count: sql<number>`count(*)`
    })
    .from(rlhfFeedbackLogs)
    .groupBy(rlhfFeedbackLogs.outcome);

    const total = stats.reduce((acc, curr) => acc + Number(curr.count), 0);

    return NextResponse.json({
      totalSubmissions: total,
      outcomes: stats.map(s => ({
        status: s.outcome,
        count: Number(s.count),
        percentage: total > 0 ? (Number(s.count) / total) * 100 : 0
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
