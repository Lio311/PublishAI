import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const PredictionResultSchema = z.object({
  probabilityScore: z.number().describe("The probability score from 0 to 100 for acceptance"),
  reasoning: z.string().describe("A detailed reasoning explaining why this score was given, analyzing the paper's fit to the journal, originality, and methodology constraints"),
  strengths: z.array(z.string()).describe("Key strengths of the submission regarding the journal"),
  weaknesses: z.array(z.string()).describe("Key weaknesses or missing elements"),
  recommendations: z.array(z.string()).describe("Actionable recommendations to improve the chances of acceptance")
});

export type PredictionResult = z.infer<typeof PredictionResultSchema>;

/**
 * Predicts the probability of a paper being accepted to a target journal.
 * Based on:
 * - Journal scope, impact factor, requirements
 * - Paper title, abstract, methodology clarity, key findings
 * - Known technical requirements (e.g., word count, declarations)
 */
export async function predictAcceptance(
  paperDetails: { title: string; abstract: string; keyFindings: string },
  journalDetails: { name: string; field: string; rules: any; requiredSections: any },
  authorHistory?: string
): Promise<PredictionResult> {
  const prompt = `
    You are an expert scientific editor and reviewer evaluating a manuscript's chance of acceptance to a specific journal.
    
    Journal Details:
    - Name: ${journalDetails.name}
    - Field: ${journalDetails.field}
    - Rules: ${JSON.stringify(journalDetails.rules)}
    - Required Sections: ${JSON.stringify(journalDetails.requiredSections)}

    Manuscript Details:
    - Title: ${paperDetails.title}
    - Abstract: ${paperDetails.abstract}
    - Key Findings: ${paperDetails.keyFindings}
    
    ${authorHistory ? `- Author History/Context: ${authorHistory}` : ""}
    
    Evaluate the manuscript based on:
    1. Scope match (does it fit the journal's field and impact level?)
    2. Originality & Significance (based on title, abstract, and key findings)
    3. Structural adherence (does it seem to contain what the journal requires?)
    
    Provide a probability score (0-100), reasoning, strengths, weaknesses, and recommendations.
  `;

  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: PredictionResultSchema,
    prompt: prompt,
  });

  return object;
}
