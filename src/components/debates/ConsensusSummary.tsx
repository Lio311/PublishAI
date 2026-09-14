import React from "react";

export default function ConsensusSummary({ summary }: { summary: string }) {
  return (
    <div className="mt-4 p-4 bg-green-100 text-green-900 border border-green-300 rounded">
      <h2 className="text-xl font-semibold mb-2">Consensus Reached</h2>
      <p>{summary}</p>
    </div>
  );
}
