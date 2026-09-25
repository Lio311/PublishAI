import { inngest } from "@/inngest/client";
import { db } from "@/services/db";
import { papers } from "@/services/db/schema";
import { eq, isNotNull, and } from "drizzle-orm";

export const syncCitations = inngest.createFunction(
  { id: "sync-citations", cron: "0 0 * * *" } as any,
  async ({ step }: { step: any }) => {
    const publishedPapers = await step.run("fetch-published-papers", async () => {
      return db
        .select()
        .from(papers)
        .where(and(eq(papers.status, "published" as any), isNotNull(papers.doi)));
    });

    for (const paper of publishedPapers) {
      await step.run(`sync-citation-${paper.id}`, async () => {
        if (!paper.doi) return;

        try {
          const response = await fetch(`https://api.semanticscholar.org/graph/v1/paper/${paper.doi}?fields=citationCount`);
          if (response.ok) {
            const data = await response.json();
            if (data.citationCount !== undefined) {
              await db
                .update(papers)
                .set({
                  citationsCount: data.citationCount,
                  lastCitationCheck: new Date(),
                })
                .where(eq(papers.id, paper.id));
            }
          } else if (response.status === 429 || response.status >= 500) {
            throw new Error(`Rate limited or server error from Semantic Scholar (Status: ${response.status})`);
          } else if (response.status === 404) {
            console.warn(`Paper not found on Semantic Scholar for DOI: ${paper.doi}`);
          } else {
            console.error(`Failed to fetch citations for paper ${paper.id} with DOI ${paper.doi}. Status: ${response.status}`);
          }
        } catch (error) {
          console.error(`Error fetching citations for paper ${paper.id}:`, error);
          throw error;
        }
      });
    }

    return { synced: publishedPapers.length };
  }
);
