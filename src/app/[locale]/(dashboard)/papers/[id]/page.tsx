import { db } from "@/services/db";
import { papers, journals } from "@/services/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PaperTabs from "./PaperTabs";
import { auth } from "@/app/auth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { checkIsAdmin } from "@/services/auth-utils";
import { Link } from "@/app/i18n/routing";
import { ArrowLeft, Download, Calendar, Building2, ExternalLink } from "lucide-react";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import SubmissionProgressBar from "@/components/submission/SubmissionProgressBar";
import { submissions } from "@/services/db/schema";
import { desc } from "drizzle-orm";

export default async function PaperPage({
  params
}: {
  params: Promise<{ id: string; locale: string }> | { id: string; locale: string };
}) {
  const resolvedParams = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const locale = resolvedParams.locale;
  setRequestLocale(locale);
  const isAdmin = await checkIsAdmin();
  const t = await getTranslations("Papers");
  const isHe = locale === "he";
  const paperId = parseInt(resolvedParams.id);
  if (isNaN(paperId)) return notFound();

  const [paperRecord] = await db
    .select({
      id: papers.id,
      title: papers.title,
      status: papers.status,
      originalFileUrl: papers.originalFileUrl,
      createdAt: papers.createdAt,
      journalName: journals.name,
      citationStyle: journals.citationStyle,
    })
    .from(papers)
    .leftJoin(journals, eq(papers.targetJournalId, journals.id))
    .where(
      and(
        eq(papers.id, paperId),
        eq(papers.userId, session.user.id)
      )
    );

  
  const [latestSubmission] = await db
    .select({ status: submissions.status })
    .from(submissions)
    .where(eq(submissions.paperId, paperId))
    .orderBy(desc(submissions.createdAt))
    .limit(1);
    
  if (!paperRecord) return notFound();


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

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "pending":
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
            <span>{t("status.in_progress")}</span>
          </span>
        );
      case "awaiting_approval":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>{t("status.awaiting_approval")}</span>
          </span>
        );
      case "completed":
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{t("status.completed")}</span>
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>{t("status.failed")}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span>{status || t("status.unknown")}</span>
          </span>
        );
    }
  };

  return (
    <DashboardLayout isAdmin={isAdmin}>
      <div className="space-y-6">
        {/* Navigation & Breadcrumb Bar */}
        <div className="flex items-center justify-between">
          <Link
            href={`/${locale}/papers`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-sky-600 transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
            <span>{t("backToList")}</span>
          </Link>

          <div className="text-xs text-slate-400 flex items-center gap-1 font-mono">
            <span>ID #{paperRecord.id}</span>
          </div>
        </div>

        {/* Paper Overview Header Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex items-center gap-3 flex-wrap">
                {getStatusBadge(paperRecord.status)}
                {paperRecord.journalName && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{paperRecord.journalName}</span>
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
                {paperRecord.title}
              </h1>

              <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap pt-1">
                {paperRecord.createdAt && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDate(paperRecord.createdAt)}</span>
                  </span>
                )}
                {paperRecord.citationStyle && (
                  <span className="font-mono text-slate-400">{t("style")}: {paperRecord.citationStyle}</span>
                )}
              </div>
            </div>

            {/* Original manuscript action */}
            {paperRecord.originalFileUrl && (
              <div className="shrink-0">
                <a
                  href={paperRecord.originalFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-200 font-medium text-xs transition-all shadow-2xs group cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-500 group-hover:text-sky-600 transition-colors" />
                  <span>{t("downloadOriginal")}</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Paper Tabs & Interactive Workspaces */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 mb-6 shadow-xs">
           <h3 className="text-lg font-semibold mb-4 text-slate-800">{t("submissionProgress")}</h3>
           <SubmissionProgressBar currentStatus={latestSubmission?.status || "draft"} />
        </div>
        <ErrorBoundary name="Paper Workspace">
          <PaperTabs paperId={paperRecord.id} initialStatus={paperRecord.status || "pending"} />
        </ErrorBoundary>
      </div>
    </DashboardLayout>
  );
}
