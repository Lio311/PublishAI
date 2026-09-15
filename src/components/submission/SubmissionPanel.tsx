"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { SecurityBriefing } from "./SecurityBriefing";
import { ConnectionForm } from "./ConnectionForm";
import { Loader2, ExternalLink, RefreshCw, Send, CheckCircle2, AlertCircle } from "lucide-react";

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
  
  const [submissions, setSubmissions] = useState<any[]>([]);

  useEffect(() => {
    fetchConnections();
    fetchSubmissions();
  }, []);

  async function fetchConnections() {
    try {
      const res = await fetch("/api/journal-connection");
      if (res.ok) {
        const data = await res.json();
        setConnections(data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  async function fetchSubmissions() {
    try {
      const res = await fetch("/api/submissions");
      if (res.ok) {
        const data = await res.json();
        // Filter submissions for this paper
        setSubmissions(data.filter((s: any) => s.paperId === paperId));
      }
    } catch (e) {}
  };

  const handleStartNewConnection = () => {
    setStep("briefing");
  };

  const handleBriefingAccepted = () => {
    setStep("form");
  };

  const handleConnectionSaved = (id: string) => {
    fetchConnections();
    setStep("list");
  };

  const handleInitiateSubmission = (connectionId: number) => {
    setSelectedConnectionId(connectionId);
    setStep("confirm");
  };

  const handleConfirmSubmit = async (publishMode: "draft" | "publish") => {
    setStep("progress");
    try {
      await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperId, connectionId: selectedConnectionId, publishMode }),
      });
      fetchSubmissions();
    } catch (e) {
      console.error(e);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-sky-500" /></div>;
  }

  if (step === "briefing") {
    return <SecurityBriefing onAccept={handleBriefingAccepted} onCancel={() => setStep("list")} />;
  }

  if (step === "form") {
    return <ConnectionForm onSuccess={handleConnectionSaved} onCancel={() => setStep("list")} />;
  }

  if (step === "confirm") {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden max-w-2xl mx-auto p-6 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-4">{t("confirm.title")}</h2>
        <p className="text-slate-600 mb-6">{t("confirm.description")}</p>
        <div className="flex justify-center gap-4">
          <button onClick={() => setStep("list")} className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors">
            {t("common.cancel")}
          </button>
          <button 
            onClick={() => handleConfirmSubmit("draft")}
            className="px-6 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
          >
            {t("confirm.submitAsDraft")}
          </button>
          <button 
            onClick={() => handleConfirmSubmit("publish")}
            className="px-6 py-2 bg-gradient-to-r from-blue-400 via-sky-400 to-sky-300 text-white font-medium rounded-lg hover:from-sky-500 hover:via-sky-500 hover:to-sky-400 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> {t("confirm.submitForPublishing")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">{t("panel.myConnections")}</h2>
          <button 
            onClick={handleStartNewConnection}
            className="px-4 py-2 bg-sky-50 text-sky-500 font-medium rounded-lg hover:bg-sky-100 transition-colors"
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
                  onClick={() => handleInitiateSubmission(conn.id)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-400 via-sky-400 to-sky-300 text-white font-medium rounded-lg hover:from-sky-500 hover:via-sky-500 hover:to-sky-400 transition-colors flex items-center gap-2"
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
            <button onClick={fetchSubmissions} className="text-slate-400 hover:text-sky-500" title="Refresh">
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {submissions.map(sub => (
              <div key={sub.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {sub.status === 'submitted' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                  {sub.status === 'failed' && <AlertCircle className="w-5 h-5 text-rose-500" />}
                  {['preparing', 'submitting'].includes(sub.status) && <Loader2 className="w-5 h-5 text-sky-500 animate-spin" />}
                  
                  <div>
                    <div className="font-medium text-slate-800 capitalize">{sub.status}</div>
                    <div className="text-sm text-slate-500">
                      {new Date(sub.createdAt).toLocaleString()} • {isHe ? "מצב:" : "Mode:"} {sub.publishMode}
                    </div>
                  </div>
                </div>
                
                {sub.status === 'submitted' && sub.remotePostUrl && (
                  <a 
                    href={sub.remotePostUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-1 text-sm font-medium text-sky-500 hover:text-sky-600"
                  >
                    {t("panel.viewPost")} <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
