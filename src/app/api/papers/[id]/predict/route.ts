import { NextRequest, NextResponse } from "next/server";
import { db } from "@/services/db";
import { papers, documents, journals, submissions } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { predictAcceptance } from "@/services/ai/acceptance-predictor";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const paperId = parseInt(id);
    
    const paper = await db.query.papers.findFirst({
      where: eq(papers.id, paperId),
      with: { targetJournal: true }
    });
    
    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }
    // Need to do custom query for targetJournal if relations aren't set up perfectly
    const journal = paper.targetJournalId ? await db.query.journals.findFirst({ where: eq(journals.id, paper.targetJournalId) }) : null;

    if (!journal) {
      return NextResponse.json({ error: "No target journal selected" }, { status: 400 });
    }

    const doc = await db.query.documents.findFirst({
      where: eq(documents.paperId, paperId)
    });

    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.paperId, paperId)
    });

    const prediction = await predictAcceptance(
      {
        title: paper.title,
        abstract: doc?.abstract || submission?.submittedAbstract || "",
        keyFindings: submission?.keyFindings || ""
      },
      {
        name: journal.name,
        field: journal.field || "",
        rules: journal.rules,
        requiredSections: journal.requiredSections
      }
    );

    return NextResponse.json(prediction);
  } catch (error: any) {
    console.error("Prediction error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
