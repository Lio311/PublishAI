import { db } from "@/services/db";
import { papers } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { SubmissionPayload } from "./connection-types";

export class MetadataExtractor {
  static async extractFromPaper(paperId: number): Promise<Partial<SubmissionPayload>> {
    const paper = await db.query.papers.findFirst({
      where: eq(papers.id, paperId),
    });

    if (!paper) {
      throw new Error(`Paper ${paperId} not found`);
    }

    return {
      title: paper.title || "Untitled Paper",
      content: "Content will be extracted from the latest version file...",
      abstract: "Abstract extracted from paper...", 
      keywords: ["Research", "PublishAI"],
      authors: [
        { name: "Current User", email: "user@example.com", affiliation: "University" }
      ],
      articleType: "Research Article",
    };
  }
}
