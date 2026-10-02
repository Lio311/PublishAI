import { NextResponse } from "next/server";
import { requirePaperOwner } from "@/services/api/route-auth";
import { loadGraphForPapers } from "@/services/graph/userGraph";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ paperId: string }> }
) {
  const paperId = Number((await params).paperId);
  const guard = await requirePaperOwner(paperId);
  if (guard instanceof NextResponse) return guard;

  try {
    const { entities, relationships } = await loadGraphForPapers([paperId], 500);

    const nodes = entities.map((e) => ({
      id: e.id,
      name: e.name,
      group: e.type,
      description: e.description,
    }));
    const links = relationships.map((r) => ({
      source: r.sourceEntityId,
      target: r.targetEntityId,
      label: r.relationshipType,
      evidence: r.evidenceText,
      confidence: r.confidenceScore,
    }));

    return NextResponse.json({ nodes, links });
  } catch (error) {
    console.error("Failed to fetch graph data", error);
    return NextResponse.json({ error: "Failed to fetch graph data" }, { status: 500 });
  }
}
