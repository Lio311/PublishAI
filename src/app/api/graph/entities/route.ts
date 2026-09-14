import { NextResponse } from "next/server";
import { db } from "@/db";
import { scientificEntities } from "@/db/schema";
import { ilike } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');

  try {
    let query = db.select().from(scientificEntities);
    if (q) {
      query = query.where(ilike(scientificEntities.name, `%${q}%`)) as any;
    }

    const entities = await query.limit(100);
    return NextResponse.json(entities);
  } catch (error) {
    console.error("Failed to fetch entities", error);
    return NextResponse.json({ error: "Failed to fetch entities" }, { status: 500 });
  }
}
