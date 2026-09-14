import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";
import { db } from "@/db";
import { papers } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // 1. Upload to Vercel Blob
    const blob = await put(`articles/${file.name}`, file, {
      access: "public", // We'll keep it public for easy downloading in the prototype, or switch to private if preferred.
    });

    // 2. Extract Text
    let extractedText = "";
    const buffer = Buffer.from(await file.arrayBuffer());

    if (file.name.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (file.name.endsWith(".pdf")) {
      const result = await pdfParse(buffer);
      extractedText = result.text;
    } else {
      return NextResponse.json(
        { error: "Unsupported file format. Please upload .docx or .pdf" },
        { status: 400 }
      );
    }

    // 3. Save to Database
    // Note: We'll save the initial extracted text in the 'paper_stages' or we can just create the paper entry first.
    // Since we don't have authentication wired up completely yet, we'll leave userId as null or mock it.
    
    const [newPaper] = await db.insert(papers).values({
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      originalFileUrl: blob.url,
      originalFormat: file.name.endsWith(".docx") ? "docx" : "pdf",
      status: "pending",
    }).returning();

    // Ideally, we also create the first stage (Clarification/Planning) with the extracted text here.

    return NextResponse.json({ 
      success: true, 
      paper: newPaper,
      blobUrl: blob.url,
      textPreview: extractedText.substring(0, 200) + "..."
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process file", details: error.message },
      { status: 500 }
    );
  }
}
