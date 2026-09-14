"use client";

import React, { useState } from "react";

export default function ExportDatasetModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [outcomeFilter, setOutcomeFilter] = useState("accepted");
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState("");

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rlhf/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcomeFilter })
      });
      const data = await res.json();
      if (data.downloadUrl) {
        setDownloadUrl(data.downloadUrl);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-green-600 text-white px-4 py-2 rounded font-medium"
      >
        Export Fine-Tuning Dataset
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-96 max-w-full">
            <h3 className="text-xl font-bold mb-4">Export Settings</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Outcome Filter</label>
              <select 
                value={outcomeFilter} 
                onChange={(e) => setOutcomeFilter(e.target.value)}
                className="w-full border rounded p-2"
              >
                <option value="">All</option>
                <option value="accepted">Accepted Only (Best for fine-tuning)</option>
                <option value="rejected">Rejected Only</option>
                <option value="revision_required">Revision Required</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-gray-600 border rounded"
              >
                Cancel
              </button>
              <button 
                onClick={handleExport}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
              >
                {loading ? "Generating..." : "Generate File"}
              </button>
            </div>

            {downloadUrl && (
              <div className="mt-4 p-3 bg-green-50 text-green-700 rounded text-center">
                <a href={downloadUrl} className="font-bold underline" download>
                  Download JSONL Ready
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
