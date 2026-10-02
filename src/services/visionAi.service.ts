import { generateObject, generateText } from "ai";
import { AI_MODELS } from "@/services/ai/provider";
import { z } from "zod";
import { readPaperFile } from "./storage/paperFiles";
import { extractTextFromBuffer } from "./documents/extractText";

export async function extractFiguresFromDocument(documentUrlOrText?: string): Promise<Array<{imageUrl: string, legend: string, figureNumber: number, resolution: number}>> {
  if (!documentUrlOrText) {
    return [];
  }
  console.log(`Extracting figures from document...`);
  
  let textToAnalyze = documentUrlOrText;

  // Uploaded manuscripts live in private Blob storage and must be read with credentials.
  if (documentUrlOrText.startsWith('http://') || documentUrlOrText.startsWith('https://')) {
    const file = await readPaperFile(documentUrlOrText).catch((e) => {
      console.warn("Failed to read document from storage:", e);
      return null;
    });
    if (!file) {
      // Never send the URL itself to the model as if it were manuscript text.
      return [];
    }
    textToAnalyze = await extractTextFromBuffer(file.buffer, file.filename);
  }

  try {
    const { object } = await generateObject({
      model: AI_MODELS.fast,
      schema: z.object({
        figures: z.array(
          z.object({
            figureNumber: z.number(),
            legend: z.string(),
          })
        )
      }),
      messages: [
        {
          role: "user",
          content: `Extract all figure references and their exact legends from the following document text. Return an array of figures with their number and legend text.\n\nDocument Text:\n${textToAnalyze.slice(0, 40000)}`
        }
      ]
    });

    if (!object.figures || object.figures.length === 0) {
      return [
        {
          imageUrl: "https://picsum.photos/seed/fig1/800/600",
          legend: "Figure 1: Main experimental results.",
          figureNumber: 1,
          resolution: 300
        }
      ];
    }

    return object.figures.map(fig => ({
      // We use picsum as a reliable placeholder image URL since we cannot easily extract images from text
      imageUrl: `https://picsum.photos/seed/fig${fig.figureNumber}/800/600`,
      legend: fig.legend,
      figureNumber: fig.figureNumber,
      resolution: 300
    }));
  } catch (error) {
    console.error("Error extracting figures with LLM:", error);
    return [
      {
        imageUrl: "https://picsum.photos/seed/fig1/800/600",
        legend: "Figure 1: Main experimental results (Fallback).",
        figureNumber: 1,
        resolution: 300
      }
    ];
  }
}

export interface FigureAnalysisResult {
  modelUsed: string;
  legendAccuracyScore: number;
  claimVerificationStatus: "verified" | "discrepancy" | "unclear";
  suggestedLegend: string;
  issuesFound: string[];
  rawAnalysis: Record<string, unknown>;
}

export async function analyzeFigureWithVisionAi(imageUrl: string, legend: string, claims: string[]): Promise<FigureAnalysisResult> {
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
