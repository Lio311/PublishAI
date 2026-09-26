"use client";

import React, { useState, useEffect, useCallback } from "react";
import SubmissionDashboard, {
  SubmissionItem,
} from "@/components/SubmissionDashboard";
import ReviewResponseInterface, {
  ReviewerCommentData,
} from "@/components/ReviewResponseInterface";
import { SubmissionWizard } from "@/components/submission/SubmissionWizard";
import { Send, MessageSquare, ArrowLeft, ExternalLink, Sparkles, X } from "lucide-react";

interface SubmissionsClientProps {
  locale: string;
}

export default function SubmissionsClient({ locale }: SubmissionsClientProps) {
  const isHe = locale === "he";
  const [activeTab, setActiveTab] = useState<"submissions" | "reviews">("submissions");
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showWizard, setShowWizard] = useState<boolean>(false);
  const [selectedSubmissionForReview, setSelectedSubmissionForReview] = useState<{
    paperTitle: string;
    journalName: string;
    manuscriptId: string;
  }>({
    paperTitle: "",
    journalName: "",
    manuscriptId: "",
  });

  const loadSubmissions = useCallback(async (isMounted = true) => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/submissions");
      if (res.ok) {
        const data = await res.json();
        const rawList = Array.isArray(data) ? data : (data?.submissions || []);
        if (isMounted) {
          const mapped: SubmissionItem[] = rawList.map((s: any) => ({
            id: s.id,
            paperId: s.paperId,
            title: s.submittedTitle || s.paperTitle || s.title || `Paper #${s.paperId}`,
            journalName: s.journalName || s.connection?.displayName || s.siteUrl || "Connected Journal",
            platform: s.platform || s.connection?.platform || "Direct Submission",
            status: s.status || "submitted",
            publishMode: s.publishMode || "publish",
            submittedAt: s.submittedAt || s.createdAt,
            updatedAt: s.updatedAt,
            remotePostUrl: s.remotePostUrl,
            confirmationId: s.confirmationId || (s.remotePostId ? `CONF-${s.remotePostId}` : undefined),
            errorLog: s.errorLog,
          }));
          setSubmissions(mapped);
        }
      }
    } catch (err) {
      console.warn("Could not fetch API submissions:", err);
    } finally {
      if (isMounted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadSubmissions(isMounted);
    return () => {
      isMounted = false;
    };
  }, [loadSubmissions]);

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
          onNewSubmission={() => setShowWizard(true)}
          onRefresh={() => loadSubmissions()}
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

      {/* Submission Wizard Modal */}
      {showWizard && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          onClick={() => setShowWizard(false)}
        >
          <div 
            className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <SubmissionWizard
              onComplete={() => {
                setShowWizard(false);
                loadSubmissions();
              }}
              onCancel={() => setShowWizard(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
