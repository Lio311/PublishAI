import { NextRequest, NextResponse } from "next/server";
import { fixCodeAgent } from "@/lib/agents/fix-code-agent";

export async function POST(req: NextRequest) {
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
