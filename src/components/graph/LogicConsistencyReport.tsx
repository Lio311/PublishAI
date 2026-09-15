"use client";

import React, { useState } from "react";
import { LogicCheckResult } from "@/services/graph/logicChecker";

export default function LogicConsistencyReport({ paperId }: { paperId: number }) {
  const [claimsInput, setClaimsInput] = useState("");
  const [report, setReport] = useState<LogicCheckResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/graph/logic-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claims: claimsInput.split("\\n").filter(c => c.trim().length > 0),
          paperId
        })
      });
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 flex flex-col gap-4">
      <h3 className="text-lg font-semibold">Scientific Logic Check (GraphRAG)</h3>
      <textarea 
        className="w-full p-2 border rounded" 
        rows={4} 
        placeholder="Enter claims to check (one per line)..."
        value={claimsInput}
        onChange={e => setClaimsInput(e.target.value)}
      />
      <button 
        onClick={handleCheck}
        disabled={loading || !claimsInput}
        className="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600 disabled:opacity-50"
      >
        {loading ? "Checking..." : "Run Logic Check"}
      </button>

      {report && (
        <div className="flex flex-col gap-3 mt-4">
          {report.map((item, i) => (
            <div key={i} className={`p-3 rounded border ${item.isConsistent ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'}`}>
              <p className="font-semibold">{item.claim}</p>
              <div className="mt-2 text-sm">
                <span className="font-bold">Status:</span> {item.isConsistent ? '✅ Consistent' : '❌ Contradiction Found'}
              </div>
              {item.contradictingEvidence && item.contradictingEvidence.length > 0 && (
                <div className="mt-1 text-sm text-red-800">
                  <span className="font-bold">Contradicting Evidence:</span>
                  <ul className="list-disc ml-4">
                    {item.contradictingEvidence.map((ev, idx) => <li key={idx}>{ev}</li>)}
                  </ul>
                </div>
              )}
              {item.supportingEvidence && item.supportingEvidence.length > 0 && (
                <div className="mt-1 text-sm text-green-800">
                  <span className="font-bold">Supporting Evidence:</span>
                  <ul className="list-disc ml-4">
                    {item.supportingEvidence.map((ev, idx) => <li key={idx}>{ev}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
