import DashboardLayout from "@/components/layout/DashboardLayout";
import UploadZone from "@/components/dashboard/UploadZone";
import SystemExplainButton from "@/components/dashboard/SystemExplainButton";
import { FileText, Clock, CheckCircle, ArrowRight, ArrowLeft, ChevronRight, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { db } from "@/services/db";
import { papers, journals } from "@/services/db/schema";
import { desc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { checkIsAdmin } from "@/services/auth-utils";
import { auth } from "@/app/auth";
import { redirect } from "next/navigation";

export default async function Home({
  params
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  const isAdmin = await checkIsAdmin();
  const isHe = locale === "he";

  const session = await auth();
  const userId = session?.user?.id;

  if (session && !userId) {
    // Session exists but is missing user.id (old JWT format). Force signout via custom route.
    redirect("/api/auth/clear-session");
  }

  if (!userId) {
    // Not authenticated. Let GlobalPasswordProtection handle the UI.
    redirect(`/${locale}/login`);
  }

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
    .where(eq(papers.userId, userId))
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
    return new Intl.DateTimeFormat(isHe ? "he-IL" : "en-US", {
      day: "2-digit",
      month: "short",
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            <span>{t("recentPapers.status.in_progress")}</span>
          </span>
        );
      case "awaiting_approval":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>{t("recentPapers.status.awaiting_approval")}</span>
          </span>
        );
      case "completed":
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{t("recentPapers.status.completed")}</span>
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{t("recentPapers.status.failed")}</span>
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

  const NavArrow = isHe ? ChevronLeft : ChevronRight;

  return (
    <DashboardLayout isAdmin={isAdmin}>
      <header className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">{t("title")}</h1>
            <p className="text-slate-600 text-sm leading-relaxed">{t("subtitle")}</p>
          </div>
          <SystemExplainButton />
        </div>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex items-center gap-4 group">
          <div className="bg-sky-50 text-sky-600 p-3 rounded-xl border border-sky-100 group-hover:scale-105 transition-transform">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t("stats.inProgress")}</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{inProgressCount}</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex items-center gap-4 group">
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl border border-amber-100 group-hover:scale-105 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t("stats.awaiting")}</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{awaitingCount}</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-sm transition-all flex items-center gap-4 group">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl border border-emerald-100 group-hover:scale-105 transition-transform">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t("stats.completed")}</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{completedCount}</p>
          </div>
        </div>
      </div>

      {/* Main Upload Zone */}
      <section className="bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs">
        <UploadZone />
      </section>

      {/* Recent Papers */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">{t("recentPapers.title")}</h2>
          {allPapers.length > 5 && (
            <Link
              href={`/${locale}/papers`}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors"
            >
              <span>{isHe ? "צפה בכל המאמרים" : "View all papers"}</span>
              <NavArrow className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-0 overflow-x-auto">
            {allPapers.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                {t("recentPapers.empty")}
              </div>
            ) : (
              <table className="w-full text-sm text-center">
                <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 text-left rtl:text-right">{t("recentPapers.headers.name")}</th>
                    <th className="px-6 py-3.5">{t("recentPapers.headers.journal")}</th>
                    <th className="px-6 py-3.5">{t("recentPapers.headers.status")}</th>
                    <th className="px-6 py-3.5">{t("recentPapers.headers.date")}</th>
                    <th className="px-6 py-3.5 text-right rtl:text-left">{isHe ? "פעולות" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allPapers.slice(0, 5).map((paper) => (
                    <tr key={paper.id} className="hover:bg-sky-50/40 transition-colors group">
                      <td className="px-6 py-4 font-medium text-slate-900 text-left rtl:text-right max-w-xs sm:max-w-md truncate">
                        <Link
                          href={`/${locale}/papers/${paper.id}`}
                          className="hover:text-sky-600 transition-colors font-semibold block truncate"
                        >
                          {paper.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-600 text-xs">
                        {paper.journalName || (
                          <span className="text-slate-400 italic">{t("recentPapers.notConfigured")}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(paper.status)}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{formatDate(paper.createdAt)}</td>
                      <td className="px-6 py-4 text-right rtl:text-left">
                        <Link
                          href={`/${locale}/papers/${paper.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <span>{isHe ? "פתח" : "Open"}</span>
                          <NavArrow className="w-3.5 h-3.5" />
                        </Link>
                      </td>
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
