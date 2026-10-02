import { NextResponse } from "next/server";
import { getJournalAnalytics } from "@/services/rlhfService";
import { requireAdmin } from '@/services/api/route-auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const { id } = await params;
    const journalId = parseInt(id, 10);
    if (isNaN(journalId)) {
      return NextResponse.json({ error: "Missing or invalid journal ID" }, { status: 400 });
    }

    const analytics = await getJournalAnalytics(journalId);
    return NextResponse.json(analytics);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch journal analytics" }, { status: 500 });
  }
}
