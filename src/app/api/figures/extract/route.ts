import { NextResponse } from "next/server";
import { extractFiguresFromDocument } from "@/services/visionAi.service";

export async function POST(request: Request) {
  try {
    const { documentUrl } = await request.json();
    
    if (!documentUrl) {
      return NextResponse.json({ error: "documentUrl is required" }, { status: 400 });
    }

    const figures = await extractFiguresFromDocument(documentUrl);
    return NextResponse.json({ figures });
  } catch (error) {
    return NextResponse.json({ error: "Failed to extract figures" }, { status: 500 });
  }
}
