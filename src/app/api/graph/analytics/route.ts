import { NextResponse } from "next/server";
import { getUserPaperIds, requireUser } from "@/services/api/route-auth";
import { countBy, loadGraphForPapers } from "@/services/graph/userGraph";

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await requireUser();
  if (guard instanceof NextResponse) return guard;

  try {
    const { entities, relationships } = await loadGraphForPapers(await getUserPaperIds(guard.userId));

    const entityDistribution = countBy(entities, (e) => e.type);
    const relationshipDistribution = countBy(relationships, (r) => r.relationshipType);

    const connections = new Map<string, number>();
    for (const r of relationships) {
      connections.set(r.sourceEntityId, (connections.get(r.sourceEntityId) ?? 0) + 1);
      connections.set(r.targetEntityId, (connections.get(r.targetEntityId) ?? 0) + 1);
    }
    const topEntities = [...entities]
      .sort((a, b) => (connections.get(b.id) ?? 0) - (connections.get(a.id) ?? 0))
      .slice(0, 10)
      .map((e) => ({ id: e.id, name: e.name, type: e.type, connections: connections.get(e.id) ?? 0 }));

    return NextResponse.json({
      summary: {
        totalEntities: entities.length,
        totalRelationships: relationships.length,
        mostCommonEntityType: entityDistribution[0]?.name ?? '-',
        mostCommonRelationship: relationshipDistribution[0]?.name ?? '-',
      },
      entityDistribution,
      relationshipDistribution,
      topEntities,
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
