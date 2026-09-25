import { NextResponse } from "next/server";
import { db } from "@/services/db";
import { submissions, papers, journalConnections } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/app/auth";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const submissionId = Number(id);
    const userId = session.user.id;

    // Find the submission by ID
    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, submissionId),
      with: { connection: true }
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Update its status to 'rejected'
    await db.update(submissions)
      .set({ status: 'rejected' })
      .where(eq(submissions.id, submissionId));

    // Find the associated paper
    const paper = await db.query.papers.findFirst({
      where: eq(papers.id, submission.paperId)
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    // Check its cascadeQueue
    const queue = paper.cascadeQueue || [];
    if (queue.length === 0) {
      return NextResponse.json({ error: "Cascade queue is empty" }, { status: 400 });
    }

    // Pop the first journal ID (nextJournalId)
    const nextJournalId = queue[0];
    const newQueue = queue.slice(1);

    // Update the paper's currentJournalId and save the new cascadeQueue
    await db.update(papers)
      .set({ 
        currentJournalId: nextJournalId, 
        cascadeQueue: newQueue 
      })
      .where(eq(papers.id, paper.id));

    // We need to create a new submission record for the nextJournalId with status 'draft'.
    // Since submission requires a connectionId, we look for an existing connection or create a dummy one.
    // Try to treat nextJournalId as a number if it is one, for the journalId lookup.
    const numericJournalId = parseInt(nextJournalId, 10);
    let connection;
    
    if (!isNaN(numericJournalId)) {
      connection = await db.query.journalConnections.findFirst({
        where: (jc, { eq, and }) => and(
          eq(jc.userId, userId),
          eq(jc.journalId, numericJournalId)
        )
      });
    }

    if (!connection) {
      // Fallback: create a dummy connection
      const [newConn] = await db.insert(journalConnections).values({
        userId: userId,
        journalId: isNaN(numericJournalId) ? null : numericJournalId,
        platform: 'email',
        siteUrl: 'http://example.com',
        encryptedUsername: 'dummy',
        encryptedPassword: 'dummy'
      }).returning();
      connection = newConn;
    }

    // Create a new submission record
    const [newSubmission] = await db.insert(submissions).values({
      paperId: paper.id,
      connectionId: connection.id,
      userId: session.user.id,
      status: "draft",
    }).returning();

    // Trigger the AI pipeline
    const previousJournalId = (submission.connection as any)?.journalId;

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      fetch(`${baseUrl}/api/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cascade',
          paperId: paper.id,
          targetJournalId: nextJournalId,
          previousJournalId: previousJournalId
        })
      }).catch(err => console.error("Agent run failed inline", err));
    } catch (err) {
      console.error("Failed to trigger agent run", err);
    }

    return NextResponse.json(newSubmission);
  } catch (error: any) {
    console.error("Error in cascade route:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
