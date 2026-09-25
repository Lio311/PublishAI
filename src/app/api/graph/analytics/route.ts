import { NextResponse } from "next/server";
import { db } from "@/services/db";
import { scientificEntities, scientificRelationships } from "@/services/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [
      [{ totalEntities }],
      entitiesByType,
      [{ totalRelationships }],
      relationshipsByType,
      topEntitiesQuery
    ] = await Promise.all([
      db.select({ totalEntities: sql<number>`count(*)::int` }).from(scientificEntities),
      db.select({ type: scientificEntities.type, count: sql<number>`count(*)::int` }).from(scientificEntities).groupBy(scientificEntities.type),
      db.select({ totalRelationships: sql<number>`count(*)::int` }).from(scientificRelationships),
      db.select({ type: scientificRelationships.relationshipType, count: sql<number>`count(*)::int` }).from(scientificRelationships).groupBy(scientificRelationships.relationshipType),
      db.execute(sql`
        SELECT 
          e.name, 
          e.type, 
          CAST(COUNT(r.id) AS INTEGER) as "connectionCount"
        FROM ${scientificEntities} e
        LEFT JOIN (
          SELECT id, source_entity_id as entity_id FROM ${scientificRelationships}
          UNION ALL
          SELECT id, target_entity_id as entity_id FROM ${scientificRelationships}
        ) r ON e.id = r.entity_id
        GROUP BY e.id, e.name, e.type
        ORDER BY "connectionCount" DESC
        LIMIT 10
      `)
    ]);

    const topEntitiesRaw = (topEntitiesQuery as any).rows || topEntitiesQuery;
    const topEntitiesList = Array.isArray(topEntitiesRaw) ? topEntitiesRaw : [];

    // Find most common
    let mostCommonEntityType = '-';
    let maxEntityCount = 0;
    for (const e of entitiesByType) {
      if (e.count > maxEntityCount) {
        maxEntityCount = e.count;
        mostCommonEntityType = e.type;
      }
    }

    let mostCommonRelationship = '-';
    let maxRelCount = 0;
    for (const r of relationshipsByType) {
      if (r.count > maxRelCount) {
        maxRelCount = r.count;
        mostCommonRelationship = r.type;
      }
    }

    return NextResponse.json({
      summary: {
        totalEntities,
        totalRelationships,
        mostCommonEntityType,
        mostCommonRelationship
      },
      entityDistribution: entitiesByType.map(e => ({ name: e.type, value: e.count })),
      relationshipDistribution: relationshipsByType.map(r => ({ name: r.type, value: r.count })),
      topEntities: topEntitiesList.map((row: any) => ({
        id: row.name, // hack id
        name: row.name,
        type: row.type,
        connections: row.connectionCount
      }))
    });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
