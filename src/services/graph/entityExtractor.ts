import { z } from 'zod';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';

export interface ExtractedEntity {
  name: string;
  type: 'drug' | 'protein' | 'gene' | 'disease' | 'concept' | 'study' | 'method';
  description?: string;
}

export interface ExtractedRelationship {
  sourceName: string;
  targetName: string;
  relationshipType: 'affects' | 'contradicts' | 'supports' | 'causes' | 'treats' | 'correlates';
  evidenceText: string;
  confidenceScore: number;
}

export interface GraphData {
  entities: ExtractedEntity[];
  relationships: ExtractedRelationship[];
}

export async function extractScientificEntities(text: string): Promise<ExtractedEntity[]> {
  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: z.object({
      entities: z.array(
        z.object({
          name: z.string(),
          type: z.enum(['drug', 'protein', 'gene', 'disease', 'concept', 'study', 'method']),
          description: z.string().optional()
        })
      )
    }),
    prompt: `Extract scientific entities from the following text:\n\n${text}`,
  });
  return object.entities;
}

export async function extractScientificGraphData(text: string): Promise<GraphData> {
  const { object } = await generateObject({
    model: openai('gpt-4o'),
    schema: z.object({
      entities: z.array(
        z.object({
          name: z.string(),
          type: z.enum(['drug', 'protein', 'gene', 'disease', 'concept', 'study', 'method']),
          description: z.string().optional()
        })
      ),
      relationships: z.array(
        z.object({
          sourceName: z.string(),
          targetName: z.string(),
          relationshipType: z.enum(['affects', 'contradicts', 'supports', 'causes', 'treats', 'correlates']),
          evidenceText: z.string(),
          confidenceScore: z.number().min(0).max(1)
        })
      )
    }),
    prompt: `Extract a knowledge graph from the text.\n\n${text}`,
  });
  return object;
}
