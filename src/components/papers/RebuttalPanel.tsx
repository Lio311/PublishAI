"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, Copy, Check, FileText, ListChecks, Sparkles, XCircle } from "lucide-react";
import { toast } from "sonner";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

export interface RebuttalPanelProps {
  paperId: string | number;
  initialComments?: string;
  initialStrategy?: string[] | string | null;
  initialLetter?: string | null;
  onSuccess?: (result: { strategy: string[] | string | null; letter: string | null }) => void;
}

function RebuttalPanelInner({ 
  paperId, 
  initialComments = "", 
  initialStrategy = null, 
  initialLetter = null,
  onSuccess 
}: RebuttalPanelProps) {
  const [comments, setComments] = useState(initialComments);
  const [isGenerating, setIsGenerating] = useState(false);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [rebuttalStrategy, setRebuttalStrategy] = useState<string[] | string | null>(initialStrategy);
  const [rebuttalLetter, setRebuttalLetter] = useState<string | null>(initialLetter);
  const [error, setError] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<"strategy" | "letter" | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync initial props if they update externally
  useEffect(() => {
    if (initialComments && !comments) {
      setComments(initialComments);
    }
  }, [initialComments]);

  useEffect(() => {
    if (initialStrategy && !rebuttalStrategy) {
      setRebuttalStrategy(initialStrategy);
    }
  }, [initialStrategy]);

  useEffect(() => {
    if (initialLetter && !rebuttalLetter) {
      setRebuttalLetter(initialLetter);
    }
  }, [initialLetter]);

  // Clean up in-flight requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setLiveStatus(null);
    toast.info("Rebuttal generation cancelled.");
  }, []);

  const handleGenerate = async () => {
    if (!comments.trim()) return;

    // Abort any existing in-flight run
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsGenerating(true);
    setLiveStatus("Connecting to multi-agent workflow...");
    setError(null);
    setRebuttalStrategy(null);
    setRebuttalLetter(null);

    let finalStrategy: string[] | string | null = null;
    let finalLetter: string | null = null;

    try {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperId: String(paperId),
          action: "start_rebuttal",
          reviewerComments: comments.trim(),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to start rebuttal process (HTTP ${res.status})`);
      }

      if (!res.body) {
        throw new Error("No response body received from server");
      }

      setLiveStatus("Analyzing reviewer feedback and structuring counter-arguments...");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);

            if (event.error) {
              throw new Error(event.error);
            }

            if (event.event === "on_chain_error") {
              throw new Error(event.data?.error || "Rebuttal generation failed");
            }

            if (event.event === "on_chat_model_start") {
              setLiveStatus("Synthesizing rebuttal strategy and point-by-point response...");
            }

            if (event.event === "on_chain_end") {
              const data = event.data?.output;
              if (data?.rebuttalStrategy) {
                finalStrategy = data.rebuttalStrategy;
                setRebuttalStrategy(data.rebuttalStrategy);
              }
              if (data?.rebuttalLetter) {
                finalLetter = data.rebuttalLetter;
                setRebuttalLetter(data.rebuttalLetter);
              }
            }
          } catch (e: any) {
            // Re-throw critical stream errors
            if (e.message && !e.message.startsWith("JSON.parse")) {
              throw e;
            }
            console.warn("Non-fatal line parsing warning:", e);
          }
        }
      }

      setLiveStatus(null);
      if (finalStrategy || finalLetter) {
        toast.success("Rebuttal strategy & response letter generated successfully!");
        if (onSuccess) {
          onSuccess({ strategy: finalStrategy, letter: finalLetter });
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        setLiveStatus(null);
        return;
      }
      const msg = err instanceof Error ? err.message : "An unknown error occurred during generation";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsGenerating(false);
      setLiveStatus(null);
      abortControllerRef.current = null;
    }
  };

  const copyToClipboard = async (text: string, type: "strategy" | "letter") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      toast.success(`${type === "strategy" ? "Strategy" : "Letter"} copied to clipboard!`);
      setTimeout(() => setCopiedType(null), 2500);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const inputId = `reviewer-comments-${paperId}`;
  const hintId = `reviewer-comments-hint-${paperId}`;

  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-8 border border-slate-200 mt-8">
      {/* Screen Reader Live Region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isGenerating ? liveStatus || "Generating rebuttal strategy..." : ""}
        {rebuttalStrategy ? "Rebuttal strategy generated." : ""}
        {rebuttalLetter ? "Rebuttal letter generated." : ""}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Peer Review Rebuttal</h2>
            <p className="text-sm text-slate-500">Autonomous counter-argument generation & formal editorial response</p>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <label htmlFor={inputId} className="block text-sm font-semibold text-slate-700 mb-1">
          Paste Reviewer Comments
        </label>
        <p id={hintId} className="text-xs text-slate-500 mb-3">
          Paste reviewer comments from the editorial decision report. PublishAI will synthesize an itemized response strategy and formal rebuttal letter.
        </p>
        <textarea
          id={inputId}
          name="reviewerComments"
          value={comments}
          onChange={(e) => {
            setComments(e.target.value);
            if (error) setError(null);
          }}
          disabled={isGenerating}
          aria-describedby={hintId}
          className="w-full h-48 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-700 disabled:opacity-60 disabled:bg-slate-50 transition-colors font-mono text-sm leading-relaxed"
          placeholder={"e.g. Reviewer 1: The methodology lacks detail regarding sample size...\nReviewer 2: The baseline comparison is incomplete..."}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !comments.trim()}
          aria-busy={isGenerating}
          className="px-8 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              <span>Generating Strategy...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" aria-hidden="true" />
              <span>Generate Strategy</span>
            </>
          )}
        </button>

        {isGenerating && (
          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-100 flex items-center gap-2 transition-colors"
          >
            <XCircle className="w-4 h-4 text-slate-500" aria-hidden="true" />
            <span>Cancel</span>
          </button>
        )}

        {isGenerating && liveStatus && (
          <p className="text-sm text-sky-600 flex items-center gap-2 animate-pulse" aria-live="polite">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
            <span>{liveStatus}</span>
          </p>
        )}
      </div>

      {error && (
        <div 
          role="alert" 
          aria-live="assertive" 
          className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold">Rebuttal generation failed</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {(rebuttalStrategy || rebuttalLetter) && (
        <div className="mt-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {rebuttalStrategy && (
            <section aria-labelledby={`rebuttal-strategy-heading-${paperId}`} className="bg-sky-50/50 p-6 rounded-xl border border-sky-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-sky-700" aria-hidden="true" />
                  <h3 id={`rebuttal-strategy-heading-${paperId}`} className="font-bold text-xl text-sky-900">
                    Rebuttal Strategy
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const text = Array.isArray(rebuttalStrategy) 
                      ? rebuttalStrategy.join("\n\n") 
                      : String(rebuttalStrategy);
                    copyToClipboard(text, "strategy");
                  }}
                  aria-label="Copy rebuttal strategy to clipboard"
                  className="px-3 py-1.5 bg-white border border-sky-200 text-sky-700 hover:bg-sky-50 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  {copiedType === "strategy" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" aria-hidden="true" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Copy Strategy</span>
                    </>
                  )}
                </button>
              </div>
              <ul className="list-disc pl-6 space-y-3">
                {Array.isArray(rebuttalStrategy) 
                  ? rebuttalStrategy.map((item, i) => (
                      <li key={i} className="text-slate-700 leading-relaxed">{item}</li>
                    ))
                  : <li className="text-slate-700 leading-relaxed">{String(rebuttalStrategy)}</li>
                }
              </ul>
            </section>
          )}
          
          {rebuttalLetter && (
            <section aria-labelledby={`rebuttal-letter-heading-${paperId}`} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-700" aria-hidden="true" />
                  <h3 id={`rebuttal-letter-heading-${paperId}`} className="font-bold text-xl text-slate-800">
                    Formal Rebuttal Letter
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(rebuttalLetter, "letter")}
                  aria-label="Copy formal rebuttal letter to clipboard"
                  className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  {copiedType === "letter" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-600" aria-hidden="true" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Copy Letter</span>
                    </>
                  )}
                </button>
              </div>
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed bg-white p-6 rounded-lg border border-slate-200 shadow-sm font-serif">
                {rebuttalLetter}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

export function RebuttalPanel(props: RebuttalPanelProps) {
  return (
    <ErrorBoundary name="Rebuttal Panel">
      <RebuttalPanelInner {...props} />
    </ErrorBoundary>
  );
}

export default RebuttalPanel;
