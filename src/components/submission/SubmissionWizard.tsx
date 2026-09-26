"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  Building2, 
  FileText, 
  ShieldCheck, 
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { SecurityBriefing } from "./SecurityBriefing";
import { ConnectionForm } from "./ConnectionForm";
import SubmissionProgressBar from "./SubmissionProgressBar";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

export interface SubmissionWizardProps {
  paperId?: number;
  initialConnectionId?: number;
  onComplete?: (submission: any) => void;
  onCancel?: () => void;
  className?: string;
}

type WizardStep = "select_connection" | "add_connection_briefing" | "add_connection_form" | "configure" | "confirm" | "progress";

export function SubmissionWizard({
  paperId,
  initialConnectionId,
  onComplete,
  onCancel,
  className = "",
}: SubmissionWizardProps) {
  const t = useTranslations("submission");
  const locale = useLocale();
  const isHe = locale === "he";

  const [step, setStep] = useState<WizardStep>("select_connection");
  const [connections, setConnections] = useState<any[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(initialConnectionId || null);
  const [publishMode, setPublishMode] = useState<"draft" | "publish">("draft");
  const [fundingDeclaration, setFundingDeclaration] = useState(false);
  const [aiUsageDeclaration, setAiUsageDeclaration] = useState(false);
  const [dataAvailableStatement, setDataAvailableStatement] = useState("");
  
  const [activeSubmission, setActiveSubmission] = useState<any | null>(null);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = useCallback(async (isMounted = true) => {
    setIsLoadingConnections(true);
    try {
      const res = await fetch("/api/journal-connection");
      if (!isMounted) return;
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : data?.connections || [];
        setConnections(list);
        if (list.length > 0 && !selectedConnectionId) {
          setSelectedConnectionId(list[0].id);
        }
      }
    } catch (err) {
      if (isMounted) console.error("Error loading connections:", err);
    } finally {
      if (isMounted) setIsLoadingConnections(false);
    }
  }, [selectedConnectionId]);

  useEffect(() => {
    let mounted = true;
    fetchConnections(mounted);
    return () => {
      mounted = false;
    };
  }, [fetchConnections]);

  // Live polling when in progress step
  useEffect(() => {
    if (step !== "progress" || !activeSubmission?.id) return;
    if (["submitted", "failed", "rejected", "accepted"].includes(activeSubmission.status)) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/submissions/${activeSubmission.id}/status`);
        if (res.ok) {
          const data = await res.json();
          setActiveSubmission((prev: any) => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.warn("Polling status error:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [step, activeSubmission?.id, activeSubmission?.status]);

  const handleConnectionCreated = (connectionId: string | number) => {
    const idNum = Number(connectionId);
    setSelectedConnectionId(idNum);
    fetchConnections();
    setStep("configure");
  };

  const handleSubmit = async () => {
    if (!paperId) {
      setError(isHe ? "לא נבחר מאמר להגשה." : "No paper selected for submission.");
      return;
    }
    if (!selectedConnectionId) {
      setError(isHe ? "אנא בחר חיבור לעיתון." : "Please select a journal connection.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperId,
          connectionId: selectedConnectionId,
          publishMode,
          fundingDeclaration,
          aiUsageDeclaration,
          dataAvailableStatement: dataAvailableStatement.trim() || undefined,
        }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {}

      if (res.ok) {
        setActiveSubmission(data);
        setStep("progress");
        onComplete?.(data);
      } else {
        setError(data?.error || (isHe ? "שגיאה ביצירת הגשה." : "Failed to initiate submission."));
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      setError(isHe ? "אירעה שגיאת רשת בעת שליחת המאמר." : "Network error during manuscript submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedConn = connections.find((c) => c.id === selectedConnectionId);

  // Sub-views based on step
  if (step === "add_connection_briefing") {
    return (
      <div className={className}>
        <SecurityBriefing
          onAccept={() => setStep("add_connection_form")}
          onCancel={() => setStep("select_connection")}
        />
      </div>
    );
  }

  if (step === "add_connection_form") {
    return (
      <div className={className}>
        <ConnectionForm
          onSuccess={handleConnectionCreated}
          onCancel={() => setStep("select_connection")}
        />
      </div>
    );
  }

  return (
    <ErrorBoundary name="SubmissionWizard">
      <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
        {/* Wizard Header with Steps Tracker */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-sky-600" aria-hidden="true" />
              <h2 className="text-lg font-bold text-slate-800">
                {isHe ? "אשף הגשת מאמר לעיתון" : "Manuscript Submission Wizard"}
              </h2>
            </div>
            {onCancel && step !== "progress" && (
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
              >
                {isHe ? "ביטול" : "Cancel"}
              </button>
            )}
          </div>

          {/* Stepper Progress */}
          <div className="flex items-center gap-2 mt-4 text-xs font-semibold text-slate-600">
            <span className={`px-2.5 py-1 rounded-full ${step === "select_connection" ? "bg-sky-600 text-white" : "bg-slate-200"}`}>
              1. {isHe ? "בחירת עיתון" : "Journal"}
            </span>
            <span className="text-slate-300">→</span>
            <span className={`px-2.5 py-1 rounded-full ${step === "configure" ? "bg-sky-600 text-white" : "bg-slate-200"}`}>
              2. {isHe ? "הגדרות והצהרות" : "Declarations"}
            </span>
            <span className="text-slate-300">→</span>
            <span className={`px-2.5 py-1 rounded-full ${step === "confirm" ? "bg-sky-600 text-white" : "bg-slate-200"}`}>
              3. {isHe ? "אישור ושליחה" : "Review & Submit"}
            </span>
            <span className="text-slate-300">→</span>
            <span className={`px-2.5 py-1 rounded-full ${step === "progress" ? "bg-sky-600 text-white" : "bg-slate-200"}`}>
              4. {isHe ? "מעקב סטטוס" : "Status"}
            </span>
          </div>
        </div>

        {/* Wizard Body */}
        <div className="p-6 space-y-6">
          {error && (
            <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Select Connection */}
          {step === "select_connection" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800 text-base">
                    {isHe ? "בחר עיתון יעד" : "Select Target Journal"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isHe ? "בחר באחד החיבורים השמורים או הוסף חיבור חדש." : "Choose from your active journal connections or configure a new portal."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("add_connection_briefing")}
                  className="px-3.5 py-1.5 bg-sky-50 text-sky-600 font-semibold text-xs rounded-xl hover:bg-sky-100 transition-colors cursor-pointer"
                >
                  + {isHe ? "חיבור עיתון חדש" : "New Connection"}
                </button>
              </div>

              {isLoadingConnections ? (
                <div className="flex justify-center py-10" role="status">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-500" />
                  <span className="sr-only">Loading connections...</span>
                </div>
              ) : connections.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500">
                  <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-medium">{isHe ? "אין חיבורי עיתונים מוגדרים." : "No journal connections found."}</p>
                  <button
                    type="button"
                    onClick={() => setStep("add_connection_briefing")}
                    className="mt-3 text-xs text-sky-600 font-semibold hover:underline cursor-pointer"
                  >
                    {isHe ? "הגדר חיבור ראשון כעת" : "Add your first journal connection"}
                  </button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={isHe ? "עיתוני יעד" : "Target Journals"}>
                  {connections.map((conn) => {
                    const isSelected = selectedConnectionId === conn.id;
                    return (
                      <div
                        key={conn.id}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onClick={() => setSelectedConnectionId(conn.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedConnectionId(conn.id);
                          }
                        }}
                        className={`p-4 rounded-xl border cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                          isSelected
                            ? "border-sky-500 bg-sky-50/60 shadow-xs ring-1 ring-sky-500"
                            : "border-slate-200 hover:border-sky-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-bold text-slate-800 text-sm">
                              {conn.displayName || conn.siteUrl}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 truncate max-w-[200px]" title={conn.siteUrl}>
                              {conn.siteUrl}
                            </div>
                          </div>
                          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {conn.platform}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-slate-600 text-sm hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    {isHe ? "ביטול" : "Cancel"}
                  </button>
                )}
                <button
                  type="button"
                  disabled={!selectedConnectionId}
                  onClick={() => setStep("configure")}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>{isHe ? "המשך להגדרות" : "Next: Configuration"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Configure & Declarations */}
          {step === "configure" && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-slate-800 text-base">
                  {isHe ? "הגדרות והצהרות מחקר" : "Submission Mode & Declarations"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isHe ? "בחר מצב פרסום ומלא את הצהרות העיתון הנדרשות." : "Select your submission mode and fulfill required compliance declarations."}
                </p>
              </div>

              {/* Mode Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  {isHe ? "מצב הגשה" : "Publishing Mode"}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`p-3 rounded-xl border cursor-pointer transition-all ${publishMode === "draft" ? "border-sky-500 bg-sky-50 ring-1 ring-sky-500" : "border-slate-200"}`}>
                    <input
                      type="radio"
                      name="publishMode"
                      value="draft"
                      checked={publishMode === "draft"}
                      onChange={() => setPublishMode("draft")}
                      className="sr-only"
                    />
                    <div className="font-semibold text-slate-800 text-sm">{isHe ? "טיוטה (Draft)" : "Draft Submission"}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {isHe ? "יוצר טיוטה בעיתון ללא שליחה סופית" : "Creates draft in portal without final submission"}
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border cursor-pointer transition-all ${publishMode === "publish" ? "border-sky-500 bg-sky-50 ring-1 ring-sky-500" : "border-slate-200"}`}>
                    <input
                      type="radio"
                      name="publishMode"
                      value="publish"
                      checked={publishMode === "publish"}
                      onChange={() => setPublishMode("publish")}
                      className="sr-only"
                    />
                    <div className="font-semibold text-slate-800 text-sm">{isHe ? "שליחה רשמית (Publish)" : "Formal Submission"}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {isHe ? "שליחה רשמית ישירות לצוות העורכים" : "Direct submission into editorial peer review pipeline"}
                    </div>
                  </label>
                </div>
              </div>

              {/* Declarations */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fundingDeclaration}
                    onChange={(e) => setFundingDeclaration(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500"
                  />
                  <span className="text-xs text-slate-700">
                    {isHe 
                      ? "הצהרת מימון: כל מקורות המימון הרלוונטיים צוינו במאמר." 
                      : "Funding Declaration: All funding and grants supporting this research are disclosed."}
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiUsageDeclaration}
                    onChange={(e) => setAiUsageDeclaration(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-sky-600 border-slate-300 focus:ring-sky-500"
                  />
                  <span className="text-xs text-slate-700">
                    {isHe 
                      ? "הצהרת שימוש בבינה מלאכותית: שימוש בעזרי AI תואם את מדיניות הוועדה לאתיקה של העיתון." 
                      : "AI Declaration: Generative AI tools were used solely in accordance with journal ethical policies."}
                  </span>
                </label>
              </div>

              {/* Data Availability */}
              <div className="space-y-1">
                <label htmlFor="wizard-data-statement" className="block text-xs font-semibold text-slate-700">
                  {isHe ? "הצהרת זמינות נתונים (אופציונלי)" : "Data Availability Statement (Optional)"}
                </label>
                <textarea
                  id="wizard-data-statement"
                  rows={2}
                  value={dataAvailableStatement}
                  onChange={(e) => setDataAvailableStatement(e.target.value)}
                  placeholder={isHe ? "הנתונים זמינים לפי בקשה מהמחבר הראשי..." : "The datasets generated during the study are available upon reasonable request..."}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep("select_connection")}
                  className="px-4 py-2 text-slate-600 text-sm hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isHe ? "חזרה" : "Back"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep("confirm")}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <span>{isHe ? "המשך לאישור" : "Review & Submit"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Confirm & Submit */}
          {step === "confirm" && (
            <div className="space-y-5">
              <div>
                <h3 className="font-semibold text-slate-800 text-base">
                  {isHe ? "אישור פרטי ההגשה" : "Review Submission Summary"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isHe ? "אנא ודא את הפרטים הבאים טרם שיגור המאמר." : "Please verify the following information before dispatching the payload."}
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{isHe ? "עיתון יעד" : "Target Journal"}</span>
                  <span className="font-semibold text-slate-900">{selectedConn?.displayName || selectedConn?.siteUrl}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{isHe ? "פלטפורמה" : "Platform"}</span>
                  <span className="font-semibold text-slate-900 capitalize">{selectedConn?.platform}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{isHe ? "מצב הגשה" : "Mode"}</span>
                  <span className="font-semibold text-slate-900 capitalize">{publishMode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{isHe ? "מאמר מזהה" : "Paper ID"}</span>
                  <span className="font-mono text-xs font-semibold text-slate-900">#{paperId || "N/A"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs border border-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {isHe 
                    ? "ההגשה תועבר באמצעות ערוץ מאובטח ומוצפן ישירות ל-API של העיתון." 
                    : "The payload will be securely encrypted and dispatched to the journal's API."}
                </span>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep("configure")}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-slate-600 text-sm hover:text-slate-900 transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isHe ? "חזרה" : "Back"}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 via-sky-500 to-sky-400 hover:from-sky-600 hover:via-sky-600 hover:to-sky-500 text-white font-semibold text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isHe ? "משגר הגשה..." : "Dispatching Payload..."}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>{isHe ? "שגר הגשה לעיתון" : "Transmit Submission"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Live Progress Tracker */}
          {step === "progress" && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-slate-800 text-base">
                  {isHe ? "מעקב אחר התקדמות ההגשה" : "Live Submission Progress"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedConn?.displayName || selectedConn?.siteUrl} • #{paperId}
                </p>
              </div>

              <SubmissionProgressBar currentStatus={activeSubmission?.status || "preparing"} />

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{isHe ? "סטטוס נוכחי" : "Current Status"}</span>
                  <span className="font-bold text-slate-900 capitalize">{activeSubmission?.status || "preparing"}</span>
                </div>
                {activeSubmission?.confirmationId && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isHe ? "מזהה אישור" : "Confirmation ID"}</span>
                    <span className="font-mono font-bold text-sky-700">{activeSubmission.confirmationId}</span>
                  </div>
                )}
                {activeSubmission?.remotePostUrl && (
                  <div className="pt-2">
                    <a
                      href={activeSubmission.remotePostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-sky-600 hover:underline"
                    >
                      {isHe ? "פתח קישור למעקב באתר העיתון" : "Open external tracking portal"} <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (onComplete) onComplete(activeSubmission);
                    if (onCancel) onCancel();
                  }}
                  className="px-5 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {isHe ? "סיום וסגירה" : "Complete & Close"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default SubmissionWizard;
