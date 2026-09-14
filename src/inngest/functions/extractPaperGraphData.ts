import { inngest } from "../client";
import { extractScientificGraphData } from "../../services/graph/entityExtractor";
import { buildGraphFromRelationships } from "../../services/graph/graphBuilder";

export const extractPaperGraphData = inngest.createFunction(
  { id: "extract-paper-graph-data", event: "paper/uploaded" } as any,
  async ({ event, step }: { event: any, step: any }) => {
    const text = await step.run("fetch-paper-text", async () => {
      // In a real app we fetch the paper text, using placeholder for now
      return "Dummy paper text. p53 gene treats cancer. Aspirin affects headaches.";
    });
    
    const graphData = await step.run("extract-graph-data", async () => {
      return await extractScientificGraphData(text);
    });

    await step.run("build-graph", async () => {
      // Ensure event.data.paperId is provided in actual event payload
      await buildGraphFromRelationships(event.data.paperId || 1, graphData);
    });
    
    return { success: true, entities: graphData.entities.length };
  }
);
