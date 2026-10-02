import { NextResponse } from "next/server";
import { getUserPaperIds, requireUser } from "@/services/api/route-auth";
import { loadGraphForPapers } from "@/services/graph/userGraph";

export async function GET(request: Request) {
  const guard = await requireUser();
  if (guard instanceof NextResponse) return guard;

  const q = new URL(request.url).searchParams.get('q')?.toLowerCase().trim();

  try {
    const { entities } = await loadGraphForPapers(await getUserPaperIds(guard.userId));
    const matching = q ? entities.filter((e) => e.name.toLowerCase().includes(q)) : entities;
    return NextResponse.json(matching.slice(0, 100));
  } catch (error) {
    console.error("Failed to fetch entities", error);
    return NextResponse.json({ error: "Failed to fetch entities" }, { status: 500 });
  }
}
