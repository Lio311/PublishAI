import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { db } from "@/services/db";
import { scientificEntities, scientificRelationships, entityTypeEnum, relationshipTypeEnum } from "@/services/db/schema";
import { eq, or, ilike } from "drizzle-orm";

const entitySchema = z.object({
  entities: z.array(z.object({
    name: z.string(),
    type: z.enum(["drug", "protein", "gene", "disease", "concept", "study", "method"]),
    description: z.string().optional(),
  })),
  relationships: z.array(z.object({
    sourceEntityName: z.string(),
    targetEntityName: z.string(),
    relationshipType: z.enum(["affects", "contradicts", "supports", "causes", "treats", "correlates"]),
    evidenceText: z.string(),
    confidenceScore: z.number().min(0).max(1),
  })),
});

export async function extractAndStoreEntities(text: string, journalId: number) {
  const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
  });

  const structuredModel = model.withStructuredOutput(entitySchema);

  const prompt = `Extract scientific entities and their relationships from the following text:\n\n${text}`;
  
  const result = await structuredModel.invoke(prompt);
  
  // Store entities and relationships
  const entityMap = new Map<string, string>(); // name to id

  for (const ent of result.entities) {
    const existing = await db.query.scientificEntities.findFirst({
      where: eq(scientificEntities.name, ent.name),
    });
    
    if (existing) {
      entityMap.set(ent.name, existing.id);
    } else {
      const [inserted] = await db.insert(scientificEntities).values({
        name: ent.name,
        type: ent.type,
        description: ent.description,
      }).returning({ id: scientificEntities.id });
      
      entityMap.set(ent.name, inserted.id);
    }
  }

  for (const rel of result.relationships) {
    const sourceId = entityMap.get(rel.sourceEntityName);
    const targetId = entityMap.get(rel.targetEntityName);
    
    if (sourceId && targetId) {
      await db.insert(scientificRelationships).values({
        sourceEntityId: sourceId,
        targetEntityId: targetId,
        relationshipType: rel.relationshipType,
        evidenceText: rel.evidenceText,
        confidenceScore: rel.confidenceScore,
        // paperId could be linked if available, here we might not have it or we use journalId somehow
      });
    }
  }
}

export async function queryJournalTrends(journalId: number, topic: string) {
  // Mock logic to return trend context based on the GraphRAG
  const relevantEntities = await db.query.scientificEntities.findMany({
    where: or(
      ilike(scientificEntities.name, `%${topic}%`),
      ilike(scientificEntities.description, `%${topic}%`)
    ),
    limit: 5,
  });
  
  if (relevantEntities.length === 0) {
    return "No significant trends found for this topic.";
  }

  const entityIds = relevantEntities.map(e => e.id);
  
  // Get relationships for these entities
  const relationships = await db.query.scientificRelationships.findMany({
    where: (rel, { inArray, or }) => or(
      inArray(rel.sourceEntityId, entityIds),
      inArray(rel.targetEntityId, entityIds)
    ),

    limit: 10,
  });
  
  // Because Drizzle relations might not be defined for source/target in schema.ts, we'll format text manually
  return `Found ${relevantEntities.length} entities related to "${topic}". ` + 
         `These reflect current journal trends emphasizing topics like: ${relevantEntities.map(e => e.name).join(", ")}.`;
}
