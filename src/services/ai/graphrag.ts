import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { db } from "@/services/db";
import { scientificEntities, scientificRelationships } from "@/services/db/schema";
import { eq, or, ilike } from "drizzle-orm";
import { withRateLimitRetry } from "./rateLimiter";
import { DEFAULT_OPENAI_MINI_MODEL_NAME } from "./provider";

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

export interface ExtractEntitiesOptions {
  modelName?: string;
  maxRetries?: number;
}

export async function extractAndStoreEntities(
  text: string,
  journalId: number,
  options?: ExtractEntitiesOptions
) {
  const modelName = options?.modelName || DEFAULT_OPENAI_MINI_MODEL_NAME;
  const maxRetries = options?.maxRetries ?? 3;

  try {
    const model = new ChatOpenAI({
      modelName,
      temperature: 0,
      maxRetries,
    });

    const structuredModel = model.withStructuredOutput(entitySchema);
    const prompt = `Extract scientific entities and their relationships from the following text:\n\n${text}`;
    
    const result = await withRateLimitRetry(
      () => structuredModel.invoke(prompt) as Promise<z.infer<typeof entitySchema>>,
      { operationName: "graphrag:extractEntities", maxRetries }
    );
    
    if (!result || !result.entities) {
      console.warn("[GraphRAG] No entities extracted from text.");
      return;
    }

    // Store entities and relationships
    const entityMap = new Map<string, string>(); // name to id

    for (const ent of result.entities) {
      try {
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
          
          if (inserted) {
            entityMap.set(ent.name, inserted.id);
          }
        }
      } catch (dbErr) {
        console.warn(`[GraphRAG] Failed to insert or find entity "${ent.name}":`, dbErr);
      }
    }

    for (const rel of result.relationships) {
      try {
        const sourceId = entityMap.get(rel.sourceEntityName);
        const targetId = entityMap.get(rel.targetEntityName);
        
        if (sourceId && targetId) {
          await db.insert(scientificRelationships).values({
            sourceEntityId: sourceId,
            targetEntityId: targetId,
            relationshipType: rel.relationshipType,
            evidenceText: rel.evidenceText,
            confidenceScore: rel.confidenceScore,
          });
        }
      } catch (relErr) {
        console.warn(`[GraphRAG] Failed to insert relationship between "${rel.sourceEntityName}" and "${rel.targetEntityName}":`, relErr);
      }
    }
  } catch (error: any) {
    console.error("[GraphRAG] Extraction pipeline failed:", error);
    throw new Error(`GraphRAG entity extraction failed: ${error?.message || error}`);
  }
}

export async function queryJournalTrends(journalId: number, topic: string) {
  try {
    const relevantEntities = await db.query.scientificEntities.findMany({
      where: or(
        ilike(scientificEntities.name, `%${topic}%`),
        ilike(scientificEntities.description, `%${topic}%`)
      ),
      limit: 5,
    });
    
    if (!relevantEntities || relevantEntities.length === 0) {
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
    
    return `Found ${relevantEntities.length} entities related to "${topic}". ` + 
           `These reflect current journal trends emphasizing topics like: ${relevantEntities.map(e => e.name).join(", ")}.`;
  } catch (error) {
    console.warn("[GraphRAG] queryJournalTrends failed:", error);
    return `Unable to retrieve trends for "${topic}".`;
  }
}
