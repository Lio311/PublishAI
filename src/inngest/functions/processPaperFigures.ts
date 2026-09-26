import { inngest } from "../client";
import { paperUploadedEvent, qaFiguresAnalyzedEvent } from "../events";
import {
  extractFiguresFromDocument,
  analyzeFigureWithVisionAi,
} from "../../services/visionAi.service";
import { db } from "../../services/db";
import { figures, figureAnalyses, papers, paperVersions } from "../../services/db/schema";
import { eq, desc } from "drizzle-orm";

export const processPaperFigures = inngest.createFunction(
  {
    id: "process-paper-figures",
    name: "Process Paper Figures & Vision AI",
    triggers: [paperUploadedEvent],
    concurrency: {
      key: "event.data.paperId",
      limit: 1,
    },
    idempotency: "event.data.paperId",
    retries: 2,
  },
  async ({ event, step }) => {
    const { paperId } = event.data;
    let { paperVersionId, documentUrl } = event.data;

    // Resolve paper, documentUrl, and paperVersionId if not directly provided in event
    const paperInfo = await step.run("resolve-paper-context", async () => {
      const [paper] = await db
        .select()
        .from(papers)
        .where(eq(papers.id, paperId));

      if (!paper) {
        return null;
      }

      let versionId = paperVersionId;
      if (!versionId) {
        const latestVersion = await db.query.paperVersions.findFirst({
          where: eq(paperVersions.paperId, paperId),
          orderBy: [desc(paperVersions.versionNumber)],
        });

        if (latestVersion) {
          versionId = latestVersion.id;
        } else {
          // Create initial paper version record so figures can link to it
          const [newVersion] = await db
            .insert(paperVersions)
            .values({
              paperId,
              versionNumber: 1,
              fileUrl: paper.originalFileUrl,
              format: paper.originalFormat,
            })
            .returning();
          versionId = newVersion.id;
        }
      }

      const resolvedUrl =
        documentUrl || paper.originalFileUrl || event.data.textContent || "";

      return {
        paperVersionId: versionId,
        documentUrl: resolvedUrl,
      };
    });

    if (!paperInfo || !paperInfo.paperVersionId || !paperInfo.documentUrl) {
      return {
        success: false,
        reason: "No document URL or content available for figure extraction",
      };
    }

    const resolvedVersionId = paperInfo.paperVersionId;
    const resolvedUrl = paperInfo.documentUrl;

    const extractedFigures = await step.run("extract-figures", async () => {
      return await extractFiguresFromDocument(resolvedUrl);
    });

    if (!extractedFigures || extractedFigures.length === 0) {
      return { success: true, processedFigures: 0 };
    }

    const savedFigures = await step.run("save-figures-to-db", async () => {
      // Clear previous figures for this version to prevent duplicates on retry
      await db
        .delete(figures)
        .where(eq(figures.paperVersionId, resolvedVersionId));

      const inserts = extractedFigures.map((fig) => ({
        paperId,
        paperVersionId: resolvedVersionId,
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
        try {
          const analysis = await analyzeFigureWithVisionAi(
            figure.imageUrl,
            figure.originalLegend || "",
            []
          );

          // Clear any existing analysis for this figure to ensure idempotency on retry
          await db
            .delete(figureAnalyses)
            .where(eq(figureAnalyses.figureId, figure.id));

          await db.insert(figureAnalyses).values({
            figureId: figure.id,
            modelUsed: analysis.modelUsed,
            legendAccuracyScore: analysis.legendAccuracyScore,
            claimVerificationStatus: analysis.claimVerificationStatus,
            suggestedLegend: analysis.suggestedLegend,
            issuesFound: analysis.issuesFound,
            rawAnalysis: analysis.rawAnalysis,
          });
        } catch (error) {
          console.error(`Vision AI analysis failed for figure ${figure.id}:`, error);
          throw error;
        }
      });
    }

    await step.sendEvent("trigger-qa-figures-analyzed", {
      name: "qa.figures.analyzed",
      data: { paperId, paperVersionId: resolvedVersionId },
    });

    return { success: true, processedFigures: savedFigures.length };
  }
);
