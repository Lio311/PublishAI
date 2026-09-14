import { NextResponse } from "next/server";
import { db } from "@/db";
import { promptStrategies } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const strategies = await db.select().from(promptStrategies);
    return NextResponse.json(strategies);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch strategies" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, promptTemplate, isActive } = body;
    
    if (!name || !promptTemplate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newStrategy = await db.insert(promptStrategies).values({
      name,
      promptTemplate,
      isActive: isActive !== undefined ? isActive : true
    }).returning();

    return NextResponse.json(newStrategy[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create strategy" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, isActive } = body;
    
    if (!id || isActive === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updated = await db.update(promptStrategies)
      .set({ isActive })
      .where(eq(promptStrategies.id, id))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update strategy" }, { status: 500 });
  }
}
