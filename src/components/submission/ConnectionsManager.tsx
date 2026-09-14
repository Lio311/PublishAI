"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { SecurityBriefing } from "./SecurityBriefing";
import { ConnectionForm } from "./ConnectionForm";
import { Loader2, ExternalLink, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

export function ConnectionsManager() {
  const t = useTranslations("submission");
  const [step, setStep] = useState<"list" | "briefing" | "form">("list");
  const [connections, setConnections] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [connRes, subRes] = await Promise.all([
        fetch("/api/journal-connection"),
        fetch("/api/submissions")
      ]);
      
      if (connRes.ok) setConnections(await connRes.json());
      if (subRes.ok) setSubmissions(await subRes.json());
    } finally {
      setIsLoading(false);
    }
  };

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
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (step === "briefing") {
    return <SecurityBriefing onAccept={handleBriefingAccepted} onCancel={() => setStep("list")} />;
  }

  if (step === "form") {
    return <ConnectionForm onSuccess={handleConnectionSaved} onCancel={() => setStep("list")} />;
  }

  return (
    <div className="space-y-6">
      {/* Connections List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">{t("panel.myConnections")}</h2>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="text-slate-400 hover:text-indigo-600 p-2" title="Refresh">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button 
              onClick={handleStartNewConnection}
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {t("panel.addNewConnection")}
            </button>
          </div>
        </div>

        {connections.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            <p className="mb-4">You don't have any journal connections yet.</p>
            <button onClick={handleStartNewConnection} className="text-indigo-600 font-medium hover:underline">
              Add your first connection
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {connections.map(conn => (
              <div key={conn.id} className="p-5 border border-slate-200 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all">
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
                  Added: {new Date(conn.createdAt).toLocaleDateString()}
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
            No submissions found.
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map(sub => (
              <div key={sub.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-lg gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {sub.status === 'submitted' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    {sub.status === 'failed' && <AlertCircle className="w-5 h-5 text-rose-500" />}
                    {['preparing', 'submitting'].includes(sub.status) && <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">{sub.submittedTitle || `Paper #${sub.paperId}`}</div>
                    <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                      <span className="capitalize font-medium">{sub.status}</span>
                      <span>•</span>
                      <span>{new Date(sub.createdAt).toLocaleString()}</span>
                      <span>•</span>
                      <span className="capitalize text-indigo-600">Mode: {sub.publishMode}</span>
                    </div>
                  </div>
                </div>
                
                {sub.status === 'submitted' && sub.remotePostUrl && (
                  <a 
                    href={sub.remotePostUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:border-indigo-200 transition-colors"
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
