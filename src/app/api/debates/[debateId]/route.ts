import { NextRequest, NextResponse } from "next/server";
import { db } from "@/services/db";
import { debates, debateMessages } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { requirePaperOwner } from "@/services/api/route-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ debateId: string }> }
) {
  const { debateId } = await params;
  const paperId = parseInt(debateId, 10);
  
  if (isNaN(paperId)) {
    return NextResponse.json({ error: "Invalid paper ID" }, { status: 400 });
  }

  // The route segment carries the paper id (DebateRoom passes paperId).
  const guard = await requirePaperOwner(paperId);
  if (guard instanceof NextResponse) return guard;

  const [debate] = await db.select().from(debates).where(eq(debates.paperId, paperId));
  
  if (!debate) {
    return NextResponse.json({ error: "Debate not found" }, { status: 404 });
  }

  const messages = await db.select().from(debateMessages).where(eq(debateMessages.debateId, debate.id));

  return NextResponse.json({ debate, messages });
}
