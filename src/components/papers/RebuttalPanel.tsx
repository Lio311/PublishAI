"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";

export function RebuttalPanel({ paperId }: { paperId: string | number }) {
  const [comments, setComments] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [rebuttalStrategy, setRebuttalStrategy] = useState<string[] | string | null>(null);
  const [rebuttalLetter, setRebuttalLetter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setRebuttalStrategy(null);
    setRebuttalLetter(null);

    try {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paperId,
          action: "start_rebuttal",
          reviewerComments: comments
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to start rebuttal process");
      }

      if (!res.body) {
        throw new Error("No response body");
      }

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
            
            if (event.event === "on_chain_end") {
              const data = event.data?.output;
              if (data?.rebuttalStrategy) setRebuttalStrategy(data.rebuttalStrategy);
              if (data?.rebuttalLetter) setRebuttalLetter(data.rebuttalLetter);
            }
          } catch (e) {
            console.error("Failed to parse event:", e);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-8 border border-slate-200 mt-8">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Peer Review Rebuttal</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Paste Reviewer Comments
        </label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="w-full h-48 p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-slate-700"
          placeholder="e.g. Reviewer 1: The methodology lacks detail...&#10;Reviewer 2: The conclusion is too broad..."
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !comments.trim()}
        className="px-8 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating Strategy...
          </>
        ) : (
          "Generate Strategy"
        )}
      </button>

      {error && (
        <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
          {error}
        </div>
      )}

      {(rebuttalStrategy || rebuttalLetter) && (
        <div className="mt-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {rebuttalStrategy && (
            <div className="bg-sky-50/50 p-6 rounded-xl border border-sky-100">
              <h3 className="font-bold text-xl text-sky-900 mb-4">Rebuttal Strategy</h3>
              <ul className="list-disc pl-6 space-y-3">
                {Array.isArray(rebuttalStrategy) 
                  ? rebuttalStrategy.map((item, i) => (
                      <li key={i} className="text-slate-700 leading-relaxed">{item}</li>
                    ))
                  : <li className="text-slate-700 leading-relaxed">{String(rebuttalStrategy)}</li>
                }
              </ul>
            </div>
          )}
          
          {rebuttalLetter && (
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="font-bold text-xl text-slate-800 mb-4">Rebuttal Letter</h3>
              <div className="whitespace-pre-wrap text-slate-700 leading-relaxed bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                {rebuttalLetter}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
