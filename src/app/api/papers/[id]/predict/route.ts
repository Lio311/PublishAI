import { NextRequest, NextResponse } from "next/server";
import { db } from "@/services/db";
import { papers, documents, journals, submissions } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { predictAcceptance } from "@/services/ai/acceptance-predictor";
import { auth } from "@/app/auth";
import { applyRateLimit } from "@/services/rate-limit";
import { z } from "zod";

const paramsSchema = z.object({
  id: z.coerce.number().int().positive("Paper ID must be a positive integer"),
});

const predictBodySchema = z
  .object({
    targetJournalId: z.coerce.number().int().positive().optional(),
    abstract: z.string().trim().max(20000).optional(),
    keyFindings: z.string().trim().max(10000).optional(),
    authorHistory: z.string().trim().max(5000).optional(),
  })
  .optional();

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Heavy AI endpoint rate limiting (tier: "ai")
    const rateLimitResponse = await applyRateLimit(req, "ai", session.user.id);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const rawParams = await context.params;
    const paramParse = paramsSchema.safeParse(rawParams);
    if (!paramParse.success) {
      return NextResponse.json(
        { error: "Invalid paper ID", details: paramParse.error.flatten() },
        { status: 400 }
      );
    }
    const paperId = paramParse.data.id;

    // Safely parse body if provided
    let bodyData: z.infer<typeof predictBodySchema> = undefined;
    try {
      const text = await req.text();
      if (text && text.trim().length > 0) {
        const json = JSON.parse(text);
        const bodyParse = predictBodySchema.safeParse(json);
        if (!bodyParse.success) {
          return NextResponse.json(
            { error: "Invalid request payload", details: bodyParse.error.flatten() },
            { status: 400 }
          );
        }
        bodyData = bodyParse.data;
      }
    } catch {
      return NextResponse.json(
        { error: "Malformed JSON payload in request body" },
        { status: 400 }
      );
    }

    const paper = await db.query.papers.findFirst({
      where: eq(papers.id, paperId),
      with: { targetJournal: true },
    });

    if (!paper) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 });
    }

    if (paper.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Determine target journal
    let journal = (paper as any).targetJournal;

    if (bodyData?.targetJournalId) {
      journal = await db.query.journals.findFirst({
        where: eq(journals.id, bodyData.targetJournalId),
      });
      if (!journal) {
        return NextResponse.json(
          { error: "Specified target journal not found" },
          { status: 400 }
        );
      }
    } else if (!journal && paper.targetJournalId) {
      journal = await db.query.journals.findFirst({
        where: eq(journals.id, paper.targetJournalId),
      });
    }

    if (!journal) {
      return NextResponse.json(
        { error: "No target journal selected or found for prediction" },
        { status: 400 }
      );
    }

    const doc = await db.query.documents.findFirst({
      where: eq(documents.paperId, paperId),
    });

    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.paperId, paperId),
    });

    const abstractText =
      bodyData?.abstract || doc?.abstract || submission?.submittedAbstract || "";
    const keyFindingsText =
      bodyData?.keyFindings || submission?.keyFindings || "";

    const prediction = await predictAcceptance(
      {
        title: paper.title,
        abstract: abstractText,
        keyFindings: keyFindingsText,
      },
      {
        name: journal.name,
        field: journal.field || "",
        rules: journal.rules,
        requiredSections: journal.requiredSections,
      },
      bodyData?.authorHistory
    );

    return NextResponse.json(prediction);
  } catch (error: any) {
    console.error("[API papers/[id]/predict POST] Error:", error);
    return NextResponse.json(
      { error: "Acceptance prediction failed. Please try again later." },
      { status: 500 }
    );
  }
}
