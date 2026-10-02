import { NextResponse } from "next/server";
import { buildFineTuningDataset } from "@/services/rlhfService";
import { requireAdmin } from '@/services/api/route-auth';

const OUTCOMES = new Set(["accepted", "rejected", "revision_required"]);

/** Returns the fine-tuning dataset as a JSONL download (serverless file paths are not downloadable). */
export async function POST(request: Request) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const body = await request.json().catch(() => ({}));
    const journalId = Number.isInteger(body?.journalId) ? body.journalId : undefined;
    const outcomeFilter = OUTCOMES.has(body?.outcomeFilter) ? body.outcomeFilter : undefined;

    const jsonl = await buildFineTuningDataset(journalId, outcomeFilter);
    return new Response(jsonl, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Content-Disposition": `attachment; filename="finetune_dataset_${Date.now()}.jsonl"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[API rlhf/export] Error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
