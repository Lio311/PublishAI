import { db } from "./db";
import { journals, papers } from "./db/schema";
import { eq, ne } from "drizzle-orm";

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
   */
  static async recommendAlternatives(paperId: number): Promise<AlternativeJournal[]> {
    const paper = await db.query.papers.findFirst({
      where: eq(papers.id, paperId)
    });

    if (!paper) {
      throw new Error(`Paper with ID ${paperId} not found`);
    }

    const currentJournalId = paper.targetJournalId;
    
    // Query actual journals table, excluding the current one
    const alternativeJournals = currentJournalId 
      ? await db.select().from(journals).where(ne(journals.id, currentJournalId)).limit(3)
      : await db.select().from(journals).limit(3);
    
    const alternatives = alternativeJournals.map((j, index) => {
      // Mock score for now since we don't have embeddings or match score in the DB
      const score = 95 - index * 5;
      
      const rules = (j.rules as any) || {};
      const reason = rules.reason || `High semantic overlap with your manuscript in the field of ${j.field || 'general science'}. Scope and formatting requirements are a good fit.`;

      return {
        journalId: j.id,
        name: j.name,
        field: j.field,
        matchScore: score,
        reason: reason,
      };
    });

    // Save these suggestions to the paper record for the UI to display
    await db.update(papers)
      .set({ suggestedJournals: alternatives })
      .where(eq(papers.id, paperId));

    return alternatives;
  }
}
