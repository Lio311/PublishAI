"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { CheckCircle2, XCircle, Terminal, AlertCircle } from "lucide-react";

export function AnalysisStatus({ paperId }: { paperId: number }) {
  const [status, setStatus] = useState<string>("idle");

  useEffect(() => {
    // eslint-disable-next-line prefer-const
    let intervalId: NodeJS.Timeout;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/papers/${paperId}/sandbox`);
        const data = await res.json();

        if (data.run) {
          setStatus(data.run.status);
          if (data.run.status === "completed" || data.run.status === "failed") {
            clearInterval(intervalId);
          }
        }
      } catch (err) {
        console.error("Error fetching status:", err);
      }
    };

    // Initial fetch
    fetchStatus();

    // Poll every 5 seconds
    intervalId = setInterval(fetchStatus, 5000);

    return () => clearInterval(intervalId);
  }, [paperId]);

  if (status === "idle") return null;

  const isRunning = status === "pending" || status === "running";
  const isCompleted = status === "completed";
  const isFailed = status === "failed";

  return (
    <div
      className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all ${
        isRunning
          ? "bg-sky-50/70 border-sky-200/80 text-sky-900"
          : isCompleted
          ? "bg-emerald-50/70 border-emerald-200/80 text-emerald-900"
          : isFailed
          ? "bg-rose-50/70 border-rose-200/80 text-rose-900"
          : "bg-slate-50 border-slate-200 text-slate-800"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-xl ${
            isRunning
              ? "bg-sky-100 text-sky-600"
              : isCompleted
              ? "bg-emerald-100 text-emerald-600"
              : isFailed
              ? "bg-rose-100 text-rose-600"
              : "bg-slate-200 text-slate-600"
          }`}
        >
          {isRunning ? (
            <LoadingSpinner size="xs" color="sky" />
          ) : isCompleted ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : isFailed ? (
            <XCircle className="w-5 h-5" />
          ) : (
            <Terminal className="w-5 h-5" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">Execution Environment Sandbox</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                isRunning
                  ? "bg-sky-100 text-sky-700"
                  : isCompleted
                  ? "bg-emerald-100 text-emerald-700"
                  : isFailed
                  ? "bg-rose-100 text-rose-700"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {status}
            </span>
          </div>
          <p className="text-xs opacity-80 mt-0.5">
            {isRunning && "Executing Python analysis script and validating statistical claims against raw tabular data..."}
            {isCompleted && "Statistical verification completed successfully. All data re-plots generated."}
            {isFailed && "Execution encountered errors during script execution. Check logs for details."}
          </p>
        </div>
      </div>
    </div>
  );
}
