import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/services/db";
import { paperVersions } from "@/services/db/schema";
import { requireDocumentOwner } from "@/services/api/route-auth";

/** Version history of the paper this document belongs to. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireDocumentOwner((await params).id);
  if (guard instanceof NextResponse) return guard;

  const paperId = guard.document.paperId;
  const versions = paperId
    ? await db
        .select({
          id: paperVersions.id,
          versionNumber: paperVersions.versionNumber,
          changesSummary: paperVersions.changesSummary,
          format: paperVersions.format,
          createdAt: paperVersions.createdAt,
        })
        .from(paperVersions)
        .where(eq(paperVersions.paperId, paperId))
        .orderBy(desc(paperVersions.versionNumber))
    : [];

  return NextResponse.json({ documentId: guard.document.id, versions, totalVersions: versions.length });
}
