import { db } from "@/services/db";
import { scientificEntities, scientificRelationships } from "@/services/db/schema";
import { inArray } from "drizzle-orm";
import { GraphData } from "./entityExtractor";

export async function buildGraphFromRelationships(
  paperId: number,
  graphData: GraphData
): Promise<void> {
  const { entities, relationships } = graphData;
  if (entities.length === 0) return;

  for (const entity of entities) {
    await db.insert(scientificEntities).values({
      name: entity.name.toLowerCase(),
      type: entity.type,
      description: entity.description,
    }).onConflictDoNothing({ target: scientificEntities.name });
  }

  const allEntityNames = Array.from(new Set([
    ...entities.map(e => e.name.toLowerCase()),
    ...relationships.map(r => r.sourceName.toLowerCase()),
    ...relationships.map(r => r.targetName.toLowerCase()),
  ]));

  if (allEntityNames.length === 0) return;

  const dbEntities = await db.query.scientificEntities.findMany({
    where: inArray(scientificEntities.name, allEntityNames)
  });

  const nameToId = new Map(dbEntities.map(e => [e.name, e.id]));

  const validRelationships = relationships.map(r => ({
    sourceEntityId: nameToId.get(r.sourceName.toLowerCase())!,
    targetEntityId: nameToId.get(r.targetName.toLowerCase())!,
    relationshipType: r.relationshipType,
    evidenceText: r.evidenceText,
    paperId: paperId,
    confidenceScore: r.confidenceScore,
  })).filter(r => r.sourceEntityId && r.targetEntityId);

  if (validRelationships.length > 0) {
    await db.insert(scientificRelationships).values(validRelationships);
  }
}
