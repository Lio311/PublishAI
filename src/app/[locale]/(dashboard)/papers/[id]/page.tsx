import { db } from "@/db";
import { papers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import PaperProcessingUI from "@/components/papers/PaperProcessingUI";

export default async function PaperPage({ params }: { params: { id: string, locale: string } }) {
  const paperId = parseInt(params.id);
  if (isNaN(paperId)) return notFound();

  const [paper] = await db.select().from(papers).where(eq(papers.id, paperId));
  
  if (!paper) return notFound();

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">{paper.title}</h1>
      <p className="text-slate-500 mb-8">
        Original File: {paper.originalFileUrl ? (
          <a href={paper.originalFileUrl} target="_blank" className="text-blue-600 hover:underline">Download</a>
        ) : "Unknown"}
      </p>

      {/* Visual processing UI */}
      <PaperProcessingUI paperId={paper.id} initialStatus={paper.status || "pending"} />
    </div>
  );
}
