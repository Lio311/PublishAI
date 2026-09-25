"use client";

import { useState } from "react";

export function AgentRunner({ paperId = "123", onResult, onStatusChange, onLog }: { paperId?: string, onResult?: (result: any) => void, onStatusChange?: (status: "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED" | "ERROR") => void, onLog?: (log: string) => void }) {
  const [status, setInternalStatus] = useState<"IDLE" | "RUNNING" | "PAUSED" | "COMPLETED" | "ERROR">("IDLE");
  const [feedback, setFeedback] = useState("");
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const setStatus = (newStatus: "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED" | "ERROR" | ((prev: any) => any)) => {
    setInternalStatus(prev => {
      const updated = typeof newStatus === "function" ? newStatus(prev) : newStatus;
      onStatusChange?.(updated);
      return updated;
    });
  };

  const runStream = async (action: "start" | "resume") => {
    setStatus("RUNNING");
    if (action === "start") {
      setLogs([]);
      onLog?.("");
    }
    
    try {
      let dataSchema = undefined;
      if (action === "start") {
        const storedSchema = sessionStorage.getItem("pendingDataSchema");
        if (storedSchema) {
          try {
            dataSchema = JSON.parse(storedSchema);
          } catch (e) {}
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

      if (!res.body) throw new Error("No response body");

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
              const logMsg = `[${event.event}] ${event.name}`;
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
    } catch (err) {
      console.error(err);
      setStatus("ERROR");
    }
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg shadow-sm max-w-md bg-white text-black">
      <h2 className="text-xl font-bold mb-4">Agent Pipeline</h2>
      
      {status === "IDLE" && (
        <button 
          onClick={() => runStream("start")}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Start AI Pipeline
        </button>
      )}

      {status === "RUNNING" && (
        <div className="flex items-center space-x-2 text-gray-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Pipeline is running...</span>
        </div>
      )}

      {status === "PAUSED" && (
        <div className="space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-amber-800 font-medium">Pipeline Paused (Human in the Loop)</p>
            <p className="text-amber-700 text-sm mt-1">The AI has prepared the drafts and is waiting for your review.</p>
          </div>
          
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Provide Feedback to the AI..."
            className="w-full border border-gray-300 p-3 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            rows={4}
          />
          
          <button 
            onClick={() => runStream("resume")}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Send Feedback & Resume
          </button>
        </div>
      )}

      {status === "COMPLETED" && (
        <div className="space-y-3">
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 font-medium">Pipeline Completed!</p>
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="mt-4 p-2 bg-slate-900 text-green-400 font-mono text-[10px] rounded h-32 overflow-y-auto">
          {logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}
    </div>
  );
}
