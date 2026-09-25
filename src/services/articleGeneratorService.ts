/**
 * Article Generator Service
 * Generates the final scientific article using AI.
 */

import { ArticleReference } from './researchService';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export interface GenerationInput {
  statisticalConclusions: string;
  graphs: string[]; // Array of image URLs or base64 data
  references: ArticleReference[];
}

export interface GeneratedArticle {
  title: string;
  abstract: string;
  introduction: string;
  methodology: string;
  results: string;
  conclusion: string;
  references: string[];
}

export class ArticleGeneratorService {
  /**
   * Generates a final scientific article using statistical conclusions,
   * sandbox graphs, and full-text references.
   * 
   * @param input The input data for generation.
   * @returns Promise resolving to the GeneratedArticle.
   */
  async generateArticle(input: GenerationInput): Promise<GeneratedArticle> {
    console.log('[ArticleGeneratorService] Generating AI article...');
    
    if (!input || !input.references || !input.graphs) {
      throw new Error('Invalid generation input: missing references or graphs');
    }

    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: z.object({
        title: z.string(),
        abstract: z.string(),
        introduction: z.string(),
        methodology: z.string(),
        results: z.string(),
        conclusion: z.string(),
        references: z.array(z.string()),
      }),
      prompt: `Generate a comprehensive scientific article based on the following data:
      
Statistical Conclusions:
${input.statisticalConclusions}

References provided:
${input.references.map(r => `- ${r.title} by ${r.authors.join(', ')} (${r.publicationYear})\n  Abstract/Text: ${r.fullText}`).join('\n')}

Graphs available: ${input.graphs.length} graphs.

Please synthesize this information into a cohesive academic paper format. Make sure to properly cite the references in the text and list them at the end.`,
    });

    return object;
  }
}

export const articleGeneratorService = new ArticleGeneratorService();
