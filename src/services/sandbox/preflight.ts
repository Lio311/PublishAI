import { Sandbox } from "@e2b/code-interpreter";
import { desc, eq } from "drizzle-orm";
import { db } from "@/services/db";
import { sandboxRuns } from "@/services/db/schema";

export interface PreflightDataset {
  url: string;
  filename: string;
}

export interface PreflightResult {
  success: boolean;
  stdout: string[];
  stderr: string[];
  error: { name?: string; value?: string; traceback?: string } | null;
}

const SAFE_PACKAGE = /^[a-zA-Z0-9_.\-]+(\[[a-zA-Z0-9_,]+\])?([<>=!~]=?[a-zA-Z0-9_.*]+)?$/;

function assertSafeDatasetUrl(raw: string): URL {
  const url = new URL(raw);
  const host = url.hostname;
  if (
    url.protocol !== "https:" ||
    host === "localhost" ||
    host.startsWith("127.") ||
    host.startsWith("169.254.") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    throw new Error(`Invalid or forbidden dataset URL: ${raw}`);
  }
  return url;
}

/**
 * Executes supplementary research code in an isolated E2B micro-VM to verify it
 * runs from scratch. Shared by the synchronous API route and the Inngest job.
 */
export async function runPreflight(
  code: string,
  dependencies: string[] = [],
  datasets: PreflightDataset[] = []
): Promise<PreflightResult> {
  if (!process.env.E2B_API_KEY) {
    throw new Error("E2B_API_KEY is not configured");
  }

  const sandbox = await Sandbox.create();
  try {
    const safeDeps = dependencies.filter((d) => SAFE_PACKAGE.test(d));
    if (safeDeps.length > 0) {
      await sandbox.commands.run(`pip install ${safeDeps.map((d) => `'${d}'`).join(" ")}`);
    }

    for (const dataset of datasets) {
      const url = assertSafeDatasetUrl(dataset.url);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to download dataset ${dataset.filename}: HTTP ${response.status}`);
      }
      await sandbox.files.write(dataset.filename.replace(/[^\w.\-]/g, "_"), await response.arrayBuffer());
    }

    const execution = await sandbox.runCode(code);
    return {
      success: !execution.error,
      stdout: execution.logs.stdout,
      stderr: execution.logs.stderr,
      error: execution.error
        ? { name: execution.error.name, value: execution.error.value, traceback: execution.error.traceback }
        : null,
    };
  } finally {
    await sandbox.kill().catch(() => {});
  }
}

/** The latest analysis script generated for the paper in the data sandbox, if any. */
export async function latestSandboxScript(paperId: number): Promise<string | null> {
  const [run] = await db
    .select({ script: sandboxRuns.pythonScript })
    .from(sandboxRuns)
    .where(eq(sandboxRuns.paperId, paperId))
    .orderBy(desc(sandboxRuns.createdAt))
    .limit(1);
  return run?.script ?? null;
}
