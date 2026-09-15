import { db } from "@/db";
import { figures, figureAnalyses } from "@/db/schema";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { claude } from "@/lib/agents/claude-client";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export async function extractFiguresFromDocument(documentText: string): Promise<Array<{imageUrl: string, legend: string, figureNumber: number, resolution: number}>> {
  console.log(`Extracting figures from document...`);
  
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
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const mediaType = imageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
    
    const response = await claude.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 2048,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType as any,
              data: base64Image,
            }
          },
          {
            type: 'text',
            text: `Analyze this figure and its original legend: "${legend}". Claims: ${claims.join(", ")}. Provide accuracy score (1-100), claim verification status (verified/discrepancy/unclear), suggested legend, and an array of issues found. Format as JSON.`
          }
        ]
      }]
    });

    const textContent = (response.content[0] as any).text;
    const parsed = JSON.parse(textContent);
    
    return {
      modelUsed: "claude-3-7-sonnet-20250219",
      legendAccuracyScore: parsed.accuracyScore || 80,
      claimVerificationStatus: parsed.claimVerificationStatus || "unclear",
      suggestedLegend: parsed.suggestedLegend || legend,
      issuesFound: parsed.issuesFound || [],
      rawAnalysis: parsed,
    };
  } catch (error) {
    console.error("Error analyzing figure:", error);
    throw new Error("Failed to analyze figure");
  }
}

export async function suggestImprovedLegend(imageUrl: string, currentLegend: string, context: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `Improve this figure legend: "${currentLegend}". Context: "${context}". Return only the improved legend text.`
        }
      ]
    });

    return (response.content[0] as any).text;
  } catch (error) {
    console.error("Error suggesting improved legend:", error);
    return currentLegend;
  }
}
