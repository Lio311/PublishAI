import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import mammoth from "mammoth";
// @ts-ignore
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { db } from "@/db";
import { papers } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { auth } from "@/auth";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await checkRateLimit(session.user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const formData = await request.formData();
    const files = formData.getAll("file") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadedPapers = [];

    for (const file of files) {
      // 1. Upload to Vercel Blob
      const blob = await put(`articles/${file.name}`, file, {
        access: "private",
      });

      // 2. Extract Text
      let extractedText = "";
      const buffer = Buffer.from(await file.arrayBuffer());

      if (file.name.toLowerCase().endsWith(".docx")) {
        try {
          const result = await mammoth.convertToHtml({ buffer });
          extractedText = result.value;
        } catch (e) {
          console.error(`Failed to extract text from docx: ${file.name}`, e);
        }
      } else if (file.name.toLowerCase().endsWith(".pdf")) {
        try {
          const result = await pdfParse(buffer);
          extractedText = result.text;
        } catch (e) {
          console.error(`Failed to extract text from pdf: ${file.name}`, e);
        }
      }

      const fileExtension = file.name.split('.').pop()?.toLowerCase() || "unknown";

      if (!extractedText) {
        // Still save the paper but with error status
        const [newPaper] = await db.insert(papers).values({
          title: file.name.replace(/\.[^/.]+$/, ""),
          originalFileUrl: blob.url,
          originalFormat: fileExtension,
          status: "failed",
          userId: session.user.id,
        }).returning();
        
        uploadedPapers.push({
          paper: newPaper,
          blobUrl: blob.url,
          textPreview: null,
          error: "Failed to extract text from document"
        });
        continue;
      }

      // 3. Save to Database
      const [newPaper] = await db.insert(papers).values({
        title: file.name.replace(/\.[^/.]+$/, ""),
        originalFileUrl: blob.url,
        originalFormat: fileExtension,
        status: "pending",
        userId: session.user.id,
      }).returning();

      // Trigger Inngest background job if we have text
      if (extractedText) {
        await inngest.send({
          name: "paper/uploaded",
          data: {
            paperId: newPaper.id,
            textContent: extractedText,
          }
        });
      }

      uploadedPapers.push({
        paper: newPaper,
        blobUrl: blob.url,
        textPreview: extractedText ? extractedText.substring(0, 200) + "..." : null
      });
    }

    return NextResponse.json({ 
      success: true, 
      papers: uploadedPapers
    });

  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process file", details: error.message },
      { status: 500 }
    );
  }
}
