"use client";

import React, { useState } from "react";

interface LegendEditorProps {
  figureId: string;
  originalLegend: string;
  suggestedLegend?: string;
  onClose: () => void;
}

export default function LegendEditor({ figureId, originalLegend, suggestedLegend, onClose }: LegendEditorProps) {
  const [currentLegend, setCurrentLegend] = useState(originalLegend);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`/api/figures/${figureId}/legend`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legend: currentLegend }),
      });
      onClose();
    } catch (error) {
      console.error("Failed to save legend", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500">AI Suggested Legend</label>
        <div className="text-sm bg-purple-50 p-2 rounded border border-purple-100 text-purple-900">
          {suggestedLegend || "No suggestion available."}
        </div>
        {suggestedLegend && (
          <button 
            onClick={() => setCurrentLegend(suggestedLegend)}
            className="text-xs text-purple-600 text-left hover:underline mt-1"
          >
            Use suggestion
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500">Edit Legend</label>
        <textarea
          value={currentLegend}
          onChange={(e) => setCurrentLegend(e.target.value)}
          className="w-full border rounded p-2 text-sm focus:ring-sky-500 focus:border-sky-500"
          rows={4}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <button 
          onClick={onClose}
          disabled={isSaving}
          className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-3 py-1 text-sm bg-sky-500 text-white rounded hover:bg-sky-600 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Legend"}
        </button>
      </div>
    </div>
  );
}
