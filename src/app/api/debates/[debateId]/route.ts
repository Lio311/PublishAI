import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { debates, debateMessages } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: { debateId: string } }) {
  const { debateId } = params;
  
  const [debate] = await db.select().from(debates).where(eq(debates.id, debateId));
  const messages = await db.select().from(debateMessages).where(eq(debateMessages.debateId, debateId));

  if (!debate) {
    return NextResponse.json({ error: "Debate not found" }, { status: 404 });
  }

  return NextResponse.json({ debate, messages });
}
