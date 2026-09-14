import { NextResponse } from "next/server";
import { db } from "@/db";
import { journals } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const allJournals = await db.select().from(journals);
  return NextResponse.json(allJournals);
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    // E.g. { name, field, instructionsUrl, ... }
    const [newJournal] = await db.insert(journals).values(data).returning();
    return NextResponse.json(newJournal);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create journal" }, { status: 500 });
  }
}
