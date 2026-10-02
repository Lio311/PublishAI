import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/app/auth";
import { db } from "@/services/db";
import { documents, figures, papers } from "@/services/db/schema";

/**
 * Shared authorization guards for API route handlers. Each guard returns either
 * the authorized context or a ready-to-return error response:
 *
 *   const guard = await requireUser();
 *   if (guard instanceof NextResponse) return guard;
 */

export interface UserContext {
  userId: string;
  email: string | null;
}

export async function requireUser(): Promise<UserContext | NextResponse> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { userId: session.user.id, email: session.user.email ?? null };
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email || !process.env.ADMIN_EMAIL) return false;
  const admins = process.env.ADMIN_EMAIL.split(",").map((e) => e.trim().toLowerCase());
  return admins.includes(email.toLowerCase());
}

export async function requireAdmin(): Promise<UserContext | NextResponse> {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  if (!isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return user;
}

export async function userOwnsPaper(userId: string, paperId: number): Promise<boolean> {
  if (!Number.isInteger(paperId) || paperId <= 0) return false;
  const [row] = await db
    .select({ id: papers.id })
    .from(papers)
    .where(and(eq(papers.id, paperId), eq(papers.userId, userId)));
  return Boolean(row);
}

/** Returns the requesting user's paper ids (used to scope shared graph data). */
export async function getUserPaperIds(userId: string): Promise<number[]> {
  const rows = await db.select({ id: papers.id }).from(papers).where(eq(papers.userId, userId));
  return rows.map((r) => r.id);
}

/** 404 rather than 403 so that ids of other users' resources are not confirmed. */
export async function requirePaperOwner(paperId: number): Promise<UserContext | NextResponse> {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  if (!(await userOwnsPaper(user.userId, paperId))) {
    return NextResponse.json({ error: "Paper not found" }, { status: 404 });
  }
  return user;
}

export async function requireFigureOwner(figureId: string): Promise<UserContext | NextResponse> {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  const [row] = await db
    .select({ id: figures.id })
    .from(figures)
    .innerJoin(papers, eq(figures.paperId, papers.id))
    .where(and(eq(figures.id, figureId), eq(papers.userId, user.userId)));
  if (!row) {
    return NextResponse.json({ error: "Figure not found" }, { status: 404 });
  }
  return user;
}

export async function requireDocumentOwner(
  documentId: string
): Promise<{ user: UserContext; document: typeof documents.$inferSelect } | NextResponse> {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;
  if (!/^[0-9a-f-]{36}$/i.test(documentId)) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  const [document] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.userId, user.userId)));
  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  return { user, document };
}
