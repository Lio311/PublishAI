import { inngest } from "../client";
import { extractScientificGraphData } from "../../services/graph/entityExtractor";
import { buildGraphFromRelationships } from "../../services/graph/graphBuilder";

export const extractPaperGraphData = inngest.createFunction(
  { id: "extract-paper-graph-data", event: "paper/uploaded" } as any,
  async ({ event, step }: { event: any, step: any }) => {
    const text = event.data.textContent;
    
    if (!text) {
      throw new Error("No textContent provided in paper/uploaded event");
    }

    const graphData = await step.run("extract-graph-data", async () => {
      return await extractScientificGraphData(text);
    });

    await step.run("build-graph", async () => {
      await buildGraphFromRelationships(event.data.paperId, graphData);
    });
    
    return { success: true, entities: graphData.entities.length };
  }
);
