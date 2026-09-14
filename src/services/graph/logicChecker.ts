import { db } from "@/db";
import { scientificRelationships, scientificEntities } from "@/db/schema";
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export interface LogicCheckResult {
  claim: string;
  isConsistent: boolean;
  contradictingEvidence?: string[];
  supportingEvidence?: string[];
}

export async function checkLogicalConsistency(claims: string[], paperId?: number): Promise<LogicCheckResult[]> {
  const allRels = await db.select({
    id: scientificRelationships.id,
    sourceId: scientificRelationships.sourceEntityId,
    targetId: scientificRelationships.targetEntityId,
    relType: scientificRelationships.relationshipType,
    evidence: scientificRelationships.evidenceText
  }).from(scientificRelationships).limit(200);
  
  const graphContext = allRels.map(r => `Relationship: [Entity ${r.sourceId}] ${r.relType} [Entity ${r.targetId}] - Evidence: "${r.evidence}"`).join("\\n");

  const results: LogicCheckResult[] = [];
  
  for (const claim of claims) {
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: z.object({
        isConsistent: z.boolean(),
        contradictingEvidence: z.array(z.string()).optional(),
        supportingEvidence: z.array(z.string()).optional()
      }),
      prompt: `Based on the following knowledge graph subset, evaluate the logical consistency of this claim.\\n\\nGraph:\\n${graphContext}\\n\\nClaim: ${claim}`,
    });
    
    results.push({
      claim,
      isConsistent: object.isConsistent,
      contradictingEvidence: object.contradictingEvidence,
      supportingEvidence: object.supportingEvidence
    });
  }
  
  return results;
}
