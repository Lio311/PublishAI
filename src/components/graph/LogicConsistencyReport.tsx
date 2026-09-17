"use client";

import React, { useState } from "react";
import { LogicCheckResult } from "@/services/graph/logicChecker";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { CheckCircle2, XCircle, ShieldAlert, Sparkles, Send } from "lucide-react";

export default function LogicConsistencyReport({ paperId }: { paperId: number }) {
  const [claimsInput, setClaimsInput] = useState("");
  const [report, setReport] = useState<LogicCheckResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    if (!claimsInput.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/graph/logic-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claims: claimsInput.split("\n").filter((c) => c.trim().length > 0),
          paperId,
        }),
      });
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to execute scientific logic verification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-100 text-violet-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Scientific Logic & GraphRAG Validation</h3>
            <p className="text-xs text-slate-500">
              Input manuscript hypothesis statements to verify consistency against extracted graph relationships
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <textarea
          className="w-full p-3.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-sans leading-relaxed text-slate-800 placeholder:text-slate-400"
          rows={3}
          placeholder="Enter claims to check (one statement per line)...&#10;e.g. Injected nanomaterials significantly reduced tumor cell proliferation without cytotoxic side effects."
          value={claimsInput}
          onChange={(e) => setClaimsInput(e.target.value)}
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">
            {claimsInput.split("\n").filter((c) => c.trim().length > 0).length} claims queued
          </span>

          <button
            onClick={handleCheck}
            disabled={loading || !claimsInput.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? (
              <LoadingSpinner size="xs" color="white" label="Verifying..." />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>Run Logic Check</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {report && (
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Verification Results</h4>
          <div className="space-y-3">
            {report.map((item, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border transition-all ${
                  item.isConsistent
                    ? "bg-emerald-50/70 border-emerald-200/80"
                    : "bg-rose-50/70 border-rose-200/80"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-sm text-slate-900 leading-snug">{item.claim}</p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                      item.isConsistent
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {item.isConsistent ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Consistent</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Contradiction Found</span>
                      </>
                    )}
                  </span>
                </div>

                {item.contradictingEvidence && item.contradictingEvidence.length > 0 && (
                  <div className="mt-3 p-3 bg-white/80 rounded-lg border border-rose-100 space-y-1.5">
                    <span className="text-xs font-bold text-rose-800 uppercase tracking-wide">
                      Contradicting Evidence:
                    </span>
                    <ul className="list-disc ml-4 text-xs text-rose-900 space-y-1">
                      {item.contradictingEvidence.map((ev, idx) => (
                        <li key={idx} className="leading-relaxed">{ev}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {item.supportingEvidence && item.supportingEvidence.length > 0 && (
                  <div className="mt-3 p-3 bg-white/80 rounded-lg border border-emerald-100 space-y-1.5">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                      Supporting Evidence:
                    </span>
                    <ul className="list-disc ml-4 text-xs text-emerald-900 space-y-1">
                      {item.supportingEvidence.map((ev, idx) => (
                        <li key={idx} className="leading-relaxed">{ev}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
