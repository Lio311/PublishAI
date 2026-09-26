"use client";

import { useState, useRef, useEffect } from "react";
import { AlertCircle, CheckCircle2, RotateCcw, Send, Play } from "lucide-react";

export interface AgentRunnerProps {
  paperId?: string;
  onResult?: (result: any) => void;
  onStatusChange?: (status: "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED" | "ERROR") => void;
  onLog?: (log: string) => void;
}

export function AgentRunner({
  paperId,
  onResult,
  onStatusChange,
  onLog,
}: AgentRunnerProps) {
  const [status, setInternalStatus] = useState<"IDLE" | "RUNNING" | "PAUSED" | "COMPLETED" | "ERROR">("IDLE");
  const [feedback, setFeedback] = useState("");
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const setStatus = (newStatus: "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED" | "ERROR" | ((prev: "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED" | "ERROR") => "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED" | "ERROR")) => {
    setInternalStatus(prev => {
      const updated = typeof newStatus === "function" ? newStatus(prev) : newStatus;
      onStatusChange?.(updated);
      return updated;
    });
  };

  useEffect(() => {
    if (logs.length > 0) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const runStream = async (action: "start" | "resume") => {
    if (!paperId) {
      setStatus("ERROR");
      setErrorMessage("No valid paper ID provided to start the AI pipeline.");
      return;
    }

    setErrorMessage(null);
    setStatus("RUNNING");
    if (action === "start") {
      setLogs([]);
      onLog?.("");
    }
    
    try {
      let dataSchema = undefined;
      if (action === "start" && typeof window !== "undefined") {
        const storedSchema = sessionStorage.getItem("pendingDataSchema");
        if (storedSchema) {
          try {
            dataSchema = JSON.parse(storedSchema);
          } catch (e) {
            console.warn("Could not parse pendingDataSchema:", e);
          }
          sessionStorage.removeItem("pendingDataSchema");
        }
      }

      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action, 
          paperId, 
          feedback: action === "resume" ? feedback : undefined,
          dataSchema 
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || `Request failed with status ${res.status}`);
      }

      if (!res.body) throw new Error("No response stream body received");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const event = JSON.parse(line);
              const logMsg = `[${event.event}] ${event.name || ""}`;
              setLogs(prev => [...prev, logMsg]);
              onLog?.(logMsg);
              
              // If we reached an interrupt (or the end), update status
              if (event.event === "on_interrupt") {
                 setStatus("PAUSED");
                 return;
              }
              // If finished
              if (event.event === "on_chain_end" && event.name === "LangGraph") {
                 const out = event.data?.output;
                 setResult(out);
                 onResult?.(out);
              }
            } catch (e) {
              // Ignore parse errors on partial chunks
            }
          }
        }
      }
      
      setStatus(prev => prev === "PAUSED" ? "PAUSED" : "COMPLETED");
      if (action === "resume") setFeedback("");
    } catch (err: any) {
      console.error("AgentRunner stream error:", err);
      setErrorMessage(err?.message || "An unexpected error occurred while executing the AI pipeline.");
      setStatus("ERROR");
    }
  };

  return (
    <div className="p-5 border border-slate-200 rounded-2xl shadow-xs max-w-md bg-white text-slate-900 font-sans">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">Agent Pipeline</h2>
        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 uppercase tracking-wider">
          {status}
        </span>
      </div>
      
      {status === "IDLE" && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            {paperId ? "Ready to launch multi-agent scientific revision on this manuscript." : "Select or upload a paper to launch the pipeline."}
          </p>
          <button 
            type="button"
            onClick={() => runStream("start")}
            disabled={!paperId}
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer shadow-xs"
          >
            <Play className="w-4 h-4" />
            <span>Start AI Pipeline</span>
          </button>
        </div>
      )}

      {status === "RUNNING" && (
        <div className="flex items-center gap-3 text-sky-700 bg-sky-50 border border-sky-200 p-3.5 rounded-xl" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-sky-600 border-t-transparent"></div>
          <span className="text-sm font-medium">Pipeline is actively running...</span>
        </div>
      )}

      {status === "PAUSED" && (
        <div className="space-y-3" role="status" aria-live="polite">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-amber-800 font-semibold text-xs">Pipeline Paused (Human in the Loop)</p>
            <p className="text-amber-700 text-xs mt-1">The AI has prepared draft modifications and is waiting for your review.</p>
          </div>
          
          <label htmlFor="agent-feedback" className="sr-only">Feedback for AI</label>
          <textarea
            id="agent-feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Provide instructions or feedback to the AI..."
            aria-label="Feedback for AI"
            className="w-full border border-slate-300 p-3 text-sm rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none resize-none"
            rows={3}
          />
          
          <button 
            type="button"
            onClick={() => runStream("resume")}
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send Feedback & Resume</span>
          </button>
        </div>
      )}

      {status === "COMPLETED" && (
        <div className="space-y-3" role="status" aria-live="polite">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-emerald-800 font-medium text-xs">Pipeline Completed Successfully!</p>
          </div>
          <button
            type="button"
            onClick={() => runStream("start")}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Run Pipeline Again</span>
          </button>
        </div>
      )}

      {status === "ERROR" && (
        <div className="space-y-3" role="status" aria-live="assertive">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Pipeline Error</span>
            </div>
            <p className="text-rose-700 text-xs">{errorMessage || "An error occurred while executing the pipeline."}</p>
          </div>
          <button
            type="button"
            onClick={() => runStream("start")}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry Pipeline</span>
          </button>
        </div>
      )}

      {logs.length > 0 && (
        <div 
          className="mt-4 p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl h-36 overflow-y-auto space-y-1 leading-relaxed border border-slate-800"
          tabIndex={0}
          aria-label="Execution logs"
        >
          {logs.map((l, i) => (
            <div key={i} className="break-all">{l}</div>
          ))}
          <div ref={logsEndRef} />
        </div>
      )}
    </div>
  );
}

export default AgentRunner;
