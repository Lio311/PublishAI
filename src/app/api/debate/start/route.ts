import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/services/db";
import { debates } from "@/services/db/schema";
import { inngest } from "@/inngest/client";
import { requirePaperOwner } from "@/services/api/route-auth";
import { applyRateLimit } from "@/services/rate-limit";

/** Starts the multi-agent scientific review debate for one of the caller's papers. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const paperId = Number(body?.paperId);

  const guard = await requirePaperOwner(paperId);
  if (guard instanceof NextResponse) return guard;
  const limited = await applyRateLimit(req, "ai", guard.userId);
  if (limited) return limited;

  const [existing] = await db.select({ status: debates.status }).from(debates).where(eq(debates.paperId, paperId));
  if (existing && existing.status !== "failed") {
    return NextResponse.json({ error: "A debate already exists for this paper", status: existing.status }, { status: 409 });
  }

  if (existing?.status === "failed") {
    await db.update(debates).set({ status: "pending", completedAt: null }).where(eq(debates.paperId, paperId));
  }

  await inngest.send({ name: "submission/review-started", data: { paperId } });
  return NextResponse.json({ started: true }, { status: 202 });
}
