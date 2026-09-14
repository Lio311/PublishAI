import { NextResponse } from "next/server";
import { checkLogicalConsistency } from "@/services/graph/logicChecker";

export async function POST(request: Request) {
  try {
    const { claims, paperId } = await request.json();
    if (!claims || !Array.isArray(claims)) {
      return NextResponse.json({ error: "Invalid payload. Expected an array of claims." }, { status: 400 });
    }

    const report = await checkLogicalConsistency(claims, paperId);
    return NextResponse.json(report);
  } catch (error) {
    console.error("Failed to run logic check", error);
    return NextResponse.json({ error: "Failed to run logic check" }, { status: 500 });
  }
}
