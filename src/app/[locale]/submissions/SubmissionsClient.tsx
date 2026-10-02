"use client";

import React, { useState, useCallback } from "react";
import { useLoadable } from "@/hooks/useLoadable";
import SubmissionDashboard, { SubmissionItem, toSubmissionItem } from "@/components/SubmissionDashboard";
import ReviewResponseInterface from "@/components/ReviewResponseInterface";
import { SubmissionWizard } from "@/components/submission/SubmissionWizard";
import { Send, MessageSquare, ArrowLeft, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SubmissionDto } from "@/types/api";

interface SubmissionsClientProps {
  locale: string;
}

export default function SubmissionsClient({ locale }: SubmissionsClientProps) {
  const t = useTranslations("Submissions");
  const [activeTab, setActiveTab] = useState<"submissions" | "reviews">("submissions");
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

  const loadSubmissions = useCallback(async (signal: AbortSignal): Promise<SubmissionItem[]> => {
    const res = await fetch("/api/submissions", { signal });
    if (!res.ok) throw new Error(`Could not fetch submissions (${res.status})`);
    const data = await res.json();
    const rawList: SubmissionDto[] = Array.isArray(data) ? data : (data?.submissions || []);
    return rawList.map(toSubmissionItem);
  }, []);
  const { data, loading: isLoading, reload: reloadSubmissions } = useLoadable(loadSubmissions);
  const submissions = data ?? [];

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
            <span>{t("title")}</span>
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
            <span>{t("reviewsTab")}</span>
          </button>
        </div>

        {activeTab === "reviews" && (
          <button
            onClick={() => setActiveTab("submissions")}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-sky-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            <span>{t("backToSubmissions")}</span>
          </button>
        )}
      </div>

      {/* Tab Contents */}
      {activeTab === "submissions" && isLoading && submissions.length === 0 ? (
        <div className="flex justify-center py-16" role="status">
          <Loader2 className="w-6 h-6 animate-spin text-sky-500" aria-hidden="true" />
          <span className="sr-only">{t("loading")}</span>
        </div>
      ) : activeTab === "submissions" ? (
        <SubmissionDashboard
          submissions={submissions}
          onNavigateToReviews={handleNavigateToReviews}
          onNewSubmission={() => setShowWizard(true)}
          onRefresh={reloadSubmissions}
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
                reloadSubmissions();
              }}
              onCancel={() => setShowWizard(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
