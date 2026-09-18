import { NextResponse } from "next/server";
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { auth } from "@/auth";
import { inngest } from "@/inngest/client";
import { eq, desc } from "drizzle-orm";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await checkRateLimit(session.user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    const body = await req.json();
    const { paperId, connectionId, publishMode } = body;

    if (!paperId || !connectionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Create submission record immediately without blocking on metadata extraction
    const newSubmission = await db.insert(submissions).values({
      paperId: Number(paperId),
      connectionId: Number(connectionId),
      userId: session.user.id,
      publishMode: publishMode || "draft",
      status: "preparing",
    }).returning();

    const submissionId = newSubmission[0].id;

    // Trigger Inngest background job (which will handle metadata extraction + processing)
    await inngest.send({
      name: "submission/process",
      data: { submissionId },
    });

    return NextResponse.json(newSubmission[0], { status: 202 });
  } catch (error: any) {
    console.error("Error creating submission:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await checkRateLimit(session.user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
    }

    // Fetch submissions WITHOUT including sensitive connection info initially
    const userSubmissions = await db.query.submissions.findMany({
      where: eq(submissions.userId, session.user.id),
      orderBy: (submissions, { desc }) => [desc(submissions.createdAt)],
      with: {
        connection: {
          columns: {
            // Exclude encryptedUsername and encryptedPassword via column projection
            id: true,
            journalId: true,
            userId: true,
            createdAt: true,
          }
        },
      }
    });

    return NextResponse.json(userSubmissions);
  } catch (error: any) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
