import { inngest } from "../client";
import { paperPreflightEvent } from "../events";
import { runPreflight } from "@/services/sandbox/preflight";

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

    // Step 1: Provision an E2B sandbox and execute the code
    const executionResult = await step.run("provision-e2b-sandbox", () =>
      runPreflight(code, dependencies ?? [], datasets ?? [])
    );

    // Step 2: Handle results or trigger Auto-Fix events
    if (!executionResult.success) {
      await step.sendEvent("preflight-failed", {
        name: "paper.preflight.failed",
        data: {
          error: executionResult.error,
          stderr: executionResult.stderr.join(""),
          code,
        },
      });
    } else {
      await step.sendEvent("preflight-success", {
        name: "paper.preflight.success",
        data: {
          stdout: executionResult.stdout.join(""),
        },
      });
    }

    return executionResult;
  }
);
