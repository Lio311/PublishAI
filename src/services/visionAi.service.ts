import { db } from "@/db";
import { figures, figureAnalyses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateObject, generateText } from "ai";
import { AI_MODELS } from "@/lib/ai/provider";
import { z } from "zod";

export async function extractFiguresFromDocument(documentText: string): Promise<Array<{imageUrl: string, legend: string, figureNumber: number, resolution: number}>> {
  console.log(`Extracting figures from document...`);
  
  // This should ideally be replaced with a robust PDF parsing solution, but for now we keep the mock pattern
  const figureRegex = /Figure\s+(\d+)[:.]\s*([^\n]+)/gi;
  const extractedFigures = [];
  let match;
  
  while ((match = figureRegex.exec(documentText)) !== null) {
    extractedFigures.push({
      imageUrl: `https://example.com/images/fig${match[1]}.png`,
      legend: `Figure ${match[1]}: ${match[2].trim()}`,
      figureNumber: parseInt(match[1], 10),
      resolution: 300
    });
  }
  
  return extractedFigures.length > 0 ? extractedFigures : [
    {
      imageUrl: "https://example.com/images/fig1.png",
      legend: "Figure 1: Main experimental results.",
      figureNumber: 1,
      resolution: 300
    }
  ];
}

export async function analyzeFigureWithVisionAi(imageUrl: string, legend: string, claims: string[]): Promise<any> {
  try {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    
    // Instead of regex parsing, we use generateObject for structured JSON output
    const { object } = await generateObject({
      model: AI_MODELS.vision,
      schema: z.object({
        accuracyScore: z.number(),
        claimVerificationStatus: z.enum(["verified", "discrepancy", "unclear"]),
        suggestedLegend: z.string(),
        issuesFound: z.array(z.string())
      }),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              image: imageBuffer
            },
            {
              type: 'text',
              text: `Analyze this figure and its original legend: "${legend}". Claims: ${claims.join(", ")}. Provide an accuracy score (1-100), claim verification status (verified/discrepancy/unclear), a suggested legend, and an array of issues found.`
            }
          ]
        }
      ]
    });

    return {
      modelUsed: "vision",
      legendAccuracyScore: object.accuracyScore,
      claimVerificationStatus: object.claimVerificationStatus,
      suggestedLegend: object.suggestedLegend,
      issuesFound: object.issuesFound,
      rawAnalysis: object,
    };
  } catch (error) {
    // We bubble up the error instead of swallowing it
    console.error("Error analyzing figure:", error);
    throw new Error("Failed to analyze figure. Please try again later.", { cause: error });
  }
}

export async function suggestImprovedLegend(imageUrl: string, currentLegend: string, context: string): Promise<string> {
  try {
    const { text } = await generateText({
      model: AI_MODELS.fast,
      messages: [
        {
          role: "user",
          content: `Improve this figure legend: "${currentLegend}". Context: "${context}". Return only the improved legend text.`
        }
      ]
    });

    return text.trim();
  } catch (error) {
    // Bubble up error instead of returning currentLegend silently
    console.error("Error suggesting improved legend:", error);
    throw new Error("Failed to suggest improved legend.", { cause: error });
  }
}
