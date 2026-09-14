import { NextResponse } from "next/server";
import { getJournalAnalytics } from "@/services/rlhfService";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const journalId = params.id;
    if (!journalId) {
      return NextResponse.json({ error: "Missing journal ID" }, { status: 400 });
    }

    const analytics = await getJournalAnalytics(journalId);
    return NextResponse.json(analytics);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch journal analytics" }, { status: 500 });
  }
}
