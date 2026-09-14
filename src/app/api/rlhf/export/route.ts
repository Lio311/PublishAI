import { NextResponse } from "next/server";
import { exportDatasetForFineTuning } from "@/services/rlhfService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { journalId, outcomeFilter } = body;

    const filePath = await exportDatasetForFineTuning(journalId, outcomeFilter);
    
    return NextResponse.json({ 
      message: "Export successful", 
      downloadUrl: `/api/download?file=${encodeURIComponent(filePath)}` 
    });
  } catch (error) {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
