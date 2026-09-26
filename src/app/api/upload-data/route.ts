import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { db } from "@/services/db";
import { dataFiles } from "@/services/db/schema";
import { inngest } from "@/inngest/client";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const paperIdString = formData.get("paperId") as string;
    
    if (!file || !paperIdString) {
      return NextResponse.json(
        { error: "File and paperId are required" },
        { status: 400 }
      );
    }

    const paperId = parseInt(paperIdString, 10);

    // Upload to Vercel Blob
    const blob = await put(file.name, file, { access: "public" });

    // Save to database
    const [savedFile] = await db.insert(dataFiles).values({
      paperId,
      filename: file.name,
      fileUrl: blob.url,
      mimeType: file.type,
    }).returning();

    // Fire event to start analysis pipeline
    await inngest.send({
      name: "dataset/uploaded",
      data: { paperId }
    });

    return NextResponse.json({ file: savedFile }, { status: 201 });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
