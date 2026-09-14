import DashboardLayout from "@/components/layout/DashboardLayout";
import UploadZone from "@/components/dashboard/UploadZone";
import SystemExplainButton from "@/components/dashboard/SystemExplainButton";
import { FileText, Clock, CheckCircle } from "lucide-react";
import { db } from "@/db";
import { papers, journals } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { checkIsAdmin } from "@/lib/auth-utils";

export default async function Home({
  params
}: {
  params: { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  const isAdmin = await checkIsAdmin();
  
  const t = await getTranslations("Dashboard");

  // Fetch real data from the database
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
    .orderBy(desc(papers.createdAt));

  // Calculate real stats
  const inProgressCount = allPapers.filter(
    (p) => p.status === "in_progress" || p.status === "pending"
  ).length;
  const awaitingCount = allPapers.filter(
    (p) => p.status === "awaiting_approval"
  ).length;
  const completedCount = allPapers.filter(
    (p) => p.status === "completed" || p.status === "approved"
  ).length;

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
      <header className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">{t("title")}</h1>
            <p className="text-slate-600">{t("subtitle")}</p>
          </div>
          <SystemExplainButton />
        </div>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{t("stats.inProgress")}</p>
            <p className="text-2xl font-bold text-slate-800">{inProgressCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-lg">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{t("stats.awaiting")}</p>
            <p className="text-2xl font-bold text-slate-800">{awaitingCount}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">{t("stats.completed")}</p>
            <p className="text-2xl font-bold text-slate-800">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* Main Upload Zone */}
      <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <UploadZone />
      </section>

      {/* Recent Papers */}
      <section className="mt-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4">{t("recentPapers.title")}</h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-0">
            {allPapers.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                {t("recentPapers.empty")}
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
                  {allPapers.slice(0, 5).map((paper) => (
                    <tr key={paper.id} className="hover:bg-slate-50 transition-colors cursor-pointer">
                      <td className="px-6 py-4 font-medium text-slate-800">{paper.title}</td>
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
      </section>
    </DashboardLayout>
  );
}
