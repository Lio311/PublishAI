"use client";

import React, { useState } from "react";
import {
  FileText,
  Plus,
  Upload,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  MoreVertical,
  BookOpen,
  Send,
} from "lucide-react";
import { useLocale } from "next-intl";

export interface ManuscriptItem {
  id: string;
  title: string;
  journal: string;
  category: string;
  status: "draft" | "review" | "revision" | "accepted";
  updatedAt: string;
  wordCount: number;
  progress: number;
}

export interface DashboardStats {
  activeManuscripts?: number;
  reviewStatus?: string;
  citationsVerified?: number | string;
  publicationScore?: number | string;
}

export interface DashboardProps {
  userName?: string;
  manuscripts?: ManuscriptItem[];
  stats?: DashboardStats;
  onNewDocument?: () => void;
  onOpenDocument?: (id: string) => void;
  onImportDocument?: () => void;
}

export default function Dashboard({
  userName = "Researcher",
  manuscripts = [],
  stats,
  onNewDocument,
  onOpenDocument,
  onImportDocument,
}: DashboardProps) {
  const locale = useLocale();
  const isHe = locale === "he";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const filteredManuscripts = manuscripts.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.journal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedFilter === "all") return matchesSearch;
    return matchesSearch && item.status === selectedFilter;
  });

  // Calculate real metrics from the manuscripts list
  const activeCount = manuscripts.filter(
    (m) => m.status === "draft" || m.status === "revision" || m.status === "review"
  ).length;
  const reviewCount = manuscripts.filter((m) => m.status === "review").length;
  const revisionCount = manuscripts.filter((m) => m.status === "revision").length;
  const acceptedCount = manuscripts.filter((m) => m.status === "accepted").length;
  const totalWords = manuscripts.reduce((acc, m) => acc + (m.wordCount || 0), 0);
  const avgProgress =
    manuscripts.length > 0
      ? Math.round(manuscripts.reduce((acc, m) => acc + (m.progress || 0), 0) / manuscripts.length)
      : 0;

  const getStatusBadge = (status: ManuscriptItem["status"]) => {
    switch (status) {
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>{isHe ? "התקבל" : "Accepted"}</span>
          </span>
        );
      case "revision":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            <span>{isHe ? "נדרש תיקון" : "Revision Requested"}</span>
          </span>
        );
      case "review":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>{isHe ? "בשיפוט" : "Under Review"}</span>
          </span>
        );
      case "draft":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <FileText className="w-3 h-3 text-slate-500" />
            <span>{isHe ? "טיוטה" : "Draft"}</span>
          </span>
        );
    }
  };

  const filterTabs = [
    { id: "all", label: isHe ? "הכל" : "All" },
    { id: "draft", label: isHe ? "טיוטה" : "Draft" },
    { id: "review", label: isHe ? "בשיפוט" : "Review" },
    { id: "revision", label: isHe ? "תיקון" : "Revision" },
    { id: "accepted", label: isHe ? "התקבל" : "Accepted" },
  ];

  return (
    <div className="w-full space-y-8 font-sans" dir={isHe ? "rtl" : "ltr"}>
      {/* Top Header & Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              PublishAI MVP
            </span>
            <span className="text-xs text-slate-500">
              {isHe ? "מרכז פרסום מדעי אוטונומי" : "Autonomous Publication Hub"}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            {isHe ? `ברוך שובך, ${userName}` : `Welcome back, ${userName}`}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            {isHe
              ? "הכן, שפר והגש את כתבי היד המדעיים שלך באמצעות אינטליגנציית ביקורת עמיתים מבוססת סוכנים."
              : "Prepare, polish, and submit your research manuscripts with agentic peer-review intelligence."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onImportDocument}
            aria-label={isHe ? "ייבוא קובץ" : "Import document"}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all shadow-xs cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>{isHe ? "ייבוא (.docx / .pdf)" : "Import (.docx / .pdf)"}</span>
          </button>
          <button
            type="button"
            onClick={onNewDocument}
            aria-label={isHe ? "מאמר חדש" : "New Manuscript"}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-xl hover:bg-sky-700 transition-all shadow-xs shadow-sky-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isHe ? "מאמר חדש" : "New Manuscript"}</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Manuscripts */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {isHe ? "מאמרים פעילים" : "Active Manuscripts"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {stats?.activeManuscripts ?? activeCount}
            </span>
            {activeCount > 0 && (
              <span className="text-xs font-medium text-emerald-600 flex items-center">
                <TrendingUp className="w-3 h-3 mr-0.5 rtl:ml-0.5" />
                {isHe ? `${activeCount} בתהליך` : `${activeCount} in flow`}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {manuscripts.length > 0
              ? isHe
                ? `${acceptedCount} התקבלו · ${activeCount} בעבודה`
                : `${acceptedCount} accepted · ${activeCount} in progress`
              : isHe
                ? "אין עדיין מאמרים במערכת"
                : "No active manuscripts yet"}
          </p>
        </div>

        {/* Card 2: Peer Review Status */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {isHe ? "סטטוס ביקורת עמיתים" : "Peer Review Status"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {stats?.reviewStatus ??
                (revisionCount > 0
                  ? isHe
                    ? `${revisionCount} נדרש תיקון`
                    : `${revisionCount} Revision${revisionCount !== 1 ? "s" : ""}`
                  : reviewCount > 0
                    ? isHe
                      ? `${reviewCount} בשיפוט`
                      : `${reviewCount} Under Review`
                    : isHe
                      ? "הכל מעודכן"
                      : "Up to Date")}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {manuscripts.length > 0
              ? isHe
                ? `${reviewCount} בשיפוט · ${revisionCount} לתיקון`
                : `${reviewCount} under review · ${revisionCount} awaiting revision`
              : isHe
                ? "העלה מאמר כדי להתחיל בשיפוט"
                : "Upload manuscript to begin review"}
          </p>
        </div>

        {/* Card 3: Indexed Words / Citations */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {isHe ? "היקף מילים ומחקר" : "Word Count & Scope"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {stats?.citationsVerified ?? totalWords.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-indigo-600">
              {isHe ? "מילים מאומתות" : "Indexed Words"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {manuscripts.length > 0
              ? isHe
                ? `ב-${manuscripts.length} כתבי יד`
                : `Across ${manuscripts.length} manuscript${manuscripts.length !== 1 ? "s" : ""}`
              : isHe
                ? "0 מילים רשומות במערכת"
                : "No words indexed yet"}
          </p>
        </div>

        {/* Card 4: Publication Readiness */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {isHe ? "ציון מוכנות לפרסום" : "Publication Readiness"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {stats?.publicationScore ?? (manuscripts.length > 0 ? `${avgProgress}%` : "—")}
            </span>
            <span className="text-xs font-medium text-emerald-600">
              {manuscripts.length > 0
                ? avgProgress >= 80
                  ? isHe
                    ? "סיכוי קבלה גבוה"
                    : "High Acceptance"
                  : avgProgress >= 50
                    ? isHe
                      ? "התקדמות טובה"
                      : "Good Progress"
                    : isHe
                      ? "בשלבי גיבוש"
                      : "Early Phase"
                : isHe
                  ? "טרם נותח"
                  : "Not Evaluated"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {manuscripts.length > 0
              ? isHe
                ? "התאמה לסגנון ודרישות כתב העת"
                : "Compliance & completeness verified"
              : isHe
                ? "העלה מאמר כדי לקבל הערכת AI"
                : "Upload to compute AI score"}
          </p>
        </div>
      </div>

      {/* Main Content Area: Manuscripts List & Filter */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900 text-lg">
              {isHe ? "כתבי היד שלי" : "My Manuscripts"}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
              {filteredManuscripts.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={isHe ? "חיפוש כותרת, כתב עת, תגית..." : "Search title, journal, tag..."}
                aria-label={isHe ? "חיפוש מאמרים" : "Search manuscripts"}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 rtl:pl-3 rtl:pr-9 py-1.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all w-56 md:w-64"
              />
            </div>

            {/* Filter Tabs */}
            <div
              role="tablist"
              aria-label={isHe ? "סינון מאמרים" : "Filter manuscripts"}
              className="flex items-center bg-slate-200/60 p-1 rounded-xl text-xs font-medium text-slate-600"
            >
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={selectedFilter === tab.id}
                  onClick={() => setSelectedFilter(tab.id)}
                  className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                    selectedFilter === tab.id
                      ? "bg-white text-slate-900 shadow-xs font-semibold"
                      : "hover:text-slate-900"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Manuscripts Table/List */}
        <div className="divide-y divide-slate-100">
          {filteredManuscripts.length === 0 ? (
            <div className="p-12 text-center" role="status" aria-live="polite">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">
                {isHe ? "לא נמצאו כתבי יד" : "No manuscripts found"}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isHe
                  ? "נסה לשנות את תנאי החיפוש או צור מאמר חדש."
                  : "Try adjusting your search criteria or create a new paper."}
              </p>
              {onNewDocument && (
                <button
                  type="button"
                  onClick={onNewDocument}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isHe ? "צור מאמר חדש" : "Create New Paper"}</span>
                </button>
              )}
            </div>
          ) : (
            filteredManuscripts.map((item) => (
              <div
                key={item.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(item.status)}
                    <span className="text-xs font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                      {item.journal}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{item.category}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenDocument?.(item.id)}
                    className="text-left rtl:text-right text-base font-semibold text-slate-900 hover:text-sky-600 transition-colors cursor-pointer block"
                  >
                    {item.title}
                  </button>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{item.wordCount.toLocaleString()} {isHe ? "מילים" : "words"}</span>
                    <span>•</span>
                    <span>{isHe ? `עודכן ${item.updatedAt}` : `Updated ${item.updatedAt}`}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      {isHe ? `השלמה: ${item.progress}%` : `Completion: ${item.progress}%`}
                    </span>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenDocument?.(item.id)}
                    aria-label={isHe ? `פתח עורך עבור ${item.title}` : `Open editor for ${item.title}`}
                    className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs cursor-pointer"
                  >
                    {isHe ? "פתח עורך" : "Open Editor"}
                  </button>
                  <button
                    type="button"
                    title={isHe ? "פעולות נוספות" : "Quick actions"}
                    aria-label={isHe ? "פעולות נוספות" : "Quick actions"}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Features & Agent Status Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-linear-to-br from-sky-50 to-blue-50/40 border border-sky-100 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-sky-800 font-semibold text-sm mb-2">
            <Sparkles className="w-4 h-4 text-sky-600 shrink-0" />
            <span>{isHe ? "שותף כתיבה AI ואינטגרציה" : "AI Co-Author & Synthesis"}</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isHe
              ? "יצירת פרקי מאמר עם שיוך ציטוטים מדויק ל-PubMed, Crossref ומאגרי פרה-פרינט אקדמיים."
              : "Generate manuscript sections with inline citation binding to PubMed, Crossref, and preprint databases."}
          </p>
        </div>

        <div className="bg-linear-to-br from-amber-50 to-orange-50/40 border border-amber-100 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm mb-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{isHe ? "ביקורת עמיתים אוטונומית" : "Automated Peer Reviewer"}</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isHe
              ? "סימולציית ביקורת עמיתים מחמירה, חשיפת פערים לוגיים וניסוח מענה נקודה-אחר-נקודה."
              : "Simulate harsh peer reviewer critiques, uncover logical gaps, and draft point-by-point rebuttal responses."}
          </p>
        </div>

        <div className="bg-linear-to-br from-emerald-50 to-teal-50/40 border border-emerald-100 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm mb-2">
            <Send className={`w-4 h-4 text-emerald-600 shrink-0 ${isHe ? "rotate-180" : ""}`} />
            <span>{isHe ? "הגשה בלחיצת כפתור לכתב עת" : "One-Click Journal Submission"}</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {isHe
              ? "התאמת פורמט המאמר, מבנה ההפניות וקבצי העזר להנחיות כתב העת הנבחר."
              : "Auto-format manuscript style, references, and supplementary files to match target journal author guidelines."}
          </p>
        </div>
      </div>
    </div>
  );
}
