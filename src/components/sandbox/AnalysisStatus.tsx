"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export function AnalysisStatus({ paperId }: { paperId: number }) {
  const [status, setStatus] = useState<string>("idle");

  useEffect(() => {
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

  return (
    <div className="p-4 bg-gray-100 rounded-lg flex items-center gap-3 my-4">
      {(status === "pending" || status === "running") && (
        <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
      )}
      <span className="font-medium text-gray-800">
        Sandbox Status: <span className="capitalize">{status}</span>
      </span>
      {status === "running" && (
        <span className="text-gray-500 text-sm">
          Running Python script and verifying statistical claims...
        </span>
      )}
    </div>
  );
}
