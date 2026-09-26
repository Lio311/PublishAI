import { NextRequest, NextResponse } from "next/server";
import { db } from "@/services/db";
import { papers, journals } from "@/services/db/schema";
import { auth } from "@/app/auth";
import { eq, desc, and, ilike, or, count } from "drizzle-orm";
import { applyRateLimit } from "@/services/rate-limit";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z
    .enum(["pending", "in_progress", "awaiting_approval", "approved", "completed", "failed"])
    .optional(),
  search: z.string().trim().max(200).optional(),
});

const createPaperSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(500, "Title is too long"),
    targetJournalId: z.coerce.number().int().positive().optional().nullable(),
    doi: z.string().trim().max(100).optional().nullable(),
    originalFileUrl: z.string().url().max(1000).optional().nullable(),
    originalFormat: z.string().trim().max(50).optional().nullable(),
    cascadeQueue: z.array(z.string().trim()).optional().nullable(),
    status: z
      .enum(["pending", "in_progress", "awaiting_approval", "approved", "completed", "failed"])
      .default("pending"),
  })
  .strict();

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = await applyRateLimit(req, "read", session.user.id);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { searchParams } = new URL(req.url);
    const parseResult = querySchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { page, limit, status, search } = parseResult.data;
    const offset = (page - 1) * limit;

    const conditions = [eq(papers.userId, session.user.id)];

    if (status) {
      conditions.push(eq(papers.status, status));
    }

    if (search) {
      conditions.push(
        or(
          ilike(papers.title, `%${search}%`),
          ilike(papers.doi, `%${search}%`)
        )!
      );
    }

    const whereClause = and(...conditions);

    const data = await db.query.papers.findMany({
      where: whereClause,
      with: {
        targetJournal: true,
      },
      orderBy: desc(papers.createdAt),
      limit,
      offset,
    });

    const [countResult] = await db
      .select({ value: count() })
      .from(papers)
      .where(whereClause);

    const total = countResult?.value ?? 0;

    return NextResponse.json({
      papers: data,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error("[API papers GET] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimitResponse = await applyRateLimit(req, "write", session.user.id);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    let rawBody;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Malformed JSON payload in request body" },
        { status: 400 }
      );
    }

    const parseResult = createPaperSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const body = parseResult.data;

    if (body.targetJournalId) {
      const journal = await db.query.journals.findFirst({
        where: eq(journals.id, body.targetJournalId),
        columns: { id: true },
      });
      if (!journal) {
        return NextResponse.json(
          { error: "Target journal not found" },
          { status: 400 }
        );
      }
    }

    const [newPaper] = await db
      .insert(papers)
      .values({
        userId: session.user.id,
        title: body.title,
        status: body.status || "pending",
        targetJournalId: body.targetJournalId || null,
        doi: body.doi || null,
        originalFileUrl: body.originalFileUrl || null,
        originalFormat: body.originalFormat || null,
        cascadeQueue: body.cascadeQueue || null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        message: "Paper created successfully",
        paper: newPaper,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API papers POST] Error:", error);
    return NextResponse.json(
      { error: "Failed to create paper" },
      { status: 500 }
    );
  }
}
