import { NextResponse } from "next/server";
import { db } from "@/services/db";
import { submissions, papers, journalConnections } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/app/auth";
import { checkRateLimit } from "@/services/rate-limit";
import { encrypt } from "@/services/security/encryption";

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

    const newSubmission = await db.transaction(async (tx) => {
      // Update its status to 'rejected'
      await tx.update(submissions)
        .set({ status: 'rejected' })
        .where(eq(submissions.id, submissionId));

      // Update the paper's currentJournalId and save the new cascadeQueue
      await tx.update(papers)
        .set({ 
          currentJournalId: isNaN(nextJournalId) ? null : nextJournalId, 
          cascadeQueue: newQueue 
        })
        .where(eq(papers.id, paper.id));

      let connection;
      if (!isNaN(nextJournalId)) {
        connection = await tx.query.journalConnections.findFirst({
          where: (jc, { eq, and }) => and(
            eq(jc.userId, userId),
            eq(jc.journalId, nextJournalId)
          ),
        });
      }

      if (!connection) {
        const [newConn] = await tx.insert(journalConnections).values({
          userId: userId,
          journalId: isNaN(nextJournalId) ? null : nextJournalId,
          platform: 'email',
          siteUrl: 'http://example.com',
          encryptedUsername: encrypt('cascade_system'),
          encryptedPassword: encrypt(''),
        }).returning();
        connection = newConn;
      }

      const [insertedSub] = await tx.insert(submissions).values({
        paperId: paper.id,
        connectionId: connection.id,
        userId: userId,
        status: "draft",
      }).returning();
      
      return insertedSub;
    });

    // Trigger the AI pipeline asynchronously
    const previousJournalId = (submission.connection as any)?.journalId;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      fetch(`${baseUrl}/api/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cascade',
          paperId: paper.id,
          targetJournalId: nextJournalIdStr,
          previousJournalId: previousJournalId,
        }),
      }).catch(err => {
        console.warn("[cascade] Agent run notification skipped or failed:", err?.message || err);
      });
    } catch (err) {
      console.warn("[cascade] Failed to trigger agent run:", err);
    }

    return NextResponse.json(newSubmission, { status: 201 });
  } catch (error: any) {
    console.error("Error in cascade route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
