"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { SecurityBriefing } from "./SecurityBriefing";
import { ConnectionForm } from "./ConnectionForm";
import { Loader2, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, RotateCcw } from "lucide-react";
import type { JournalConnectionDto, SubmissionDto } from "@/types/api";
import { errorName } from "@/services/utils/errors";

export function ConnectionsManager() {
  const t = useTranslations("submission");
  const locale = useLocale();
  const isHe = locale === "he";
  const [step, setStep] = useState<"list" | "briefing" | "form">("list");
  const [connections, setConnections] = useState<JournalConnectionDto[]>([]);
  const [submissions, setSubmissions] = useState<SubmissionDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    const [connRes, subRes] = await Promise.all([
      fetch("/api/journal-connection", { signal }),
      fetch("/api/submissions", { signal }),
    ]);

    let loadedConnections: JournalConnectionDto[] | null = null;
    let loadedSubmissions: SubmissionDto[] | null = null;

    if (connRes.ok) {
      const connData = await connRes.json();
      loadedConnections = Array.isArray(connData) ? connData : connData?.connections || [];
    } else {
      console.warn("Failed to fetch journal connections", connRes.status);
    }

    if (subRes.ok) {
      const subData = await subRes.json();
      loadedSubmissions = Array.isArray(subData) ? subData : subData?.submissions || [];
    } else {
      console.warn("Failed to fetch submissions", subRes.status);
    }

    return { connections: loadedConnections, submissions: loadedSubmissions };
  }, []);

  const applyData = useCallback(
    (loaded: { connections: JournalConnectionDto[] | null; submissions: SubmissionDto[] | null }) => {
      if (loaded.connections) setConnections(loaded.connections);
      if (loaded.submissions) setSubmissions(loaded.submissions);
      if (!loaded.connections && !loaded.submissions) {
        setError(isHe ? "שגיאה בטעינת נתונים משרת ההגשות." : "Failed to load connection and submission data.");
      }
      setIsLoading(false);
    },
    [isHe]
  );

  const failData = useCallback(
    (err: unknown) => {
      if (errorName(err) === "AbortError") return;
      console.error("Error fetching submission connections:", err);
      setError(isHe ? "אירעה שגיאת רשת בטעינת הנתונים." : "A network error occurred while loading data.");
      setIsLoading(false);
    },
    [isHe]
  );

  const fetchData = () => {
    setIsLoading(true);
    setError(null);
    loadData().then(applyData, failData);
  };

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal).then(applyData, failData);
    return () => controller.abort();
  }, [loadData, applyData, failData]);

  const handleStartNewConnection = () => {
    setStep("briefing");
  };

  const handleBriefingAccepted = () => {
    setStep("form");
  };

  const handleConnectionSaved = () => {
    fetchData();
    setStep("list");
  };

  if (isLoading) {
    return (
      <div role="status" aria-live="polite" className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
        <span className="sr-only">{isHe ? "טוען חיבורים..." : "Loading connections..."}</span>
      </div>
    );
  }

  if (step === "briefing") {
    return <SecurityBriefing onAccept={handleBriefingAccepted} onCancel={() => setStep("list")} />;
  }

  if (step === "form") {
    return <ConnectionForm onSuccess={handleConnectionSaved} onCancel={() => setStep("list")} />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div role="alert" className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-lg transition-colors cursor-pointer"
            aria-label={isHe ? "נסה לטעון שוב" : "Retry loading data"}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {isHe ? "נסה שוב" : "Retry"}
          </button>
        </div>
      )}

      {/* Connections List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">{t("panel.myConnections")}</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => fetchData()} 
              className="text-slate-400 hover:text-sky-500 p-2 rounded-lg transition-colors cursor-pointer" 
              title={isHe ? "רענן חיבורים" : "Refresh connections"}
              aria-label={isHe ? "רענן חיבורים" : "Refresh connections"}
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button 
              onClick={handleStartNewConnection}
              className="px-4 py-2 bg-gradient-to-r from-blue-400 via-sky-400 to-sky-300 text-white font-medium rounded-lg hover:from-sky-500 hover:via-sky-500 hover:to-sky-400 transition-colors"
            >
              {t("panel.addNewConnection")}
            </button>
          </div>
        </div>

        {connections.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            <p className="mb-4">{isHe ? "עדיין אין לך חיבורים לעיתונים." : "You don't have any journal connections yet."}</p>
            <button onClick={handleStartNewConnection} className="text-sky-500 font-medium hover:underline">
              {isHe ? "הוסף חיבור ראשון" : "Add your first connection"}
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {connections.map(conn => (
              <div key={conn.id} className="p-5 border border-slate-200 rounded-xl hover:border-sky-200 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-slate-800">{conn.displayName || conn.siteUrl}</h3>
                  <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded-md capitalize">
                    {conn.platform}
                  </span>
                </div>
                <div className="text-sm text-slate-500 truncate mb-4" title={conn.siteUrl}>
                  {conn.siteUrl}
                </div>
                <div className="flex items-center text-xs text-slate-400">
                  {isHe ? "נוסף ב:" : "Added:"} {conn.createdAt ? new Date(conn.createdAt).toLocaleDateString() : "—"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global Submission History */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">{t("panel.submissionHistory")}</h2>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            {isHe ? "לא נמצאו הגשות." : "No submissions found."}
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map(sub => (
              <div key={sub.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-lg gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {sub.status === 'submitted' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    {sub.status === 'failed' && <AlertCircle className="w-5 h-5 text-rose-500" />}
                    {['preparing', 'submitting'].includes(sub.status ?? '') && <Loader2 className="w-5 h-5 text-sky-500 animate-spin" />}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">{sub.submittedTitle || `Paper #${sub.paperId}`}</div>
                    <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                      <span className="capitalize font-medium">{sub.status}</span>
                      <span>•</span>
                      <span>{sub.createdAt ? new Date(sub.createdAt).toLocaleString() : "—"}</span>
                      <span>•</span>
                      <span className="capitalize text-sky-500">{isHe ? "מצב:" : "Mode:"} {sub.publishMode}</span>
                    </div>
                  </div>
                </div>
                
                {sub.status === 'submitted' && sub.remotePostUrl && (
                  <a 
                    href={sub.remotePostUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-sky-500 hover:text-sky-600 hover:border-sky-200 transition-colors"
                  >
                    {t("panel.viewPost")} <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
