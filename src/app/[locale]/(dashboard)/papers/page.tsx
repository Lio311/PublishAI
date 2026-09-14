import { db } from "@/db";
import { papers, journals } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { FileText, Clock, CheckCircle, Search } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { checkIsAdmin } from "@/lib/auth-utils";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function PapersPage({
  params
}: {
  params: { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  const isAdmin = await checkIsAdmin();
  
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  const t = await getTranslations("Dashboard");

  // Fetch all papers
  const allPapers = await db
    .select({
      id: papers.id,
      title: papers.title,
      status: papers.status,
      createdAt: papers.createdAt,
      journalName: journals.name
    })
    .from(papers)
    .leftJoin(journals, eq(papers.targetJournalId, journals.id))
    .where(eq(papers.userId, session.user.id))
    .orderBy(desc(papers.createdAt));

  // Format date helper
  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  // Status badge styling helper
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
      case "in_progress":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {t("recentPapers.status.in_progress")}
          </span>
        );
      case "awaiting_approval":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            {t("recentPapers.status.awaiting_approval")}
          </span>
        );
      case "completed":
      case "approved":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {t("recentPapers.status.completed")}
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {t("recentPapers.status.failed")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            {t("recentPapers.status.unknown")}
          </span>
        );
    }
  };

  return (
    <DashboardLayout isAdmin={isAdmin}>
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {locale === 'he' ? 'המאמרים שלי' : 'My Papers'}
          </h1>
          <p className="text-slate-500 mt-1">
            {locale === 'he' ? 'נהל ועקוב אחר סטטוס המאמרים שלך.' : 'Manage and track the status of your manuscripts.'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center">
          <div className="relative w-full max-w-md">
            <Search className={`absolute ${locale === 'he' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5`} />
            <input 
              type="text"
              placeholder={locale === 'he' ? 'חיפוש מאמרים...' : 'Search papers...'}
              className={`w-full ${locale === 'he' ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500`}
            />
          </div>
        </div>
        
        <div className="p-0">
          {allPapers.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-lg font-medium">{t("recentPapers.empty")}</p>
            </div>
          ) : (
            <table className="w-full text-sm text-center">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">{t("recentPapers.headers.name")}</th>
                  <th className="px-6 py-4 font-medium">{t("recentPapers.headers.journal")}</th>
                  <th className="px-6 py-4 font-medium">{t("recentPapers.headers.status")}</th>
                  <th className="px-6 py-4 font-medium">{t("recentPapers.headers.date")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allPapers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {/* For now, just display the title. Later we can link to the artifact dashboard */}
                      {paper.title}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{paper.journalName || t("recentPapers.notConfigured")}</td>
                    <td className="px-6 py-4">{getStatusBadge(paper.status)}</td>
                    <td className="px-6 py-4 text-slate-500">{formatDate(paper.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}
