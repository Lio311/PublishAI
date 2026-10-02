import { NextRequest, NextResponse } from "next/server";
import { fixCodeAgent } from "@/services/agents/fix-code-agent";
import { requireUser } from "@/services/api/route-auth";
import { applyRateLimit } from "@/services/rate-limit";

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (guard instanceof NextResponse) return guard;
  const limited = await applyRateLimit(req, "strict", guard.userId);
  if (limited) return limited;

  try {
    const body = await req.json();
    const { code, stderr, dependencies } = body;

    if (!code || !stderr) {
      return NextResponse.json(
        { error: "code and stderr are required" },
        { status: 400 }
      );
    }

    const result = await fixCodeAgent.patchBrokenCode(
      code,
      stderr,
      dependencies || []
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in Auto-Fix:", error);
    return NextResponse.json(
      { error: "Failed to fix code" },
      { status: 500 }
    );
  }
}
