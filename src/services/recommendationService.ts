import { db } from "./db";
import { journals, papers } from "./db/schema";
import { eq } from "drizzle-orm";
import { loadManuscriptText } from "./documents/manuscriptStore";
import { matchJournals } from "./journal-matcher/pipeline";
import { toSuggestedJournals, type SuggestedJournal } from "@/inngest/functions/cascade";

export type AlternativeJournal = SuggestedJournal;

export class RecommendationService {
  /**
   * Recommends alternative journals for a paper using the journal-matching agents
   * (excluding its current target journal) and stores them on the paper.
   */
  static async recommendAlternatives(paperId: number, locale = "en"): Promise<AlternativeJournal[]> {
    const paper = await db.query.papers.findFirst({
      where: eq(papers.id, paperId)
    });

    if (!paper) {
      throw new Error(`Paper with ID ${paperId} not found`);
    }

    const text = await loadManuscriptText(paperId);
    if (!text) {
      throw new Error(`Paper ${paperId} has no manuscript text to analyze`);
    }

    const currentJournal = paper.targetJournalId
      ? await db.query.journals.findFirst({ where: eq(journals.id, paper.targetJournalId) })
      : undefined;

    const result = await matchJournals(
      text,
      { priority: "balanced", openAccessOnly: false, excludeJournalNames: currentJournal ? [currentJournal.name] : [] },
      locale
    );
    const alternatives = toSuggestedJournals(result);

    await db.update(papers)
      .set({ suggestedJournals: alternatives })
      .where(eq(papers.id, paperId));

    return alternatives;
  }
}
