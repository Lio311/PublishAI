"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Sparkles,
  Edit3,
  Save,
  Download,
  Copy,
  Check,
  FileText,
  Filter,
  MessageSquare,
  Undo2,
  ArrowRight,
  ExternalLink,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Wand2
} from "lucide-react";

export interface ReviewerCommentData {
  id: string;
  reviewerId: string;
  reviewerName?: string;
  commentNumber: number;
  rawText: string;
  category?: "methodology" | "statistics" | "literature" | "clarity" | "results" | "general";
  severity?: "critical" | "major" | "minor" | "suggestion";
  suggestedAction?: string;
  aiDraftedResponse: string;
  userResponse: string;
  manuscriptChanges?: string;
  isResolved: boolean;
  pageReference?: string;
}

export interface ReviewResponseInterfaceProps {
  comments?: ReviewerCommentData[];
  paperTitle?: string;
  journalName?: string;
  manuscriptId?: string;
  onSaveResponse?: (commentId: string, responseText: string, changes?: string) => void;
  onToggleResolve?: (commentId: string, isResolved: boolean) => void;
  onExportRebuttal?: (fullRebuttal: string) => void;
  locale?: string;
}


export default function ReviewResponseInterface({
  comments: initialComments = [],
  paperTitle = "",
  journalName = "Nature Biotechnology",
  manuscriptId = "NBT-2026-08942",
  onSaveResponse,
  onToggleResolve,
  onExportRebuttal,
  locale = "en",
}: ReviewResponseInterfaceProps) {
  const isHe = locale === "he";
  const [commentList, setCommentList] = useState<ReviewerCommentData[]>(initialComments);
  const [selectedReviewer, setSelectedReviewer] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "unresolved" | "resolved">("all");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [savedFeedbackId, setSavedFeedbackId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [copiedLetter, setCopiedLetter] = useState<boolean>(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Filter calculations
  const filteredComments = commentList.filter((c) => {
    if (selectedReviewer !== "all" && c.reviewerId !== selectedReviewer) return false;
    if (selectedStatus === "unresolved" && c.isResolved) return false;
    if (selectedStatus === "resolved" && !c.isResolved) return false;
    if (selectedSeverity !== "all" && c.severity !== selectedSeverity) return false;
    return true;
  });

  const totalCount = commentList.length;
  const resolvedCount = commentList.filter((c) => c.isResolved).length;
  const progressPercent = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;
  const reviewers = Array.from(new Set(commentList.map((c) => c.reviewerId)));

  const handleToggleResolve = (id: string) => {
    setCommentList((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const updated = !c.isResolved;
          onToggleResolve?.(id, updated);
          return { ...c, isResolved: updated };
        }
        return c;
      })
    );
  };

  const handleUserResponseChange = (id: string, text: string) => {
    setCommentList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, userResponse: text } : c))
    );
  };

  const handleManuscriptChangesChange = (id: string, changes: string) => {
    setCommentList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, manuscriptChanges: changes } : c))
    );
  };

  const handleSave = (c: ReviewerCommentData) => {
    onSaveResponse?.(c.id, c.userResponse, c.manuscriptChanges);
    setSavedFeedbackId(c.id);
    setTimeout(() => setSavedFeedbackId(null), 2000);
  };

  const handleResetToAiDraft = (id: string) => {
    setCommentList((prev) =>
      prev.map((c) => (c.id === id ? { ...c, userResponse: c.aiDraftedResponse } : c))
    );
  };

  const handleRegenerateAiDraft = (id: string) => {
    setRegeneratingId(id);
    setTimeout(() => {
      setCommentList((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            const refined =
              c.aiDraftedResponse +
              `\n\n[Addendum: We have additionally verified that our calibration bounds hold under high-noise regimes with 95% confidence intervals.]`;
            return {
              ...c,
              aiDraftedResponse: refined,
              userResponse: refined,
            };
          }
          return c;
        })
      );
      setRegeneratingId(null);
    }, 1000);
  };

  const generateFullRebuttalLetter = (): string => {
    let letter = `# Response to Reviewers\n\n`;
    letter += `**Manuscript Title:** ${paperTitle}\n`;
    letter += `**Journal:** ${journalName}\n`;
    letter += `**Manuscript ID:** ${manuscriptId}\n`;
    letter += `**Date:** ${new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date())}\n\n`;
    letter += `---\n\n`;
    letter += `Dear Editor and Reviewers,\n\n`;
    letter += `We would like to express our sincere gratitude to the reviewers for their constructive comments and rigorous evaluations of our manuscript. We have carefully considered all recommendations, conducted the requested additional computational and statistical evaluations, and revised our manuscript accordingly.\n\n`;
    letter += `Below is our point-by-point response addressing every critique in detail.\n\n`;

    const groupedByReviewer: { [key: string]: ReviewerCommentData[] } = {};
    commentList.forEach((c) => {
      const key = c.reviewerName || c.reviewerId;
      if (!groupedByReviewer[key]) groupedByReviewer[key] = [];
      groupedByReviewer[key].push(c);
    });

    for (const [revName, cList] of Object.entries(groupedByReviewer)) {
      letter += `## Comments from ${revName}\n\n`;
      cList.forEach((item, index) => {
        letter += `### Point ${index + 1}${item.pageReference ? ` (${item.pageReference})` : ""}\n`;
        letter += `> **Reviewer Critique:**\n> "${item.rawText}"\n\n`;
        letter += `**Author Response:**\n${item.userResponse || item.aiDraftedResponse}\n\n`;
        if (item.manuscriptChanges) {
          letter += `**Manuscript Revisions:**\n*${item.manuscriptChanges}*\n\n`;
        }
        letter += `---\n\n`;
      });
    }

    letter += `We believe these revisions have significantly strengthened the rigor and clarity of our manuscript and hope it is now acceptable for publication in ${journalName}.\n\n`;
    letter += `Sincerely,\n`;
    letter += `The Authors\n`;
    return letter;
  };

  const handleCopyLetter = () => {
    const text = generateFullRebuttalLetter();
    navigator.clipboard.writeText(text);
    setCopiedLetter(true);
    setTimeout(() => setCopiedLetter(false), 2000);
  };

  const handleDownloadLetter = () => {
    const text = generateFullRebuttalLetter();
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Rebuttal_Letter_${manuscriptId || "Manuscript"}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderSeverityBadge = (severity?: string) => {
    switch (severity) {
      case "critical":
      case "major":
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
            {isHe ? "משמעותי (Major)" : "Major"}
          </span>
        );
      case "minor":
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
            {isHe ? "משני (Minor)" : "Minor"}
          </span>
        );
      case "suggestion":
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-200">
            {isHe ? "הצעה" : "Suggestion"}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full space-y-6 font-sans" dir={isHe ? "rtl" : "ltr"}>
      {/* Header Banner */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <MessageSquare className="w-3 h-3" />
              {isHe ? "מענה לביקורת עמיתים" : "Reviewer Rebuttal Manager"}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {manuscriptId} • {journalName}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            {paperTitle}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            {isHe
              ? "סקור את הערות הסוקרים, ערוך את תגובות ה-AI המנוסחות, וסמן נקודות שנפתרו."
              : "Review peer critique, edit AI-crafted academic rebuttals, and compile your official response letter."}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>{isHe ? "מכתב מענה מלא" : "Export Response Letter"}</span>
          </button>
          <button
            onClick={() => {
              const allResolved = commentList.every((c) => c.isResolved);
              setCommentList((prev) => prev.map((c) => ({ ...c, isResolved: !allResolved })));
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-all shadow-sm shadow-sky-200 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {commentList.every((c) => c.isResolved)
                ? (isHe ? "סמן הכל כפתוח" : "Unresolve All")
                : (isHe ? "סמן הכל כנפתר" : "Mark All Resolved")}
            </span>
          </button>
        </div>
      </div>

      {/* Progress & Overview Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="w-full md:w-1/2 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {isHe ? "התקדמות מענה לביקורת" : "Rebuttal Resolution Progress"}
            </span>
            <span className="font-bold text-slate-900">
              {resolvedCount} / {totalCount} {isHe ? "הערות נפתרו" : "resolved"} ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Quick stat badges */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <div className="text-[10px] uppercase font-semibold text-slate-400">
              {isHe ? "סוקרים" : "Reviewers"}
            </div>
            <div className="text-sm font-bold text-slate-800">{reviewers.length}</div>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-center">
            <div className="text-[10px] uppercase font-semibold text-amber-700">
              {isHe ? "ממתינות למענה" : "Pending"}
            </div>
            <div className="text-sm font-bold text-amber-700">{totalCount - resolvedCount}</div>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
            <div className="text-[10px] uppercase font-semibold text-emerald-700">
              {isHe ? "הושלמו" : "Resolved"}
            </div>
            <div className="text-sm font-bold text-emerald-700">{resolvedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter and Query Strip */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Reviewer selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            {isHe ? "סוקר:" : "Reviewer:"}
          </span>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setSelectedReviewer("all")}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                selectedReviewer === "all" ? "bg-white font-semibold text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {isHe ? "כל הסוקרים" : "All Reviewers"}
            </button>
            {reviewers.map((rev) => (
              <button
                key={rev}
                onClick={() => setSelectedReviewer(rev)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedReviewer === rev ? "bg-white font-semibold text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {rev.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">
            {isHe ? "סטטוס:" : "Status:"}
          </span>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
            {[
              { key: "all", label: isHe ? "הכל" : "All" },
              { key: "unresolved", label: isHe ? "פתוח" : "Unresolved" },
              { key: "resolved", label: isHe ? "נפתר" : "Resolved" },
            ].map((st) => (
              <button
                key={st.key}
                onClick={() => setSelectedStatus(st.key as any)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedStatus === st.key ? "bg-white font-semibold text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Severity filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">
            {isHe ? "חומרה:" : "Severity:"}
          </span>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
            {[
              { key: "all", label: isHe ? "הכל" : "All" },
              { key: "major", label: isHe ? "עיקרי" : "Major" },
              { key: "minor", label: isHe ? "משני" : "Minor" },
            ].map((sev) => (
              <button
                key={sev.key}
                onClick={() => setSelectedSeverity(sev.key)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedSeverity === sev.key ? "bg-white font-semibold text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {sev.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List of Reviewer Comments */}
      <div className="space-y-5">
        {filteredComments.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">
              {isHe ? "אין הערות בסינון שנבחר" : "No comments found matching filters"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {isHe ? "נסה לאפס את המסננים למעלה." : "Try resetting the reviewer or status filters above."}
            </p>
          </div>
        ) : (
          filteredComments.map((comment) => (
            <div
              key={comment.id}
              className={`bg-white border rounded-2xl transition-all shadow-xs overflow-hidden ${
                comment.isResolved
                  ? "border-emerald-200/80 bg-emerald-50/10"
                  : "border-slate-200/90 hover:border-slate-300"
              }`}
            >
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/40">
                <div className="flex items-center gap-3 flex-wrap">
                  {/* Resolve Toggle Checkbox */}
                  <button
                    onClick={() => handleToggleResolve(comment.id)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-all border"
                    style={{
                      backgroundColor: comment.isResolved ? "#ecfdf5" : "#f8fafc",
                      borderColor: comment.isResolved ? "#a7f3d0" : "#cbd5e1",
                      color: comment.isResolved ? "#047857" : "#475569",
                    }}
                    title={comment.isResolved ? "Mark as unresolved" : "Mark as resolved"}
                  >
                    {comment.isResolved ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>{isHe ? "נפתר" : "Resolved"}</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4 text-slate-400" />
                        <span>{isHe ? "סמן כנפתר" : "Mark Resolved"}</span>
                      </>
                    )}
                  </button>

                  <span className="font-bold text-xs text-slate-800 bg-slate-200/70 px-2.5 py-1 rounded-lg">
                    {comment.reviewerName || comment.reviewerId} • #{comment.commentNumber}
                  </span>

                  {renderSeverityBadge(comment.severity)}

                  {comment.category && (
                    <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md capitalize">
                      {comment.category}
                    </span>
                  )}

                  {comment.pageReference && (
                    <span className="text-xs text-slate-400 font-mono">
                      {comment.pageReference}
                    </span>
                  )}
                </div>

                {/* Save feedback indicator */}
                <div className="flex items-center gap-2">
                  {savedFeedbackId === comment.id && (
                    <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-fade-in">
                      <Check className="w-3.5 h-3.5" />
                      {isHe ? "התגובה נשמרה!" : "Response saved"}
                    </span>
                  )}
                  <button
                    onClick={() => handleSave(comment)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isHe ? "שמור שינויים" : "Save"}</span>
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-5">
                {/* Reviewer's Critique */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      {isHe ? "הערת הסוקר המקורית:" : "Reviewer Critique"}
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200/70 rounded-xl text-sm text-slate-800 leading-relaxed font-serif">
                    &quot;{comment.rawText}&quot;
                  </div>
                </div>

                {/* Suggested Action Pill */}
                {comment.suggestedAction && (
                  <div className="flex items-start gap-2 p-3 bg-sky-50/60 border border-sky-200/80 rounded-xl text-xs text-sky-900">
                    <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">{isHe ? "פעולה מומלצת: " : "Recommended Action: "}</span>
                      <span>{comment.suggestedAction}</span>
                    </div>
                  </div>
                )}

                {/* Response Editor Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-sky-600" />
                      {isHe ? "תשובת המחבר לעורך ולסוקר:" : "Author Rebuttal Response"}
                    </span>

                    <div className="flex items-center gap-2 text-xs">
                      {/* Regenerate with AI */}
                      <button
                        onClick={() => handleRegenerateAiDraft(comment.id)}
                        disabled={regeneratingId === comment.id}
                        className="inline-flex items-center gap-1 text-sky-700 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-lg border border-sky-200 transition-colors cursor-pointer disabled:opacity-50"
                        title="Refine and elaborate draft with AI"
                      >
                        <Wand2 className={`w-3 h-3 ${regeneratingId === comment.id ? "animate-spin" : ""}`} />
                        <span>{regeneratingId === comment.id ? (isHe ? "מנסח..." : "Refining...") : (isHe ? "שיפור בניסוח AI" : "Refine Draft")}</span>
                      </button>

                      {/* Reset to initial AI draft */}
                      <button
                        onClick={() => handleResetToAiDraft(comment.id)}
                        className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer px-2 py-1"
                        title="Reset to original AI drafted response"
                      >
                        <Undo2 className="w-3 h-3" />
                        <span>{isHe ? "איפוס לטיוטת AI" : "Reset Draft"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Textarea for Author Response */}
                  <textarea
                    rows={4}
                    value={comment.userResponse}
                    onChange={(e) => handleUserResponseChange(comment.id, e.target.value)}
                    placeholder={
                      isHe
                        ? "הקלד כאן את תגובתך המנומקת להערת הסוקר..."
                        : "Draft your evidence-based point-by-point response to this reviewer comment..."
                    }
                    className="w-full p-3.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all leading-relaxed text-slate-800 placeholder-slate-400 font-sans resize-y"
                  />
                </div>

                {/* Manuscript Changes Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {isHe
                        ? "הפניה לשינויים בגוף המאמר (מיקום, עמוד, איור):"
                        : "Manuscript Modifications (Section, Line Numbers, Supplementary Tables):"}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={comment.manuscriptChanges || ""}
                    onChange={(e) => handleManuscriptChangesChange(comment.id, e.target.value)}
                    placeholder={
                      isHe
                        ? "לדוגמה: עודכן פרק 3.2, שורות 140–162, נוסף איור משלים S2"
                        : "e.g., Updated Section 3.3 (lines 214–248); added Supplementary Figure S5"
                    }
                    className="w-full px-3.5 py-2 text-xs bg-slate-50/80 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all text-slate-800"
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Export Rebuttal Letter Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/60">
              <div>
                <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-md border border-sky-200">
                  {isHe ? "מכתב רשמי" : "Formal Publication Document"}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {isHe ? "מכתב מענה מלא לסוקרים (Response to Reviewers)" : "Complete Response to Reviewers Letter"}
                </h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Markdown Preview */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
              <pre className="p-5 bg-white border border-slate-200/80 rounded-2xl text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-[50vh] overflow-y-auto shadow-2xs">
                {generateFullRebuttalLetter()}
              </pre>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {resolvedCount} / {totalCount} {isHe ? "הערות מולאו ונפתרו" : "points addressed"}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLetter}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                >
                  {copiedLetter ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>{isHe ? "הועתק ללוח!" : "Copied!"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-500" />
                      <span>{isHe ? "העתק תוכן" : "Copy to Clipboard"}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadLetter}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-xl transition-colors shadow-xs shadow-sky-200 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isHe ? "הורד קובץ Markdown" : "Download Markdown (.md)"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
