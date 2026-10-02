import { NextResponse } from "next/server";
import { z } from "zod";
import { requirePaperOwner } from "@/services/api/route-auth";
import { applyRateLimit } from "@/services/rate-limit";
import { latestSandboxScript, runPreflight } from "@/services/sandbox/preflight";

export const maxDuration = 120;

const bodySchema = z.object({
  paperId: z.coerce.number().int().positive(),
  code: z.string().max(200_000).optional(),
  dependencies: z.array(z.string().max(100)).max(50).default([]),
});

/**
 * Runs the reproducibility pre-flight check synchronously so the panel can show
 * the result. Without explicit code it runs the paper's latest sandbox script.
 */
export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: { message: "Invalid request" } }, { status: 400 });
  }
  const { paperId, dependencies } = parsed.data;

  const guard = await requirePaperOwner(paperId);
  if (guard instanceof NextResponse) return guard;
  const limited = await applyRateLimit(req, "strict", guard.userId);
  if (limited) return limited;

  const code = parsed.data.code?.trim() || (await latestSandboxScript(paperId));
  if (!code) {
    return NextResponse.json(
      { success: false, error: { message: "No code to check yet. Run a data analysis in the sandbox first." } },
      { status: 400 }
    );
  }

  try {
    const result = await runPreflight(code, dependencies);
    return NextResponse.json({
      success: result.success,
      code,
      stdout: result.stdout.join(""),
      stderr: result.stderr.join("") || result.error?.traceback || "",
      error: result.error ? { message: `${result.error.name}: ${result.error.value}` } : null,
    });
  } catch (error) {
    console.error("[API preflight/trigger] Error:", error);
    return NextResponse.json(
      { success: false, error: { message: error instanceof Error ? error.message : "Pre-flight check failed" } },
      { status: 502 }
    );
  }
}
