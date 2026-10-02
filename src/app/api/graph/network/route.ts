import { NextResponse } from "next/server";
import { getUserPaperIds, requireUser } from "@/services/api/route-auth";
import { loadGraphForPapers } from "@/services/graph/userGraph";

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await requireUser();
  if (guard instanceof NextResponse) return guard;

  try {
    const { entities, relationships } = await loadGraphForPapers(await getUserPaperIds(guard.userId));

    const nodes = entities.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      description: e.description,
    }));
    const edges = relationships.map((r) => ({
      source: r.sourceEntityId,
      target: r.targetEntityId,
      type: r.relationshipType,
      evidenceText: r.evidenceText,
      confidenceScore: r.confidenceScore,
    }));

    return NextResponse.json({ nodes, edges });
  } catch (error) {
    console.error("Error fetching network data:", error);
    return NextResponse.json({ error: "Failed to fetch network graph" }, { status: 500 });
  }
}
