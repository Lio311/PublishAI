import { db } from "@/services/db";
import { papers, documents } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { SubmissionPayload } from "./connection-types";
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

const MetadataSchema = z.object({
  title: z.string(),
  abstract: z.string().describe("The full abstract text"),
  keywords: z.array(z.string()),
  authors: z.array(z.object({
    name: z.string(),
    email: z.string().default(""),
    affiliation: z.string().default("")
  })),
  articleType: z.string().default("Research Article"),
});

export class MetadataExtractor {
  static async extractFromPaper(paperId: number): Promise<Partial<SubmissionPayload>> {
    const paper = await db.query.papers.findFirst({
      where: eq(papers.id, paperId),
    });

    if (!paper) {
      throw new Error(`Paper ${paperId} not found`);
    }

    const doc = await db.query.documents.findFirst({
      where: eq(documents.paperId, paperId)
    });
    
    let extractedData = null;
    
    if (doc && doc.content) {
      // Send the first 6000 characters to capture Title, Authors, Affiliations, and Abstract
      const headerText = doc.content.substring(0, 6000);
      
      try {
        const { object } = await generateObject({
          model: anthropic("claude-3-7-sonnet-20250219"), // Using Claude 3.7 to match the flowchart architecture
          schema: MetadataSchema,
          prompt: `Extract structured metadata from the following academic manuscript header. Pay special attention to authors, their emails, and institutional affiliations.\n\n${headerText}`
        });
        extractedData = object;
      } catch (error) {
        console.error("AI Extraction failed", error);
      }
    }

    return {
      title: extractedData?.title || paper.title || "Untitled Paper",
      content: doc?.content || "Content missing",
      abstract: extractedData?.abstract || "Abstract not found", 
      keywords: extractedData?.keywords || ["Research"],
      authors: extractedData?.authors?.map(a => ({
        name: a.name,
        email: a.email || "",
        affiliation: a.affiliation || ""
      })) || [
        { name: "Current User", email: "user@example.com", affiliation: "University" }
      ],
      articleType: extractedData?.articleType || "Research Article",
    };
  }
}
