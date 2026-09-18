import { inngest } from "../client";
import { extractFiguresFromDocument, analyzeFigureWithVisionAi } from "../../services/visionAi.service";
import { db } from "../../services/db";
import { figures, figureAnalyses } from "../../services/db/schema";

export const processPaperFigures = inngest.createFunction(
  { id: "process-paper-figures", name: "Process Paper Figures & Vision AI", event: "paper.uploaded" } as any,
  async ({ event, step }: { event: any, step: any }) => {
    const { paperId, paperVersionId, documentUrl } = event.data;

    const extractedFigures = await step.run("extract-figures", async () => {
      return await extractFiguresFromDocument(documentUrl);
    });

    const savedFigures = await step.run("save-figures-to-db", async () => {
      const inserts = extractedFigures.map((fig: any) => ({
        paperId,
        paperVersionId,
        figureNumber: fig.figureNumber,
        imageUrl: fig.imageUrl,
        originalLegend: fig.legend,
        resolution: fig.resolution,
        qualityScore: 100, // default
      }));

      return await db.insert(figures).values(inserts).returning();
    });

    for (const figure of savedFigures) {
      await step.run(`analyze-figure-${figure.id}`, async () => {
        const analysis = await analyzeFigureWithVisionAi(figure.imageUrl, figure.originalLegend || "", []);
        
        await db.insert(figureAnalyses).values({
          figureId: figure.id,
          modelUsed: analysis.modelUsed,
          legendAccuracyScore: analysis.legendAccuracyScore,
          claimVerificationStatus: analysis.claimVerificationStatus,
          suggestedLegend: analysis.suggestedLegend,
          issuesFound: analysis.issuesFound,
          rawAnalysis: analysis.rawAnalysis,
        });
      });
    }

    await step.sendEvent("qa-agent.trigger", {
      name: "qa.figures.analyzed",
      data: { paperId, paperVersionId }
    });
    
    return { success: true, processedFigures: savedFigures.length };
  }
);
