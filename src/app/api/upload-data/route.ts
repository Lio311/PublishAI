import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { db } from "@/services/db";
import { dataFiles, papers } from "@/services/db/schema";
import { inngest } from "@/inngest/client";
import { auth } from "@/app/auth";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    if (isNaN(paperId) || paperId <= 0) {
      return NextResponse.json(
        { error: "Invalid paperId" },
        { status: 400 }
      );
    }

    // Verify paper ownership before allowing upload
    const paper = await db.query.papers.findFirst({
      where: eq(papers.id, paperId),
      columns: { id: true, userId: true },
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    if (paper.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Upload to Vercel Blob with private access
    const blob = await put(file.name, file, { access: "private" });

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
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
