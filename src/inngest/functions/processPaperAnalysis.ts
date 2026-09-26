import { inngest } from "../client";
import { datasetUploadedEvent } from "../events";
import { runPythonInSandbox } from "../../services/e2bService";
import { generateAnalysisScript } from "../../services/dataAnalysisService";
import { db } from "../../services/db";
import { dataFiles, sandboxRuns, generatedCharts, papers } from "../../services/db/schema";
import { eq } from "drizzle-orm";

export const processPaperAnalysis = inngest.createFunction(
  {
    id: "process-paper-analysis",
    triggers: [datasetUploadedEvent],
    concurrency: {
      limit: 5, // Protect E2B sandbox quota
    },
    idempotency: "event.data.paperId",
    retries: 2,
    onFailure: async ({ event, step, error }) => {
      const paperId =
        (event.data as any)?.event?.data?.paperId ??
        (event.data as any)?.paperId;
      if (paperId) {
        await step.run("mark-sandbox-failed", async () => {
          await db
            .update(sandboxRuns)
            .set({
              status: "failed",
              executionLogs: error?.message || "Execution failed",
              completedAt: new Date(),
            })
            .where(eq(sandboxRuns.paperId, paperId));
        });
      }
    },
  },
  async ({ event, step }) => {
    const { paperId } = event.data;

    // 1. Fetch uploaded data files
    const files = await step.run("fetch-data-files", async () => {
      return await db
        .select()
        .from(dataFiles)
        .where(eq(dataFiles.paperId, paperId));
    });

    if (files.length === 0) {
      return { success: false, reason: "No data files found for paper" };
    }

    const paperContent = await step.run("fetch-paper-content", async () => {
      const [paper] = await db
        .select({ title: papers.title })
        .from(papers)
        .where(eq(papers.id, paperId));
      return paper?.title || "";
    });

    if (!paperContent) {
      return { success: false, reason: "Paper content not found" };
    }

    // 2. Generate Python Script with LLM
    const script = await step.run("generate-python-script", async () => {
      const fileSchemas = files.map(
        (f) => `${f.filename}: Unknown columns (load to inspect)`
      );
      return await generateAnalysisScript(paperContent, fileSchemas);
    });

    // 3. Create or reuse Sandbox Run record
    const runId = await step.run("create-sandbox-run", async () => {
      const [run] = await db
        .insert(sandboxRuns)
        .values({
          paperId,
          status: "running",
          pythonScript: script,
        })
        .returning();
      return run.id;
    });

    // 4. Run Sandbox Execution in E2B
    const executionResult = await step.run("execute-sandbox", async () => {
      const fileUrls = files.map((f) => ({
        filename: f.filename,
        url: f.fileUrl,
      }));
      return await runPythonInSandbox(script, fileUrls);
    });

    // 5. Save Results & Charts idempotently
    await step.run("save-results", async () => {
      await db
        .update(sandboxRuns)
        .set({
          status: "completed",
          executionLogs: executionResult.logs,
          analysisResults: executionResult.results,
          completedAt: new Date(),
        })
        .where(eq(sandboxRuns.id, runId));

      // Clear any prior charts for this run to prevent duplicate charts on retry
      await db
        .delete(generatedCharts)
        .where(eq(generatedCharts.sandboxRunId, runId));

      if (executionResult.chartUrls && executionResult.chartUrls.length > 0) {
        for (const chartUrl of executionResult.chartUrls) {
          await db.insert(generatedCharts).values({
            sandboxRunId: runId,
            paperId,
            chartUrl,
            description: "Auto-generated corrected chart",
          });
        }
      }
    });

    return {
      success: true,
      runId,
      chartsCount: executionResult.chartUrls?.length || 0,
    };
  }
);
