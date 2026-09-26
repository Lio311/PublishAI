import { inngest } from "../client";
import { paperPreflightEvent } from "../events";
import { Sandbox } from "@e2b/code-interpreter";

export const runPreflightCheck = inngest.createFunction(
  {
    id: "run-preflight-check",
    triggers: [paperPreflightEvent],
    concurrency: {
      limit: 5, // Throttle E2B container concurrency
    },
    retries: 2,
  },
  async ({ event, step }) => {
    const { code, dependencies, datasets } = event.data;

    // Step 1: Provision E2B Sandbox and execute preflight code
    const executionResult = await step.run("provision-e2b-sandbox", async () => {
      let sandbox: Sandbox | null = null;
      try {
        sandbox = await Sandbox.create();
      } catch (err: any) {
        throw new Error(`Failed to provision E2B sandbox: ${err?.message || "Unknown error"}`);
      }

      try {
        // Install dependencies if provided
        if (dependencies && dependencies.length > 0) {
          const safeDeps = dependencies.filter((d: string) =>
            /^[a-zA-Z0-9_.-]+$/.test(d)
          );
          if (safeDeps.length > 0) {
            await sandbox.commands.run(`pip install ${safeDeps.join(" ")}`);
          }
        }

        // Download and write datasets if provided
        if (datasets && datasets.length > 0) {
          for (const dataset of datasets) {
            const parsedUrl = new URL(dataset.url);
            if (
              parsedUrl.protocol !== "https:" ||
              parsedUrl.hostname === "localhost" ||
              parsedUrl.hostname.startsWith("127.") ||
              parsedUrl.hostname.startsWith("169.254.") ||
              parsedUrl.hostname.startsWith("10.") ||
              parsedUrl.hostname.startsWith("192.168.")
            ) {
              throw new Error(`Invalid or forbidden dataset URL: ${dataset.url}`);
            }

            const response = await fetch(dataset.url);
            if (!response.ok) {
              throw new Error(
                `Failed to download dataset from ${dataset.url}: HTTP ${response.status} ${response.statusText}`
              );
            }

            const arrayBuffer = await response.arrayBuffer();
            await sandbox.files.write(dataset.filename, arrayBuffer);
          }
        }

        // Execute the python code
        const execution = await sandbox.runCode(code);
        return {
          success: !execution.error,
          stdout: execution.logs.stdout,
          stderr: execution.logs.stderr,
          error: execution.error,
          results: execution.results,
        };
      } finally {
        if (sandbox) {
          await sandbox.kill();
        }
      }
    });

    // Step 2: Handle results or trigger Auto-Fix events
    if (!executionResult.success) {
      await step.sendEvent("preflight-failed", {
        name: "paper.preflight.failed",
        data: {
          error: executionResult.error,
          stderr: executionResult.stderr,
          code,
        },
      });
    } else {
      await step.sendEvent("preflight-success", {
        name: "paper.preflight.success",
        data: {
          stdout: executionResult.stdout,
          results: executionResult.results,
        },
      });
    }

    return executionResult;
  }
);
