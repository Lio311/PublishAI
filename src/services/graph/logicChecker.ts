import { db } from "@/services/db";
import { scientificRelationships, scientificEntities } from "@/services/db/schema";
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

import { eq } from "drizzle-orm";

export interface LogicCheckResult {
  claim: string;
  isConsistent: boolean;
  contradictingEvidence?: string[];
  supportingEvidence?: string[];
}

export async function checkLogicalConsistency(claims: string[], paperId?: number): Promise<LogicCheckResult[]> {
  let query: any = db.select({
    id: scientificRelationships.id,
    sourceId: scientificRelationships.sourceEntityId,
    targetId: scientificRelationships.targetEntityId,
    relType: scientificRelationships.relationshipType,
    evidence: scientificRelationships.evidenceText
  }).from(scientificRelationships);

  if (paperId) {
    query = query.where(eq(scientificRelationships.paperId, paperId));
  }

  const allRels = await query.limit(200);
  
  const graphContext = allRels.map((r: { sourceId: string; targetId: string; relType: string; evidence: string }) => `Relationship: [Entity ${r.sourceId}] ${r.relType} [Entity ${r.targetId}] - Evidence: "${r.evidence}"`).join("\\n");

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
