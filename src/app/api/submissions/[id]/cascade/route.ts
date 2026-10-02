import { NextResponse } from "next/server";
import { db } from "@/services/db";
import { submissions, papers, journalConnections, journals } from "@/services/db/schema";
import { and, eq } from "drizzle-orm";
import { emitSubmissionStatusEvents } from "@/services/submission/statusEvents";
import { auth } from "@/app/auth";
import { checkRateLimit } from "@/services/rate-limit";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResult = await checkRateLimit(session.user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const { id } = await context.params;
    const submissionId = Number(id);

    if (isNaN(submissionId) || submissionId <= 0) {
      return NextResponse.json(
        { error: "Invalid submission ID" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Find the submission by ID
    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, submissionId),
      with: { connection: true },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Authorization: Verify caller owns this submission
    if (submission.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: Not authorized to cascade this submission" },
        { status: 403 }
      );
    }

    // Find the associated paper
    const paper = await db.query.papers.findFirst({
      where: eq(papers.id, submission.paperId),
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Authorization: Verify caller owns the paper
    if (paper.userId !== userId) {
      return NextResponse.json(
        { error: "Forbidden: Not authorized to modify this paper" },
        { status: 403 }
      );
    }

    // Check its cascadeQueue
    const queue = paper.cascadeQueue || [];
    if (queue.length === 0) {
      return NextResponse.json({ error: "Cascade queue is empty" }, { status: 400 });
    }

    const nextJournalIdStr = queue[0];
    const nextJournalId = parseInt(nextJournalIdStr, 10);
    const newQueue = queue.slice(1);

    if (isNaN(nextJournalId)) {
      return NextResponse.json({ error: "Invalid journal in cascade queue" }, { status: 400 });
    }

    // A real connection is required to submit; never fabricate placeholder credentials.
    const connection = await db.query.journalConnections.findFirst({
      where: and(eq(journalConnections.userId, userId), eq(journalConnections.journalId, nextJournalId)),
    });
    if (!connection) {
      const nextJournal = await db.query.journals.findFirst({ where: eq(journals.id, nextJournalId) });
      return NextResponse.json(
        {
          error: `Connect your ${nextJournal?.name ?? "next journal"} account before cascading.`,
          code: "CONNECTION_REQUIRED",
          journalId: nextJournalId,
        },
        { status: 409 }
      );
    }

    // neon-http has no interactive transactions; db.batch runs these atomically.
    const [, , [newSubmission]] = await db.batch([
      db.update(submissions).set({ status: "rejected" }).where(eq(submissions.id, submissionId)),
      db.update(papers).set({ currentJournalId: nextJournalId, cascadeQueue: newQueue }).where(eq(papers.id, paper.id)),
      db
        .insert(submissions)
        .values({ paperId: paper.id, connectionId: connection.id, userId, status: "draft" })
        .returning(),
    ]);

    // Outcome learning + fresh alternative-journal recommendations run in the background.
    await emitSubmissionStatusEvents(submissionId, "rejected");

    return NextResponse.json(newSubmission, { status: 201 });
  } catch (error) {
    console.error("Error in cascade route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
