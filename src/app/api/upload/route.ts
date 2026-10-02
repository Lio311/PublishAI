import { NextResponse } from "next/server";
import { db } from "@/services/db";
import { papers } from "@/services/db/schema";
import { inngest } from "@/inngest/client";
import { auth } from "@/app/auth";
import { checkRateLimit } from "@/services/rate-limit";
import { storePaperFile } from "@/services/storage/paperFiles";
import { assertSupportedFile, assertUsableText, extractTextFromBuffer, ExtractionError, fileExtension } from "@/services/documents/extractText";
import { saveManuscript } from "@/services/documents/manuscriptStore";

const MAX_FILES_PER_UPLOAD = 5;

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const rateLimitResult = await checkRateLimit(userId, "upload");
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const formData = await request.formData();
    const files = formData.getAll("file").filter((f): f is File => f instanceof File && f.size > 0);

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }
    if (files.length > MAX_FILES_PER_UPLOAD) {
      return NextResponse.json({ error: `Upload at most ${MAX_FILES_PER_UPLOAD} files at once` }, { status: 400 });
    }

    // Reject unsupported or oversized files before storing anything.
    try {
      files.forEach((file) => assertSupportedFile(file.name, file.size));
    } catch (error) {
      if (error instanceof ExtractionError) {
        return NextResponse.json({ error: error.message, code: error.code }, { status: 422 });
      }
      throw error;
    }

    const uploadedPapers = [];

    for (const file of files) {
      const title = file.name.replace(/\.[^/.]+$/, "");
      const fileExt = fileExtension(file.name);
      const fileUrl = await storePaperFile(userId, file);

      let extractedText: string | null = null;
      let extractionError: string | null = null;
      try {
        extractedText = assertUsableText(await extractTextFromBuffer(Buffer.from(await file.arrayBuffer()), file.name));
      } catch (error) {
        extractionError = error instanceof ExtractionError ? error.message : "Failed to extract text from document";
      }

      const [newPaper] = await db
        .insert(papers)
        .values({
          title,
          originalFileUrl: fileUrl,
          originalFormat: fileExt,
          status: extractedText ? "pending" : "failed",
          userId,
        })
        .returning();

      if (!extractedText) {
        uploadedPapers.push({ paper: newPaper, textPreview: null, error: extractionError });
        continue;
      }

      const documentId = await saveManuscript({ userId, paperId: newPaper.id, title, text: extractedText, fileUrl, fileType: fileExt });

      // Only ids travel in events; jobs load the stored text (Inngest caps payload size).
      await inngest.send([
        { name: "paper/uploaded", data: { paperId: newPaper.id } },
        { name: "document/uploaded", data: { documentId } },
      ]);

      uploadedPapers.push({
        paper: newPaper,
        textPreview: extractedText.substring(0, 200) + "...",
      });
    }

    return NextResponse.json({
      success: true,
      papers: uploadedPapers,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}
