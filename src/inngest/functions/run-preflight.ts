import { inngest } from "../client";
import { Sandbox } from '@e2b/code-interpreter';

export const runPreflightCheck = inngest.createFunction(
  { id: "run-preflight-check", event: "paper/preflight" } as any,
  
  async ({ event, step }: { event: any, step: any }) => {
    const { code, dependencies, datasets } = event.data;

    // Step 1: Provision E2B Sandbox
    const executionResult = await step.run("provision-e2b-sandbox", async () => {
      const sandbox = await Sandbox.create();
      
      try {
        // Install dependencies if provided
        // Sanitize dependencies
        if (dependencies && dependencies.length > 0) {
          const safeDeps = dependencies.filter((d: string) => /^[a-zA-Z0-9_.-]+$/.test(d));
          if (safeDeps.length > 0) {
            await sandbox.commands.run(`pip install ${safeDeps.join(" ")}`);
          }
        }
        
        // Download and write datasets if provided
        if (datasets && datasets.length > 0) {
          for (const dataset of datasets) {
            const parsedUrl = new URL(dataset.url);
            if (parsedUrl.protocol !== "https:" || parsedUrl.hostname === "localhost" || parsedUrl.hostname.startsWith("127.") || parsedUrl.hostname.startsWith("169.254.") || parsedUrl.hostname.startsWith("10.") || parsedUrl.hostname.startsWith("192.168.")) {
              throw new Error("Invalid URL");
            }
            const response = await fetch(dataset.url);
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
        await sandbox.kill();
      }
    });

    // Step 2: Handle results or trigger Auto-Fix
    if (!executionResult.success) {
      await step.sendEvent("preflight.failed", {
        name: "paper.preflight.failed",
        data: {
          error: executionResult.error,
          stderr: executionResult.stderr,
          code: code
        }
      });
    } else {
       await step.sendEvent("preflight.success", {
        name: "paper.preflight.success",
        data: {
          stdout: executionResult.stdout,
          results: executionResult.results,
        }
      });
    }

    return executionResult;
  }
);
