import { db } from "@/db";
import { papers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SubmissionPayload } from "./types";

export class MetadataExtractor {
  static async extractFromPaper(paperId: number): Promise<Partial<SubmissionPayload>> {
    const paper = await db.query.papers.findFirst({
      where: eq(papers.id, paperId),
    });

    if (!paper) {
      throw new Error(`Paper ${paperId} not found`);
    }

    // Attempt to extract title from content if no specific field
    let title = paper.title;
    if (!title && paper.content) {
      const firstLine = paper.content.split("\n").find(l => l.trim().startsWith("# "));
      if (firstLine) {
        title = firstLine.replace("# ", "").trim();
      }
    }

    return {
      title: title || "Untitled Paper",
      content: paper.content || "",
      abstract: "Abstract extracted from paper content...", // In reality, use LLM or specific regex
      keywords: ["Research", "PublishAI"], // Example
      authors: [
        { name: "Current User", email: "user@example.com", affiliation: "University" }
      ],
      articleType: "Research Article",
    };
  }
}
