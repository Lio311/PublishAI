import { inngest } from "../client";
import { paperRejectedEvent } from "../events";
import { db } from "@/services/db";
import { papers, userSettings } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { loadManuscriptText } from "@/services/documents/manuscriptStore";
import { matchJournals } from "@/services/journal-matcher/pipeline";
import type { JournalMatchResult } from "@/services/journal-matcher/types";

/** Shape stored in papers.suggestedJournals and rendered by the rejection panel. */
export interface SuggestedJournal {
  id: string;
  journalId: number | null;
  name: string;
  matchScore: number;
  rationale: string;
  impactFactor: number | null;
  strategy: string;
  homepageUrl: string | null;
}

export function toSuggestedJournals(result: JournalMatchResult): SuggestedJournal[] {
  return result.recommendations.map((rec) => ({
    id: rec.candidate.id,
    journalId: rec.candidate.internalJournalId ?? null,
    name: rec.candidate.metrics.name,
    matchScore: rec.score,
    rationale: rec.rationale,
    impactFactor: rec.candidate.metrics.citedness2yr,
    strategy: rec.strategy,
    homepageUrl: rec.candidate.metrics.homepageUrl,
  }));
}

/**
 * After a rejection, recommends three alternative journals (excluding the one
 * that rejected the paper) with the journal-matching agents and stores them on
 * the paper. Re-submission stays an explicit author decision: submitting a
 * manuscript is not something to do without the author's approval.
 */
export const processPaperRejected = inngest.createFunction(
  {
    id: "process-paper-rejected",
    triggers: [paperRejectedEvent],
    concurrency: {
      key: "event.data.paperId",
      limit: 1,
    },
    retries: 2,
  },
  async ({ event, step }) => {
    const { paperId, currentJournalName } = event.data;

    const context = await step.run("load-paper-context", async () => {
      const [paper] = await db
        .select({ userId: papers.userId, language: userSettings.language })
        .from(papers)
        .leftJoin(userSettings, eq(userSettings.userId, papers.userId))
        .where(eq(papers.id, paperId));
      const text = paper ? await loadManuscriptText(paperId) : null;
      return paper && text ? { text, locale: paper.language === "en" ? "en" : "he" } : null;
    });

    if (!context) {
      return { success: false, reason: "Paper or manuscript text not found" };
    }

    const suggestions = await step.run("recommend-alternative-journals", async () => {
      const result = await matchJournals(
        context.text,
        { priority: "balanced", openAccessOnly: false, excludeJournalNames: currentJournalName ? [currentJournalName] : [] },
        context.locale
      );
      return toSuggestedJournals(result);
    });

    await step.run("save-suggestions", async () => {
      await db.update(papers).set({ suggestedJournals: suggestions, updatedAt: new Date() }).where(eq(papers.id, paperId));
    });

    return { success: true, suggestions: suggestions.map((s) => s.name) };
  }
);
