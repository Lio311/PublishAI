"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AlertCircle, CheckCircle2, RotateCcw, Send, Play } from "lucide-react";
import { useLocale } from "next-intl";

export type AgentPipelineStatus = "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED" | "ERROR";

export interface AgentRunnerProps {
  paperId?: string;
  onResult?: (result: any) => void;
  onStatusChange?: (status: AgentPipelineStatus) => void;
  onLog?: (log: string) => void;
}

export function AgentRunner({
  paperId,
  onResult,
  onStatusChange,
  onLog,
}: AgentRunnerProps) {
  const locale = useLocale();
  const isHe = locale === "he";

  const [status, setInternalStatus] = useState<AgentPipelineStatus>("IDLE");
  const [feedback, setFeedback] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const setStatus = useCallback((newStatus: AgentPipelineStatus | ((prev: AgentPipelineStatus) => AgentPipelineStatus)) => {
    setInternalStatus(prev => (typeof newStatus === "function" ? newStatus(prev) : newStatus));
  }, []);

  // Notify parent of status changes cleanly
  useEffect(() => {
    onStatusChange?.(status);
  }, [status, onStatusChange]);

  // Clean up any ongoing fetch on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (logs.length > 0) {
      logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const runStream = async (action: "start" | "resume") => {
    if (!paperId) {
      setStatus("ERROR");
      setErrorMessage(
        isHe
          ? "לא סופק מזהה מאמר תקין להפעלת תהליך ה-AI."
          : "No valid paper ID provided to start the AI pipeline."
      );
      return;
    }

    // Cancel any previous in-flight request
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setErrorMessage(null);
    setStatus("RUNNING");
    if (action === "start") {
      setLogs([]);
      onLog?.("");
    }
    
    let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;

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
        signal: controller.signal,
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

      reader = res.body.getReader();
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
            let event: any;
            try {
              event = JSON.parse(line);
            } catch {
              continue;
            }

            // Check if backend returned an error event
            if (event.error) {
              await reader.cancel().catch(() => {});
              throw new Error(event.error);
            }

            const logMsg = `[${event.event || "event"}] ${event.name || ""}`;
            setLogs(prev => [...prev, logMsg]);
            onLog?.(logMsg);
            
            // If we reached an interrupt (human in the loop), pause and close reader
            if (event.event === "on_interrupt") {
              await reader.cancel().catch(() => {});
              setStatus("PAUSED");
              return;
            }
            // If finished
            if (event.event === "on_chain_end" && event.name === "LangGraph") {
              const out = event.data?.output;
              onResult?.(out);
            }
          }
        }
      }
      
      setStatus(prev => (prev === "PAUSED" ? "PAUSED" : "COMPLETED"));
      if (action === "resume") setFeedback("");
    } catch (err: any) {
      if (err?.name === "AbortError" || controller.signal.aborted) {
        return;
      }
      console.error("AgentRunner stream error:", err);
      setErrorMessage(
        err?.message ||
          (isHe
            ? "אירעה שגיאה בלתי צפויה במהלך ביצוע צינור ה-AI."
            : "An unexpected error occurred while executing the AI pipeline.")
      );
      setStatus("ERROR");
    } finally {
      if (reader) {
        reader.cancel().catch(() => {});
      }
    }
  };

  const getStatusText = (s: AgentPipelineStatus) => {
    switch (s) {
      case "IDLE":
        return isHe ? "ממתין" : "IDLE";
      case "RUNNING":
        return isHe ? "פעיל" : "RUNNING";
      case "PAUSED":
        return isHe ? "מושהה" : "PAUSED";
      case "COMPLETED":
        return isHe ? "הושלם" : "COMPLETED";
      case "ERROR":
        return isHe ? "שגיאה" : "ERROR";
    }
  };

  return (
    <div
      dir={isHe ? "rtl" : "ltr"}
      className="p-5 border border-slate-200 rounded-2xl shadow-xs max-w-md bg-white text-slate-900 font-sans"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">
          {isHe ? "צינור סוכני AI" : "Agent Pipeline"}
        </h2>
        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 uppercase tracking-wider">
          {getStatusText(status)}
        </span>
      </div>
      
      {status === "IDLE" && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            {paperId
              ? isHe
                ? "מוכן להפעלת סקירה ושיפור מדעי של כתב היד באמצעות סוכנים אוטונומיים."
                : "Ready to launch multi-agent scientific revision on this manuscript."
              : isHe
                ? "בחר או העלה מאמר כדי להפעיל את צינור ה-AI."
                : "Select or upload a paper to launch the pipeline."}
          </p>
          <button 
            type="button"
            onClick={() => runStream("start")}
            disabled={!paperId}
            aria-label={isHe ? "הפעל צינור סוכנים" : "Start AI Pipeline"}
            className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer shadow-xs"
          >
            <Play className={`w-4 h-4 ${isHe ? "rotate-180" : ""}`} />
            <span>{isHe ? "הפעל צינור סוכנים" : "Start AI Pipeline"}</span>
          </button>
        </div>
      )}

      {status === "RUNNING" && (
        <div className="flex items-center gap-3 text-sky-700 bg-sky-50 border border-sky-200 p-3.5 rounded-xl" role="status" aria-live="polite">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-sky-600 border-t-transparent shrink-0"></div>
          <span className="text-sm font-medium">
            {isHe ? "הצינור פעיל ומעבד נתונים בזמן אמת..." : "Pipeline is actively running..."}
          </span>
        </div>
      )}

      {status === "PAUSED" && (
        <div className="space-y-3" role="status" aria-live="polite">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-amber-800 font-semibold text-xs">
              {isHe ? "התהליך הושהה (ממתין למשוב אנושי)" : "Pipeline Paused (Human in the Loop)"}
            </p>
            <p className="text-amber-700 text-xs mt-1">
              {isHe
                ? "ה-AI הכין טיוטת שינויים וממתין להערות והנחיות שלך לפני המשך."
                : "The AI has prepared draft modifications and is waiting for your review."}
            </p>
          </div>
          
          <label htmlFor="agent-feedback" className="sr-only">
            {isHe ? "משוב למודל AI" : "Feedback for AI"}
          </label>
          <textarea
            id="agent-feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder={isHe ? "ספק הנחיות או משוב למודל ה-AI..." : "Provide instructions or feedback to the AI..."}
            aria-label={isHe ? "משוב למודל AI" : "Feedback for AI"}
            className="w-full border border-slate-300 p-3 text-sm rounded-xl focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none resize-none"
            rows={3}
          />
          
          <button 
            type="button"
            onClick={() => runStream("resume")}
            aria-label={isHe ? "שלח משוב והמשך" : "Send Feedback & Resume"}
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer shadow-xs"
          >
            <Send className={`w-3.5 h-3.5 ${isHe ? "rotate-180" : ""}`} />
            <span>{isHe ? "שלח משוב והמשך" : "Send Feedback & Resume"}</span>
          </button>
        </div>
      )}

      {status === "COMPLETED" && (
        <div className="space-y-3" role="status" aria-live="polite">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <p className="text-emerald-800 font-medium text-xs">
              {isHe ? "התהליך הושלם בהצלחה!" : "Pipeline Completed Successfully!"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => runStream("start")}
            aria-label={isHe ? "הפעל שוב" : "Run Pipeline Again"}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>{isHe ? "הפעל שוב" : "Run Pipeline Again"}</span>
          </button>
        </div>
      )}

      {status === "ERROR" && (
        <div className="space-y-3" role="status" aria-live="assertive">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{isHe ? "שגיאה בצינור הסוכנים" : "Pipeline Error"}</span>
            </div>
            <p className="text-rose-700 text-xs">
              {errorMessage || (isHe ? "אירעה שגיאה בביצוע התהליך." : "An error occurred while executing the pipeline.")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => runStream("start")}
            aria-label={isHe ? "נסה שוב" : "Retry Pipeline"}
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isHe ? "נסה שוב" : "Retry Pipeline"}</span>
          </button>
        </div>
      )}

      {logs.length > 0 && (
        <div 
          dir="ltr"
          className="mt-4 p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl h-36 overflow-y-auto space-y-1 leading-relaxed border border-slate-800 text-left"
          tabIndex={0}
          aria-label={isHe ? "יומן ריצה" : "Execution logs"}
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
