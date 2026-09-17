"use client";

import React, { useState, useEffect } from "react";
import SubmissionDashboard, {
  SubmissionItem,
} from "@/components/SubmissionDashboard";
import ReviewResponseInterface, {
  ReviewerCommentData,
} from "@/components/ReviewResponseInterface";
import { Send, MessageSquare, ArrowLeft, ExternalLink, Sparkles } from "lucide-react";

interface SubmissionsClientProps {
  locale: string;
}

export default function SubmissionsClient({ locale }: SubmissionsClientProps) {
  const isHe = locale === "he";
  const [activeTab, setActiveTab] = useState<"submissions" | "reviews">("submissions");
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedSubmissionForReview, setSelectedSubmissionForReview] = useState<{
    paperTitle: string;
    journalName: string;
    manuscriptId: string;
  }>({
    paperTitle: "",
    journalName: "",
    manuscriptId: "",
  });

  // Attempt to fetch submissions from the backend API, falling back to rich mock data
  useEffect(() => {
    let isMounted = true;
    async function loadSubmissions() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/submissions");
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.submissions) && data.submissions.length > 0 && isMounted) {
            const mapped: SubmissionItem[] = data.submissions.map((s: any) => ({
              id: s.id,
              paperId: s.paperId,
              title: s.paperTitle || s.title || `Paper #${s.paperId}`,
              journalName: s.journalName || s.siteUrl || "Connected Journal",
              platform: s.platform || "Direct Submission",
              status: s.status || "submitted",
              publishMode: s.publishMode || "publish",
              submittedAt: s.createdAt,
              updatedAt: s.updatedAt,
              remotePostUrl: s.remotePostUrl,
              confirmationId: s.confirmationId || (s.remotePostId ? `CONF-${s.remotePostId}` : undefined),
              errorLog: s.errorLog,
            }));
            // Merge with mock submissions to guarantee rich presentation
            setSubmissions(mapped);
          }
        }
      } catch (err) {
        console.warn("Could not fetch API submissions, using default data.", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSubmissions();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleNavigateToReviews = (sub: SubmissionItem) => {
    setSelectedSubmissionForReview({
      paperTitle: sub.title,
      journalName: sub.journalName,
      manuscriptId: sub.confirmationId || `SUB-${sub.id}`,
    });
    setActiveTab("reviews");
  };

  return (
    <div className="space-y-6">
      {/* Top Tab Navigator */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-4">
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab("submissions")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "submissions"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Send className="w-4 h-4 text-sky-600" />
            <span>{isHe ? "לוח הגשות" : "Submissions Tracker"}</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-200 text-slate-700">
              {submissions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("reviews")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              activeTab === "reviews"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-amber-600" />
            <span>{isHe ? "מענה לביקורת עמיתים" : "Reviewer Rebuttal & Responses"}</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-bold">
              4
            </span>
          </button>
        </div>

        {activeTab === "reviews" && (
          <button
            onClick={() => setActiveTab("submissions")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-sky-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isHe ? "חזרה ללוח ההגשות" : "Back to Submissions"}</span>
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === "submissions" ? (
        <SubmissionDashboard
          submissions={submissions}
          onNavigateToReviews={handleNavigateToReviews}
          locale={locale}
        />
      ) : (
        <ReviewResponseInterface
          paperTitle={selectedSubmissionForReview.paperTitle}
          journalName={selectedSubmissionForReview.journalName}
          manuscriptId={selectedSubmissionForReview.manuscriptId}
          locale={locale}
        />
      )}
    </div>
  );
}
