import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/services/db";
import { submissions, papers, journalConnections } from "@/services/db/schema";
import { auth } from "@/app/auth";
import { inngest } from "@/inngest/client";
import { eq, desc } from "drizzle-orm";
import { checkRateLimit } from "@/services/rate-limit";

const createSubmissionSchema = z.object({
  paperId: z.coerce.number().int().positive("paperId must be a positive integer"),
  connectionId: z.coerce.number().int().positive("connectionId must be a positive integer"),
  publishMode: z.enum(["draft", "publish", "review"]).default("draft").optional(),
});

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

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parseResult = createSubmissionSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Validation error", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { paperId, connectionId, publishMode } = parseResult.data;

    // Authorization: Verify paper exists and belongs to current user
    const paper = await db.query.papers.findFirst({
      where: eq(papers.id, paperId),
    });
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }
    if (paper.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: Not authorized to submit this paper" }, { status: 403 });
    }

    // Authorization: Verify journal connection exists and belongs to current user
    const connection = await db.query.journalConnections.findFirst({
      where: eq(journalConnections.id, connectionId),
    });
    if (!connection) {
      return NextResponse.json({ error: "Journal connection not found" }, { status: 404 });
    }
    if (connection.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: Not authorized to use this journal connection" }, { status: 403 });
    }

    // Create submission record immediately without blocking on metadata extraction
    const newSubmission = await db.insert(submissions).values({
      paperId,
      connectionId,
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
