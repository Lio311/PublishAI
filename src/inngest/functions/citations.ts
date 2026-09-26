import { inngest } from "@/inngest/client";
import { cron } from "inngest";
import { db } from "@/services/db";
import { papers } from "@/services/db/schema";
import { eq, isNotNull, and } from "drizzle-orm";

export const syncCitations = inngest.createFunction(
  {
    id: "sync-citations",
    triggers: [cron("0 0 * * *")], // Daily at midnight
    concurrency: {
      limit: 1, // Only 1 sync run at a time
    },
  },
  async ({ step }) => {
    const publishedPapers = await step.run("fetch-published-papers", async () => {
      return db
        .select()
        .from(papers)
        .where(
          and(
            eq(papers.status, "completed"),
            isNotNull(papers.doi)
          )
        );
    });

    let updatedCount = 0;

    for (const paper of publishedPapers) {
      if (!paper.doi) continue;

      await step.run(`sync-citation-${paper.id}`, async () => {
        try {
          const headers: Record<string, string> = {
            "User-Agent": "PublishAI/1.0 (academic-citation-sync)",
          };
          if (process.env.SEMANTIC_SCHOLAR_API_KEY) {
            headers["x-api-key"] = process.env.SEMANTIC_SCHOLAR_API_KEY;
          }

          const response = await fetch(
            `https://api.semanticscholar.org/graph/v1/paper/${encodeURIComponent(
              paper.doi!
            )}?fields=citationCount`,
            { headers }
          );

          if (response.ok) {
            const data = await response.json();
            if (typeof data.citationCount === "number") {
              await db
                .update(papers)
                .set({
                  citationsCount: data.citationCount,
                  lastCitationCheck: new Date(),
                })
                .where(eq(papers.id, paper.id));
              updatedCount++;
            }
          } else if (response.status === 429 || response.status >= 500) {
            // Throw to allow Inngest step retry on rate limits or server errors
            throw new Error(
              `Transient error from Semantic Scholar (Status: ${response.status})`
            );
          } else if (response.status === 404) {
            console.warn(`Paper DOI not found on Semantic Scholar: ${paper.doi}`);
            await db
              .update(papers)
              .set({ lastCitationCheck: new Date() })
              .where(eq(papers.id, paper.id));
          } else {
            console.warn(
              `Non-retryable response for paper ${paper.id} (DOI: ${paper.doi}): ${response.status}`
            );
          }
        } catch (error) {
          console.error(`Error fetching citations for paper ${paper.id}:`, error);
          throw error;
        }
      });
    }

    return { total: publishedPapers.length, updated: updatedCount };
  }
);
