"use client";

import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface LegendEditorProps {
  figureId: string;
  originalLegend: string;
  suggestedLegend?: string;
  onClose: () => void;
}

export default function LegendEditor({ figureId, originalLegend, suggestedLegend, onClose }: LegendEditorProps) {
  const t = useTranslations("PaperTools.figures");
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
        throw new Error(errorData.error || t("saveFailed"));
      }

      toast.success(t("saved"));
      onClose();
    } catch (error: any) {
      console.error("Failed to save legend", error);
      toast.error(error.message || t("saveFailed"));
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500">{t("suggestedLegend")}</label>
        <div className="text-sm bg-purple-50 p-2 rounded border border-purple-100 text-purple-900">
          {suggestedLegend || t("noSuggestion")}
        </div>
        {suggestedLegend && (
          <button 
            type="button"
            onClick={() => setCurrentLegend(suggestedLegend)}
            className="text-xs text-purple-600 text-left hover:underline mt-1 cursor-pointer"
          >
            {t("useSuggestion")}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-500">{t("editLegend")}</label>
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
          {t("cancel")}
        </button>
        <button 
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-3 py-1 text-sm bg-sky-500 text-white rounded hover:bg-sky-600 disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? t("saving") : t("save")}
        </button>
      </div>
    </div>
  );
}
