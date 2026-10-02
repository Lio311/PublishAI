import { NextResponse } from "next/server";
import { checkLogicalConsistency } from "@/services/graph/logicChecker";
import { requireUser, userOwnsPaper } from "@/services/api/route-auth";
import { applyRateLimit } from "@/services/rate-limit";

export async function POST(request: Request) {
  const guard = await requireUser();
  if (guard instanceof NextResponse) return guard;
  const limited = await applyRateLimit(request, "ai", guard.userId);
  if (limited) return limited;

  try {
    const { claims, paperId } = await request.json();
    if (!claims || !Array.isArray(claims) || claims.length > 200) {
      return NextResponse.json({ error: "Invalid payload. Expected an array of claims." }, { status: 400 });
    }
    if (paperId != null && !(await userOwnsPaper(guard.userId, Number(paperId)))) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    const report = await checkLogicalConsistency(claims, paperId);
    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to run logic check", error);
    return NextResponse.json({ error: "Failed to run logic check" }, { status: 500 });
  }
}
