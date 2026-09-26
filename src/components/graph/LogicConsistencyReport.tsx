"use client";

import React, { useState, useRef, useEffect, useCallback, useId } from "react";
import { LogicCheckResult } from "@/services/graph/logicChecker";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { CheckCircle2, XCircle, ShieldAlert, Sparkles, Send, RefreshCw } from "lucide-react";

export interface LogicConsistencyReportProps {
  paperId: number;
}

export function LogicConsistencyReportSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Verifying scientific consistency..."
      className="space-y-4 pt-4 animate-pulse"
    >
      <div className="w-36 h-3 rounded bg-slate-200" />
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="h-4 w-3/4 rounded bg-slate-200" />
              <div className="h-6 w-24 rounded-full bg-slate-200 shrink-0" />
            </div>
            <div className="p-3 bg-white rounded-lg border border-slate-100 space-y-2">
              <div className="h-3 w-1/3 rounded bg-slate-200" />
              <div className="h-3 w-5/6 rounded bg-slate-200" />
              <div className="h-3 w-2/3 rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Verifying scientific claims against graph knowledge base...</span>
    </div>
  );
}

function LogicConsistencyReportInternal({ paperId }: LogicConsistencyReportProps) {
  const [claimsInput, setClaimsInput] = useState("");
  const [report, setReport] = useState<LogicCheckResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textareaId = useId();
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleCheck = useCallback(async () => {
    const claims = claimsInput
      .split("\n")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (claims.length === 0) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/graph/logic-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claims, paperId }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const data = await res.json();
      if (!isMountedRef.current) return;
      setReport(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      if (!isMountedRef.current) return;
      console.error("Logic check execution error:", err);
      setError(err?.message || "Failed to execute scientific logic verification.");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [claimsInput, paperId]);

  const activeClaimsCount = claimsInput
    .split("\n")
    .map((c) => c.trim())
    .filter((c) => c.length > 0).length;

  return (
    <div 
      className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs p-6 space-y-6"
      role="region"
      aria-label="Scientific Logic Consistency Report"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-100 text-violet-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Scientific Logic & GraphRAG Validation
            </h3>
            <p className="text-xs text-slate-500">
              Input manuscript hypothesis statements to verify consistency against extracted graph relationships
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label htmlFor={textareaId} className="block text-xs font-semibold text-slate-700">
          Hypothesis Statements or Claims
        </label>
        <textarea
          id={textareaId}
          className="w-full p-3.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all font-sans leading-relaxed text-slate-800 placeholder:text-slate-400"
          rows={3}
          placeholder="Enter claims to check (one statement per line)...&#10;e.g. Injected nanomaterials significantly reduced tumor cell proliferation without cytotoxic side effects."
          value={claimsInput}
          onChange={(e) => setClaimsInput(e.target.value)}
          aria-describedby={`${textareaId}-counter`}
        />

        <div className="flex items-center justify-between">
          <span id={`${textareaId}-counter`} className="text-xs text-slate-400">
            {activeClaimsCount} {activeClaimsCount === 1 ? "claim queued" : "claims queued"}
          </span>

          <button
            type="button"
            onClick={handleCheck}
            disabled={loading || activeClaimsCount === 0}
            aria-busy={loading}
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
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleCheck}
            className="inline-flex items-center gap-1 font-semibold text-red-800 hover:text-red-950 underline cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {loading && <LogicConsistencyReportSkeleton />}

      {report && !loading && (
        <div 
          className="space-y-4 pt-2"
          role="region"
          aria-label="Verification Results"
          aria-live="polite"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Verification Results ({report.length})
            </h4>
            <span className="text-xs text-slate-400">
              {report.filter((r) => r.isConsistent).length} consistent, {report.filter((r) => !r.isConsistent).length} contradiction(s)
            </span>
          </div>

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
                  <p className="font-semibold text-sm text-slate-900 leading-snug">
                    {item.claim}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                      item.isConsistent
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}
                    aria-label={`Claim status: ${item.isConsistent ? 'Consistent' : 'Contradiction Found'}`}
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
                        <li key={idx} className="leading-relaxed">
                          {ev}
                        </li>
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
                        <li key={idx} className="leading-relaxed">
                          {ev}
                        </li>
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

export default function LogicConsistencyReport(props: LogicConsistencyReportProps) {
  return (
    <ErrorBoundary name="LogicConsistencyReport">
      <LogicConsistencyReportInternal {...props} />
    </ErrorBoundary>
  );
}
