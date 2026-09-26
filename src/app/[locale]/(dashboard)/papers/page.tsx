import { db } from "@/services/db";
import { papers, journals } from "@/services/db/schema";
import { desc, eq } from "drizzle-orm";
import { FileText, Search, ArrowRight, ArrowLeft, UploadCloud, ChevronRight, ChevronLeft } from "lucide-react";
import { Link } from "@/app/i18n/routing";
import { getTranslations, setRequestLocale } from "next-intl/server";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { checkIsAdmin } from "@/services/auth-utils";
import { auth } from "@/app/auth";
import { redirect } from "next/navigation";

export default async function PapersPage({
  params
}: {
  params: Promise<{ locale: string }> | { locale: string };
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;
  setRequestLocale(locale);
  const isAdmin = await checkIsAdmin();
  const isHe = locale === "he";

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const t = await getTranslations("Papers");

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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span>{t("status.in_progress")}</span>
          </span>
        );
      case "awaiting_approval":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{t("status.awaiting_approval")}</span>
          </span>
        );
      case "completed":
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{t("status.completed")}</span>
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>{t("status.failed")}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
            {t("status.unknown")}
          </span>
        );
    }
  };

  const NavArrow = isHe ? ChevronLeft : ChevronRight;

  return (
    <DashboardLayout isAdmin={isAdmin}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {t("title")}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              {t("subtitle")}
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-semibold shadow-xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{t("uploadNew")}</span>
          </Link>
        </div>

        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search
                className={`absolute ${isHe ? "right-3.5" : "left-3.5"} top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4`}
              />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                className={`w-full ${
                  isHe ? "pr-10 pl-4" : "pl-10 pr-4"
                } py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all`}
              />
            </div>

            <div className="text-xs text-slate-500 font-medium">
              <span>{allPapers.length} {t("totalCount")}</span>
            </div>
          </div>

          <div className="p-0 overflow-x-auto">
            {allPapers.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-slate-800">{t("empty")}</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {t("emptyDescription")}
                  </p>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{t("uploadNow")}</span>
                </Link>
              </div>
            ) : (
              <table className="w-full text-sm text-center">
                <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100 text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5 text-left rtl:text-right">{t("headers.name")}</th>
                    <th className="px-6 py-3.5">{t("headers.journal")}</th>
                    <th className="px-6 py-3.5">{t("headers.status")}</th>
                    <th className="px-6 py-3.5">{t("headers.date")}</th>
                    <th className="px-6 py-3.5 text-right rtl:text-left">{t("headers.actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allPapers.map((paper) => (
                    <tr
                      key={paper.id}
                      className="hover:bg-sky-50/40 transition-colors group"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 text-left rtl:text-right max-w-md">
                        <Link
                          href={`/papers/${paper.id}`}
                          className="hover:text-sky-600 transition-colors font-semibold block truncate"
                        >
                          {paper.title}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {paper.journalName || (
                          <span className="text-slate-400 italic text-xs">{t("notConfigured")}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(paper.status)}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{formatDate(paper.createdAt)}</td>
                      <td className="px-6 py-4 text-right rtl:text-left">
                        <Link
                          href={`/papers/${paper.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 transition-colors cursor-pointer"
                        >
                          <span>{t("openWorkspace")}</span>
                          <NavArrow className="w-3.5 h-3.5 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
                        </Link>
                      </td>
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
