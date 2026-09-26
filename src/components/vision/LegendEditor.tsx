"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

interface LegendEditorProps {
  figureId: string;
  originalLegend: string;
  suggestedLegend?: string;
  onClose: () => void;
}

export default function LegendEditor({ figureId, originalLegend, suggestedLegend, onClose }: LegendEditorProps) {
  const [currentLegend, setCurrentLegend] = useState(originalLegend);
  const [isSaving, setIsSaving] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Synchronize state if originalLegend changes externally
  useEffect(() => {
    setCurrentLegend(originalLegend);
  }, [originalLegend]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/figures/${figureId}/legend`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legend: currentLegend }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Save failed (${res.status})`);
      }

      toast.success("Legend updated successfully");
      onClose();
    } catch (error: any) {
      console.error("Failed to save legend", error);
      toast.error(error.message || "Failed to save legend");
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
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
            type="button"
            onClick={() => setCurrentLegend(suggestedLegend)}
            className="text-xs text-purple-600 text-left hover:underline mt-1 cursor-pointer"
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
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded cursor-pointer disabled:opacity-50"
        >
          Cancel
        </button>
        <button 
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-3 py-1 text-sm bg-sky-500 text-white rounded hover:bg-sky-600 disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? "Saving..." : "Save Legend"}
        </button>
      </div>
    </div>
  );
}
