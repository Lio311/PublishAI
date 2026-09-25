import { db } from "./db";
import { journals, papers } from "./db/schema";
import { eq } from "drizzle-orm";

export interface AlternativeJournal {
  journalId: number;
  name: string;
  field: string | null;
  matchScore: number;
  reason: string;
}

export class RecommendationService {
  /**
   * Recommends alternative journals for a rejected paper.
   * In a real system, this would use semantic search, embeddings, and historical acceptance rates.
   */
  static async recommendAlternatives(paperId: number): Promise<AlternativeJournal[]> {
    const paper = await db.query.papers.findFirst({
      where: eq(papers.id, paperId)
    });

    if (!paper) {
      throw new Error(`Paper with ID ${paperId} not found`);
    }

    const currentJournalId = paper.targetJournalId;
    
    // For mocking purposes, we just fetch a few journals that aren't the current one.
    const allJournals = await db.select().from(journals);
    
    const alternatives = allJournals
      .filter(j => j.id !== currentJournalId)
      .slice(0, 3)
      .map((j, index) => {
        // Mock score and reason
        const score = 95 - index * 5;
        return {
          journalId: j.id,
          name: j.name,
          field: j.field,
          matchScore: score,
          reason: `High semantic overlap with your manuscript in the field of ${j.field || 'general science'}. Scope and formatting requirements are a good fit.`,
        };
      });

    // Save these suggestions to the paper record for the UI to display
    await db.update(papers)
      .set({ suggestedJournals: alternatives })
      .where(eq(papers.id, paperId));

    return alternatives;
  }
}
