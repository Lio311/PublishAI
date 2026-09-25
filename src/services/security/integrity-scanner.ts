import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export interface IntegrityReport {
  plagiarismScore: number; // 0-100 (higher means more copied)
  aiGeneratedScore: number; // 0-100 (higher means more likely AI)
  flaggedSentences: string[];
  passed: boolean;
  notes: string;
}

export class IntegrityScanner {
  /**
   * Scan text for plagiarism and AI footprint using a robust LLM-based check.
   */
  static async scanManuscript(text: string): Promise<IntegrityReport> {
    console.log("[Integrity Scanner] Analyzing manuscript for plagiarism and AI patterns using LLM...");
    
    try {
      const { object } = await generateObject({
        model: openai('gpt-4o'),
        schema: z.object({
          plagiarismScore: z.number().min(0).max(100).describe("Estimated percentage of plagiarized content (0-100)."),
          aiGeneratedScore: z.number().min(0).max(100).describe("Estimated probability that the text is AI-generated (0-100)."),
          flaggedSentences: z.array(z.string()).describe("List of specific sentences flagged as potentially plagiarized or AI-generated."),
          notes: z.string().describe("Detailed notes on the analysis, explaining the scores and findings.")
        }),
        prompt: `You are an expert academic integrity auditor. Your task is to analyze the following manuscript text for potential plagiarism and AI-generated content footprints. 
        
Examine the text for:
1. Plagiarism: Look for overly generic phrases, sudden shifts in tone, or sections that appear copied without proper citation.
2. AI-generated footprint: Look for common LLM artifacts (e.g., "Furthermore", "In conclusion", "It is important to note", "delve", "tapestry"), highly uniform sentence lengths, and lack of human nuance.

Provide an estimated plagiarism score and an AI-generated score (both 0-100). List any specific sentences that seem suspicious. Finally, provide detailed notes justifying your scores.

Manuscript Text:
"""
${text.substring(0, 100000)}
"""`
      });

      // Thresholds: Plagiarism > 20% or AI > 40% is considered a failure
      const passed = object.plagiarismScore <= 20 && object.aiGeneratedScore <= 40;

      return {
        plagiarismScore: object.plagiarismScore,
        aiGeneratedScore: object.aiGeneratedScore,
        flaggedSentences: object.flaggedSentences,
        passed,
        notes: passed 
          ? "Manuscript passed integrity checks.\n\nAuditor Notes:\n" + object.notes 
          : "Warning: High similarity or AI footprint detected. Manual review recommended.\n\nAuditor Notes:\n" + object.notes,
      };
    } catch (error) {
      console.error("[Integrity Scanner] Error during LLM scan:", error);
      throw new Error("Failed to perform integrity scan due to an error with the LLM provider.");
    }
  }
}
