import { NextResponse } from "next/server";
import { db } from "@/services/db";
import { scientificRelationships, scientificEntities } from "@/services/db/schema";
import { inArray } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ paperId: string }> }
) {
  const { paperId } = await params;
  try {
    // For visualization, we fetch all relationships (and we can filter by paperId if needed)
    // To show a nice graph, we might want to just fetch a subset of the global graph.
    const rels = await db.select().from(scientificRelationships).limit(500);

    const entityIds = Array.from(new Set([
      ...rels.map(r => r.sourceEntityId),
      ...rels.map(r => r.targetEntityId)
    ]));

    if (entityIds.length === 0) {
      return NextResponse.json({ nodes: [], links: [] });
    }

    const entities = await db.query.scientificEntities.findMany({
      where: inArray(scientificEntities.id, entityIds)
    });

    const nodes = entities.map(e => ({
      id: e.id,
      name: e.name,
      group: e.type,
      description: e.description
    }));

    const links = rels.map(r => ({
      source: r.sourceEntityId,
      target: r.targetEntityId,
      label: r.relationshipType,
      evidence: r.evidenceText,
      confidence: r.confidenceScore
    }));

    return NextResponse.json({ nodes, links });
  } catch (error) {
    console.error("Failed to fetch graph data", error);
    return NextResponse.json({ error: "Failed to fetch graph data" }, { status: 500 });
  }
}
