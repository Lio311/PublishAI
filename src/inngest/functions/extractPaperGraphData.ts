import { inngest } from "../client";
import { paperUploadedEvent } from "../events";
import { extractScientificGraphData } from "../../services/graph/entityExtractor";
import { buildGraphFromRelationships } from "../../services/graph/graphBuilder";
import { db } from "@/services/db";
import { papers } from "@/services/db/schema";
import { eq } from "drizzle-orm";

export const extractPaperGraphData = inngest.createFunction(
  {
    id: "extract-paper-graph-data",
    triggers: [paperUploadedEvent],
    concurrency: {
      key: "event.data.paperId",
      limit: 1,
    },
    rateLimit: {
      limit: 20,
      period: "1m",
    },
    idempotency: "event.data.paperId",
    retries: 2,
  },
  async ({ event, step }) => {
    const { paperId } = event.data;
    let text = event.data.textContent;

    if (!text) {
      text = await step.run("fetch-fallback-text", async () => {
        const [paper] = await db
          .select({ title: papers.title })
          .from(papers)
          .where(eq(papers.id, paperId));
        return paper?.title || "";
      });
    }

    if (!text) {
      return { success: false, reason: "No text content available for graph extraction" };
    }

    const graphData = await step.run("extract-graph-data", async () => {
      return await extractScientificGraphData(text!);
    });

    await step.run("build-graph", async () => {
      await buildGraphFromRelationships(paperId, graphData);
    });

    return { success: true, entities: graphData.entities.length };
  }
);
