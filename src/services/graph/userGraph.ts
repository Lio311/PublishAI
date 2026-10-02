import { inArray } from "drizzle-orm";
import { db } from "@/services/db";
import { scientificEntities, scientificRelationships } from "@/services/db/schema";

export type GraphEntity = typeof scientificEntities.$inferSelect;
export type GraphRelationship = typeof scientificRelationships.$inferSelect;

/**
 * Loads the knowledge-graph slice extracted from the given papers. Entities are
 * shared across papers, so they are only exposed when referenced by one of the
 * caller's relationships; evidence text from other users' papers never leaks.
 */
export async function loadGraphForPapers(
  paperIds: number[],
  relationshipLimit = 2000
): Promise<{ entities: GraphEntity[]; relationships: GraphRelationship[] }> {
  if (paperIds.length === 0) return { entities: [], relationships: [] };

  const relationships = await db
    .select()
    .from(scientificRelationships)
    .where(inArray(scientificRelationships.paperId, paperIds))
    .limit(relationshipLimit);

  const entityIds = Array.from(new Set(relationships.flatMap((r) => [r.sourceEntityId, r.targetEntityId])));
  if (entityIds.length === 0) return { entities: [], relationships };

  const entities = await db.select().from(scientificEntities).where(inArray(scientificEntities.id, entityIds));
  return { entities, relationships };
}

export function countBy<T>(items: T[], key: (item: T) => string): Array<{ name: string; value: number }> {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  return [...counts.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}
