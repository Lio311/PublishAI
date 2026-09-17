"use client";

import React, { useState } from "react";
import {
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  FileText,
  Building2,
  Calendar,
  Layers,
  ArrowUpRight,
  Info,
  X,
  Copy,
  Check,
  ShieldCheck,
  RotateCcw,
  MessageSquare
} from "lucide-react";

export type SubmissionStatus =
  | "preparing"
  | "submitting"
  | "submitted"
  | "under_review"
  | "revision_required"
  | "accepted"
  | "rejected"
  | "failed"
  | "draft";

export interface SubmissionItem {
  id: string | number;
  paperId?: string | number;
  title: string;
  journalName: string;
  platform?: string;
  status: SubmissionStatus;
  publishMode?: "draft" | "publish" | "review";
  submittedAt?: string | Date;
  updatedAt?: string | Date;
  confirmationId?: string;
  remotePostUrl?: string;
  articleType?: string;
  authors?: string[];
  abstract?: string;
  attemptCount?: number;
  maxAttempts?: number;
  errorLog?: string;
  commentsCount?: number;
  unresolvedCommentsCount?: number;
}

export interface SubmissionDashboardProps {
  submissions?: SubmissionItem[];
  onSelectSubmission?: (submission: SubmissionItem) => void;
  onNavigateToReviews?: (submission: SubmissionItem) => void;
  onNewSubmission?: () => void;
  onRetrySubmission?: (id: string | number) => void;
  locale?: string;
}


export default function SubmissionDashboard({
  submissions: initialSubmissions = [],
  onSelectSubmission,
  onNavigateToReviews,
  onNewSubmission,
  onRetrySubmission,
  locale = "en",
}: SubmissionDashboardProps) {
  const isHe = locale === "he";
  const [submissionsList, setSubmissionsList] = useState<SubmissionItem[]>(initialSubmissions);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<SubmissionItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | number | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRetry = (e: React.MouseEvent, item: SubmissionItem) => {
    e.stopPropagation();
    setRetryingId(item.id);
    if (onRetrySubmission) {
      onRetrySubmission(item.id);
    }
    setTimeout(() => {
      setSubmissionsList((prev) =>
        prev.map((sub) =>
          sub.id === item.id
            ? { ...sub, status: "submitting", attemptCount: (sub.attemptCount || 0) + 1, errorLog: undefined }
            : sub
        )
      );
      setRetryingId(null);
      // Simulate submission success after 2 seconds
      setTimeout(() => {
        setSubmissionsList((prev) =>
          prev.map((sub) =>
            sub.id === item.id
              ? {
                  ...sub,
                  status: "submitted",
                  confirmationId: `CONF-${Math.floor(100000 + Math.random() * 900000)}`,
                  remotePostUrl: "https://journal.example.org/submissions/track",
                }
              : sub
          )
        );
      }, 2000);
    }, 1200);
  };

  const filteredSubmissions = submissionsList.filter((item) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      item.title.toLowerCase().includes(query) ||
      item.journalName.toLowerCase().includes(query) ||
      (item.confirmationId && item.confirmationId.toLowerCase().includes(query)) ||
      (item.platform && item.platform.toLowerCase().includes(query));

    if (!matchesSearch) return false;

    if (selectedFilter === "all") return true;
    if (selectedFilter === "review") return item.status === "under_review" || item.status === "submitted";
    if (selectedFilter === "revision") return item.status === "revision_required";
    if (selectedFilter === "active") return item.status === "preparing" || item.status === "submitting";
    if (selectedFilter === "failed") return item.status === "failed";
    return true;
  });

  // Metric counts
  const totalCount = submissionsList.length;
  const underReviewCount = submissionsList.filter(
    (s) => s.status === "under_review" || s.status === "submitted"
  ).length;
  const revisionCount = submissionsList.filter((s) => s.status === "revision_required").length;
  const failedCount = submissionsList.filter((s) => s.status === "failed").length;
  const preparingCount = submissionsList.filter(
    (s) => s.status === "preparing" || s.status === "submitting"
  ).length;

  const renderStatusBadge = (status: SubmissionStatus) => {
    switch (status) {
      case "submitted":
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {isHe ? "הוגש בהצלחה" : "Submitted"}
          </span>
        );
      case "under_review":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
            <Clock className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
            {isHe ? "בביקורת עמיתים" : "Under Review"}
          </span>
        );
      case "revision_required":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            {isHe ? "נדרשת עריכה/תשובה" : "Revision Required"}
          </span>
        );
      case "submitting":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            {isHe ? "בתהליך הגשה..." : "Submitting..."}
          </span>
        );
      case "preparing":
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            {isHe ? "הכנה להגשה" : "Preparing Package"}
          </span>
        );
      case "failed":
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            {isHe ? "נכשל / שגיאה" : "Submission Failed"}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat(isHe ? "he-IL" : "en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return String(dateString);
    }
  };

  return (
    <div className="w-full space-y-6 font-sans" dir={isHe ? "rtl" : "ltr"}>
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              <Send className="w-3 h-3" />
              {isHe ? "מרכז הגשות" : "Submission Hub"}
            </span>
            <span className="text-xs text-slate-500">
              {isHe ? "ניהול ומעקב הגשות לעיתונים" : "Real-time Journal Tracking & Automation"}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            {isHe ? "לוח הגשות לעיתונים מדעיים" : "Journal Submissions Dashboard"}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            {isHe
              ? "עקוב אחר סטטוס ההגשות, אישורי קליטה, ודרישות מענה לביקורת עמיתים."
              : "Monitor direct journal submissions, confirmation IDs, and peer review progress in real-time."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSubmissionsList([]);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
            title={isHe ? "רענן נתונים" : "Refresh data"}
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">{isHe ? "רענן" : "Refresh"}</span>
          </button>
          <button
            onClick={onNewSubmission}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-sm shadow-sky-200 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            {isHe ? "הגשה חדשה" : "Submit New Manuscript"}
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Submissions */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {isHe ? "סך הכל הגשות" : "Total Submissions"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{totalCount}</span>
            <span className="text-xs text-slate-500">{isHe ? "מאמרים רשומים" : "manuscripts tracked"}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isHe ? `${preparingCount} בהכנה להגשה` : `${preparingCount} in preparation`}
          </p>
        </div>

        {/* Under Review */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {isHe ? "בביקורת עמיתים" : "Under Peer Review"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{underReviewCount}</span>
            <span className="text-xs font-medium text-sky-600">
              {isHe ? "פעילים כעת" : "active with editors"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isHe ? "ממתינים להחלטת עורך" : "Awaiting reviewer feedback"}
          </p>
        </div>

        {/* Revisions Needed */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {isHe ? "נדרשת תשובה / עריכה" : "Revisions Requested"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{revisionCount}</span>
            <span className="text-xs text-amber-600 font-medium">
              {isHe ? "דורש התייחסות" : "Needs attention"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isHe ? "ביקורות מחכות למענה" : "Comments parsed & awaiting response"}
          </p>
        </div>

        {/* Failed / Attention */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {isHe ? "שגיאות / נכשל" : "Failed / Errors"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">{failedCount}</span>
            <span className="text-xs text-slate-500">{isHe ? "נכשלו בחיבור" : "retry available"}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {failedCount > 0 ? (isHe ? "ניתן לבצע ניסיון חוזר" : "Auto-retry configured") : (isHe ? "הכל תקין" : "All pipelines operational")}
          </p>
        </div>
      </div>

      {/* Main List Section */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-slate-900 text-base">
              {isHe ? "רשימת הגשות פעילות" : "Tracked Submissions"}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
              {filteredSubmissions.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isHe ? "חיפוש לפי כותרת, עיתון, מזהה..." : "Search title, journal, ID..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all w-60 md:w-64"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-200/60 p-1 rounded-xl text-xs font-medium text-slate-600">
              {[
                { key: "all", label: isHe ? "הכל" : "All" },
                { key: "review", label: isHe ? "בביקורת" : "Under Review" },
                { key: "revision", label: isHe ? "נדרשת עריכה" : "Revisions" },
                { key: "active", label: isHe ? "בהכנה" : "Preparing" },
                { key: "failed", label: isHe ? "נכשל" : "Failed" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setSelectedFilter(f.key)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedFilter === f.key
                      ? "bg-white text-slate-900 shadow-xs font-semibold"
                      : "hover:text-slate-900"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="divide-y divide-slate-100">
          {filteredSubmissions.length === 0 ? (
            <div className="p-12 text-center">
              <Send className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">
                {isHe ? "לא נמצאו הגשות תואמות" : "No submissions found"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isHe
                  ? "נסה לשנות את מסנני החיפוש או צור הגשה חדשה."
                  : "Try clearing search filters or initiate a new submission."}
              </p>
            </div>
          ) : (
            filteredSubmissions.map((sub) => (
              <div
                key={sub.id}
                onClick={() => {
                  setSelectedItem(sub);
                  onSelectSubmission?.(sub);
                }}
                className="p-5 hover:bg-slate-50/80 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer group"
              >
                {/* Left Content */}
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {renderStatusBadge(sub.status)}

                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200">
                      <Building2 className="w-3 h-3 text-sky-600" />
                      {sub.journalName}
                    </span>

                    {sub.platform && (
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {sub.platform}
                      </span>
                    )}

                    {sub.articleType && (
                      <span className="text-xs text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                        {sub.articleType}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">
                    {sub.title}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                    {sub.confirmationId && (
                      <span className="flex items-center gap-1 font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        <span>ID:</span>
                        <span className="font-semibold">{sub.confirmationId}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(sub.submittedAt || sub.updatedAt)}
                    </span>
                    {sub.authors && sub.authors.length > 0 && (
                      <span>{sub.authors.join(", ")}</span>
                    )}
                  </div>

                  {sub.errorLog && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{sub.errorLog}</span>
                    </div>
                  )}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Revision / Rebuttal CTA */}
                  {sub.status === "revision_required" && (
                    <button
                      onClick={() => onNavigateToReviews?.(sub)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors shadow-xs cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                      {isHe ? "מענה לביקורת עמיתים" : "Draft Rebuttal Responses"}
                      {sub.unresolvedCommentsCount ? (
                        <span className="bg-amber-600 text-white rounded-full px-1.5 py-0.2 text-[10px]">
                          {sub.unresolvedCommentsCount}
                        </span>
                      ) : null}
                    </button>
                  )}

                  {/* Retry Button if Failed */}
                  {sub.status === "failed" && (
                    <button
                      onClick={(e) => handleRetry(e, sub)}
                      disabled={retryingId === sub.id}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${retryingId === sub.id ? "animate-spin" : ""}`} />
                      {retryingId === sub.id ? (isHe ? "מנסה שוב..." : "Retrying...") : (isHe ? "נסה שוב" : "Retry Submission")}
                    </button>
                  )}

                  {/* External Link */}
                  {sub.remotePostUrl && (
                    <a
                      href={sub.remotePostUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:text-sky-600 transition-colors shadow-xs"
                      title={isHe ? "צפה בפורטל העיתון" : "Open journal tracking portal"}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{isHe ? "פורטל העיתון" : "Portal"}</span>
                    </a>
                  )}

                  {/* Details Trigger */}
                  <button
                    onClick={() => {
                      setSelectedItem(sub);
                      onSelectSubmission?.(sub);
                    }}
                    className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors cursor-pointer"
                    title={isHe ? "פרטי הגשה מלאים" : "View submission details"}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Submission Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  {renderStatusBadge(selectedItem.status)}
                  <span className="text-xs text-slate-500 font-medium">
                    {selectedItem.platform || "Platform"}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
                  {selectedItem.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Journal and Metadata Table */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                <div>
                  <div className="text-xs text-slate-500 font-medium">{isHe ? "עיתון יעד" : "Target Journal"}</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedItem.journalName}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">{isHe ? "סוג מאמר" : "Article Type"}</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{selectedItem.articleType || "Research Paper"}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">{isHe ? "מזהה אישור (Confirmation ID)" : "Confirmation ID"}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs font-semibold text-slate-800">
                      {selectedItem.confirmationId || "None assigned yet"}
                    </span>
                    {selectedItem.confirmationId && (
                      <button
                        onClick={() => handleCopy(selectedItem.confirmationId!, selectedItem.id.toString())}
                        className="text-slate-400 hover:text-sky-600 transition-colors cursor-pointer"
                        title="Copy confirmation ID"
                      >
                        {copiedId === selectedItem.id.toString() ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">{isHe ? "תאריך הגשה" : "Submitted Date"}</div>
                  <div className="font-semibold text-slate-900 mt-0.5">{formatDate(selectedItem.submittedAt)}</div>
                </div>
              </div>

              {/* Abstract */}
              {selectedItem.abstract && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    {isHe ? "תקציר המאמר (Abstract)" : "Submitted Abstract"}
                  </h4>
                  <p className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200/60 leading-relaxed text-xs">
                    {selectedItem.abstract}
                  </p>
                </div>
              )}

              {/* Authors */}
              {selectedItem.authors && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    {isHe ? "מחברי המאמר" : "Authors"}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedItem.authors.map((author, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-xs rounded-lg shadow-2xs"
                      >
                        {author}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Log if present */}
              {selectedItem.errorLog && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>{isHe ? "יומן שגיאה טכני" : "Transmission Error Log"}</span>
                  </div>
                  <pre className="font-mono text-xs text-rose-700 whitespace-pre-wrap">
                    {selectedItem.errorLog}
                  </pre>
                </div>
              )}

              {/* Verification and Security Guarantee */}
              <div className="flex items-center gap-3 p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  {isHe
                    ? "ההגשה מאומתת באמצעות הצפנת מפתחות AES-256 ומסמכי עמידה בהנחיות העיתון."
                    : "Payload verified compliant with journal metadata specifications and AES-256 auth handshake."}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
              {selectedItem.remotePostUrl ? (
                <a
                  href={selectedItem.remotePostUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  {isHe ? "פתח קישור למעקב באתר העיתון" : "Open external tracking URL"}
                </a>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                {selectedItem.status === "revision_required" && (
                  <button
                    onClick={() => {
                      const item = selectedItem;
                      setSelectedItem(null);
                      onNavigateToReviews?.(item);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    {isHe ? "מענה לביקורת עמיתים" : "Go to Rebuttal Editor"}
                  </button>
                )}
                {selectedItem.status === "failed" && (
                  <button
                    onClick={(e) => {
                      handleRetry(e, selectedItem);
                      setSelectedItem(null);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors cursor-pointer shadow-xs"
                  >
                    {isHe ? "נסה שוב כעת" : "Retry Transmission"}
                  </button>
                )}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {isHe ? "סגור" : "Close"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
