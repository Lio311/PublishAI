import { db } from "@/db";
import { papers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import PaperTabs from "./PaperTabs";
import { auth } from "@/auth";

export default async function PaperPage({ params }: { params: Promise<{ id: string, locale: string }> | { id: string, locale: string } }) {
  const resolvedParams = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  const t = await getTranslations("common");
  const isHe = resolvedParams.locale === "he";
  const paperId = parseInt(resolvedParams.id);
  if (isNaN(paperId)) return notFound();

  const [paper] = await db.select().from(papers).where(
    and(
      eq(papers.id, paperId),
      eq(papers.userId, session.user.id)
    )
  );
  
  if (!paper) return notFound();

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{paper.title}</h1>
      <p className="text-slate-500 mb-8">
        {isHe ? "קובץ מקורי:" : "Original File:"} {paper.originalFileUrl ? (
          <a href={paper.originalFileUrl} target="_blank" className="text-blue-600 hover:underline">{isHe ? "הורדה" : "Download"}</a>
        ) : (isHe ? "לא ידוע" : "Unknown")}
      </p>

      {/* Tabs interface for advanced AI features */}
      <PaperTabs paperId={paper.id} initialStatus={paper.status || "pending"} />
    </div>
  );
}
