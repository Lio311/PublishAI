import { inngest } from "../client";
import { paperUploadedEvent } from "../events";
import { extractScientificGraphData } from "../../services/graph/entityExtractor";
import { buildGraphFromRelationships } from "../../services/graph/graphBuilder";
import { loadManuscriptText } from "@/services/documents/manuscriptStore";

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
    const text =
      event.data.textContent ||
      (await step.run("load-manuscript-text", () => loadManuscriptText(paperId)));

    if (!text) {
      return { success: false, reason: "No text content available for graph extraction" };
    }

    const graphData = await step.run("extract-graph-data", async () => {
      return await extractScientificGraphData(text);
    });

    await step.run("build-graph", async () => {
      await buildGraphFromRelationships(paperId, graphData);
    });

    return { success: true, entities: graphData.entities.length };
  }
);
