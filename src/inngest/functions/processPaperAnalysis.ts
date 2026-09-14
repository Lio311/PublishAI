import { inngest } from "../client";
import { runPythonInSandbox } from "../../services/e2bService";
import { generateAnalysisScript } from "../../services/dataAnalysisService";
import { db } from "../../db";
import { dataFiles, sandboxRuns, generatedCharts, papers } from "../../db/schema";
import { eq } from "drizzle-orm";

export const processPaperAnalysis = inngest.createFunction(
  { id: "process-paper-analysis", event: "paper.uploaded" } as any,
  async ({ event, step }: { event: any, step: any }) => {
    const paperId = event.data.paperId;

    // 1. Fetch uploaded data files
    const files = await step.run("fetch-data-files", async () => {
      return await db.select().from(dataFiles).where(eq(dataFiles.paperId, paperId));
    });

    if (files.length === 0) return; // No data files to process

    const paperContent = await step.run("fetch-paper-content", async () => {
      const [paper] = await db.select({ title: papers.title }).from(papers).where(eq(papers.id, paperId));
      return paper?.title || "";
    });

    if (!paperContent) return;

    // 2. Generate Python Script
    const script = await step.run("generate-python-script", async () => {
      // Create basic schemas from the file names and assumed structure
      const fileSchemas = files.map((f: any) => `${f.filename}: Unknown columns (load to see)`);
      return await generateAnalysisScript(paperContent, fileSchemas);
    });

    // 3. Create Sandbox Run record
    const runId = await step.run("create-sandbox-run", async () => {
      const [run] = await db.insert(sandboxRuns).values({
        paperId,
        status: "running",
        pythonScript: script,
      }).returning();
      return run.id;
    });

    try {
      // 4. Run Sandbox Execution
      const executionResult = await step.run("execute-sandbox", async () => {
        const fileUrls = files.map((f: any) => ({
          filename: f.filename,
          url: f.fileUrl
        }));
        return await runPythonInSandbox(script, fileUrls);
      });

      // 5. Save Results & Charts
      await step.run("save-results", async () => {
        await db.update(sandboxRuns)
          .set({
            status: "completed",
            executionLogs: executionResult.logs,
            analysisResults: executionResult.results,
            completedAt: new Date()
          })
          .where(eq(sandboxRuns.id, runId));

        for (const chartUrl of executionResult.chartUrls) {
          await db.insert(generatedCharts).values({
            sandboxRunId: runId,
            paperId,
            chartUrl,
            description: "Auto-generated corrected chart"
          });
        }
      });
    } catch (error: any) {
      // Handle failure
      await step.run("mark-failed", async () => {
        await db.update(sandboxRuns)
          .set({
            status: "failed",
            executionLogs: error.message,
            completedAt: new Date()
          })
          .where(eq(sandboxRuns.id, runId));
      });
    }
  }
);
