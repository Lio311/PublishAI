import { NextResponse } from "next/server";
import { db } from "@/services/db";
import { scientificEntities, scientificRelationships } from "@/services/db/schema";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [nodes, edges] = await Promise.all([
      db.select({
        id: scientificEntities.id,
        name: scientificEntities.name,
        type: scientificEntities.type,
        description: scientificEntities.description,
      }).from(scientificEntities),
      
      db.select({
        source: scientificRelationships.sourceEntityId,
        target: scientificRelationships.targetEntityId,
        type: scientificRelationships.relationshipType,
        evidenceText: scientificRelationships.evidenceText,
        confidenceScore: scientificRelationships.confidenceScore,
      }).from(scientificRelationships)
    ]);

    return NextResponse.json({ nodes, edges });
  } catch (error) {
    console.error("Error fetching network data:", error);
    return NextResponse.json({ error: "Failed to fetch network graph" }, { status: 500 });
  }
}
