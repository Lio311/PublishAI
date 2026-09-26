"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { SecurityBriefing } from "./SecurityBriefing";
import { ConnectionForm } from "./ConnectionForm";
import SubmissionProgressBar from "./SubmissionProgressBar";
import { Loader2, ExternalLink, RefreshCw, Send, CheckCircle2, AlertCircle, ArrowDownRight, ArrowLeft } from "lucide-react";

interface SubmissionPanelProps {
  paperId: number;
}

export function SubmissionPanel({ paperId }: SubmissionPanelProps) {
  const t = useTranslations("submission");
  const locale = useLocale();
  const isHe = locale === "he";
  const [step, setStep] = useState<"briefing" | "list" | "form" | "confirm" | "progress">("list");
  const [connections, setConnections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
  const [cascadingId, setCascadingId] = useState<number | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [activeSubmission, setActiveSubmission] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const fetchConnections = useCallback(async (isMounted = true) => {
    try {
      const res = await fetch("/api/journal-connection");
      if (!isMounted) return;
      if (res.ok) {
        const data = await res.json();
        setConnections(Array.isArray(data) ? data : data?.connections || []);
      } else {
        console.warn("Could not fetch journal connections:", res.status);
      }
    } catch (err) {
      if (isMounted) console.error("Error fetching connections:", err);
    } finally {
      if (isMounted) setIsLoading(false);
    }
  }, []);

  const fetchSubmissions = useCallback(async (isMounted = true) => {
    try {
      const res = await fetch("/api/submissions");
      if (!isMounted) return;
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.submissions || [];
        const filtered = list.filter((s: any) => s.paperId === paperId);
        setSubmissions(filtered);
        
        // Update active submission if in progress view
        if (filtered.length > 0) {
          setActiveSubmission((prev: any) => {
            if (!prev) return filtered[0];
            return filtered.find((s: any) => s.id === prev.id) || filtered[0];
          });
        }
      }
    } catch (e) {
      if (isMounted) console.error("Error fetching submissions:", e);
    }
  }, [paperId]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);

    Promise.all([
      fetchConnections(isMounted),
      fetchSubmissions(isMounted)
    ]).finally(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [paperId, fetchConnections, fetchSubmissions]);

  // Polling when in progress view and submission is active
  useEffect(() => {
    if (step !== "progress" || !activeSubmission?.id) return;
    if (["submitted", "failed", "rejected", "accepted"].includes(activeSubmission.status)) return;

    const interval = setInterval(() => {
      fetchSubmissions();
    }, 4000);

    return () => clearInterval(interval);
  }, [step, activeSubmission?.id, activeSubmission?.status, fetchSubmissions]);

  const handleCascade = async (submissionId: number) => {
    setCascadingId(submissionId);
    setErrorMessage(null);
    setFeedbackMessage(null);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/cascade`, { method: "POST" });
      let data: any = null;
      try {
        data = await res.json();
      } catch {}

      if (res.ok) {
        setFeedbackMessage(isHe ? "ההגשה הועברה בהצלחה לעיתון הבא ברשימת העדיפויות." : "Submission cascaded to the next prioritized journal.");
        await fetchSubmissions();
      } else {
        setErrorMessage(data?.error || (isHe ? "העברת ההגשה נכשלה." : "Failed to cascade submission."));
      }
    } catch (e: any) {
      console.error("Cascade error:", e);
      setErrorMessage(isHe ? "אירעה שגיאת רשת במהלך ניוד ההגשה." : "A network error occurred while cascading.");
    } finally {
      setCascadingId(null);
    }
  };

  const handleStartNewConnection = () => {
    setErrorMessage(null);
    setStep("briefing");
  };

  const handleBriefingAccepted = () => {
    setStep("form");
  };

  const handleConnectionSaved = (_id: string | number) => {
    fetchConnections();
    setStep("list");
  };

  const handleInitiateSubmission = (connectionId: number) => {
    setSelectedConnectionId(connectionId);
    setErrorMessage(null);
    setStep("confirm");
  };

  const handleConfirmSubmit = async (publishMode: "draft" | "publish") => {
    if (!selectedConnectionId) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId, connectionId: selectedConnectionId, publishMode }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {}

      if (res.ok) {
        setActiveSubmission(data);
        setStep("progress");
        await fetchSubmissions();
      } else {
        setErrorMessage(data?.error || (isHe ? "שגיאה ביצירת הגשה." : "Failed to initiate submission."));
      }
    } catch (e: any) {
      console.error("Submission error:", e);
      setErrorMessage(isHe ? "שגיאת תקשורת עם שרת ההגשות." : "Network error initiating submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
        <span className="sr-only">{isHe ? "טוען נתונים..." : "Loading submission data..."}</span>
      </div>
    );
  }

  if (step === "briefing") {
    return <SecurityBriefing onAccept={handleBriefingAccepted} onCancel={() => setStep("list")} />;
  }

  if (step === "form") {
    return <ConnectionForm onSuccess={handleConnectionSaved} onCancel={() => setStep("list")} />;
  }

  if (step === "confirm") {
    const selectedConn = connections.find((c) => c.id === selectedConnectionId);
    return (
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-submission-title"
        className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-w-2xl mx-auto p-6 text-center"
      >
        <h2 id="confirm-submission-title" className="text-xl font-bold text-slate-800 mb-2">
          {t("confirm.title")}
        </h2>
        {selectedConn && (
          <p className="text-sm font-semibold text-sky-700 bg-sky-50 py-1.5 px-3 rounded-lg inline-block mb-3">
            {selectedConn.displayName || selectedConn.siteUrl} ({selectedConn.platform})
          </p>
        )}
        <p className="text-slate-600 mb-6">{t("confirm.description")}</p>

        {errorMessage && (
          <div role="alert" className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
            {errorMessage}
          </div>
        )}

        <div className="flex justify-center gap-4 flex-wrap">
          <button 
            type="button"
            onClick={() => setStep("list")} 
            disabled={isSubmitting}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50"
          >
            {t("common.cancel")}
          </button>
          <button 
            type="button"
            onClick={() => handleConfirmSubmit("draft")}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="px-6 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("confirm.submitAsDraft")}
          </button>
          <button 
            type="button"
            onClick={() => handleConfirmSubmit("publish")}
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="px-6 py-2 bg-gradient-to-r from-blue-400 via-sky-400 to-sky-300 text-white font-medium rounded-lg hover:from-sky-500 hover:via-sky-500 hover:to-sky-400 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {t("confirm.submitForPublishing")}
          </button>
        </div>
      </div>
    );
  }

  // Progress tracking view
  if (step === "progress") {
    const currentSub = activeSubmission || submissions[0];
    const status = currentSub?.status || "preparing";
    const selectedConn = connections.find((c) => c.id === currentSub?.connectionId);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep("list")}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              aria-label={isHe ? "חזרה לרשימת החיבורים" : "Back to connections list"}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {isHe ? "סטטוס התקדמות ההגשה" : "Submission Progress"}
              </h2>
              <p className="text-xs text-slate-500">
                {selectedConn ? `${selectedConn.displayName || selectedConn.siteUrl} (${selectedConn.platform})` : `Paper #${paperId}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fetchSubmissions()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-sky-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
            aria-label={isHe ? "רענן סטטוס" : "Refresh status"}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isHe ? "רענן" : "Refresh"}</span>
          </button>
        </div>

        {/* Visual Progress Bar */}
        <SubmissionProgressBar currentStatus={status} />

        {/* Detailed Submission Status Card */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500">
              {isHe ? "פרטי ההגשה הפעילה" : "Active Submission Details"}
            </span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 bg-white border border-slate-200 rounded text-slate-700 capitalize">
              {status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-xs text-slate-400 block">{isHe ? "מצב הגשה" : "Mode"}</span>
              <span className="font-semibold text-slate-800 capitalize">{currentSub?.publishMode || "Draft"}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">{isHe ? "תאריך התחלה" : "Started"}</span>
              <span className="font-semibold text-slate-800">
                {currentSub?.createdAt ? new Date(currentSub.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">{isHe ? "מזהה מעקב" : "Remote Tracking"}</span>
              <span className="font-semibold text-slate-800 font-mono text-xs">
                {currentSub?.remotePostId || currentSub?.confirmationId || (status === "submitting" ? "Processing..." : "Pending")}
              </span>
            </div>
          </div>

          {currentSub?.remotePostUrl && (
            <div className="pt-2">
              <a
                href={currentSub.remotePostUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700"
              >
                {t("panel.viewPost")} <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setStep("list")}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {isHe ? "חזרה לרשימת החיבורים" : "Return to Connections"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span className="text-sm font-medium">{errorMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setErrorMessage(null)} 
            className="text-xs text-rose-600 underline cursor-pointer"
          >
            {isHe ? "סגור" : "Dismiss"}
          </button>
        </div>
      )}

      {feedbackMessage && (
        <div role="status" aria-live="polite" className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span className="text-sm font-medium">{feedbackMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setFeedbackMessage(null)} 
            className="text-xs text-emerald-700 underline cursor-pointer"
          >
            {isHe ? "סגור" : "Dismiss"}
          </button>
        </div>
      )}

      {/* Connections List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">{t("panel.myConnections")}</h2>
          <button 
            type="button"
            onClick={handleStartNewConnection}
            className="px-4 py-2 bg-sky-50 text-sky-600 font-medium rounded-lg hover:bg-sky-100 transition-colors cursor-pointer"
          >
            {t("panel.addNewConnection")}
          </button>
        </div>

        {connections.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            {t("panel.noConnections")}
          </div>
        ) : (
          <div className="grid gap-4">
            {connections.map(conn => (
              <div key={conn.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-sky-200 transition-colors">
                <div>
                  <h3 className="font-semibold text-slate-800">{conn.displayName || conn.siteUrl}</h3>
                  <div className="text-sm text-slate-500 flex gap-2 mt-1">
                    <span className="capitalize">{conn.platform}</span> • 
                    <span>{conn.siteUrl}</span>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => handleInitiateSubmission(conn.id)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-400 via-sky-400 to-sky-300 text-white font-medium rounded-lg hover:from-sky-500 hover:via-sky-500 hover:to-sky-400 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> {t("panel.submitHere")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {submissions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800">{t("panel.submissionHistory")}</h2>
            <button 
              type="button"
              onClick={() => fetchSubmissions()} 
              className="text-slate-400 hover:text-sky-500 p-1.5 rounded-lg transition-colors cursor-pointer" 
              title={isHe ? "רענן היסטוריה" : "Refresh history"}
              aria-label={isHe ? "רענן היסטוריית הגשות" : "Refresh submission history"}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {submissions.map(sub => (
              <div key={sub.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  {sub.status === 'submitted' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                  {(sub.status === 'failed' || sub.status === 'rejected') && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
                  {['preparing', 'submitting'].includes(sub.status) && <Loader2 className="w-5 h-5 text-sky-500 animate-spin shrink-0" />}
                  
                  <div>
                    <div className="font-medium text-slate-800 capitalize">{sub.status}</div>
                    <div className="text-sm text-slate-500">
                      {new Date(sub.createdAt).toLocaleString()} • {isHe ? "מצב:" : "Mode:"} {sub.publishMode}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {['preparing', 'submitting'].includes(sub.status) && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubmission(sub);
                        setStep("progress");
                      }}
                      className="text-xs font-semibold text-sky-600 hover:underline cursor-pointer"
                    >
                      {isHe ? "הצג התקדמות" : "Track Progress"}
                    </button>
                  )}
                  {sub.status === 'rejected' && (
                    <button
                      type="button"
                      onClick={() => handleCascade(sub.id)}
                      disabled={cascadingId === sub.id}
                      aria-busy={cascadingId === sub.id}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 font-medium rounded-lg hover:bg-rose-200 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {cascadingId === sub.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      Cascade to Next Journal
                    </button>
                  )}
                  {sub.status === 'submitted' && sub.remotePostUrl && (
                    <a 
                      href={sub.remotePostUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-sm font-medium text-sky-500 hover:text-sky-600"
                    >
                      {t("panel.viewPost")} <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
