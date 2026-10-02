"use client";

import React, { useState } from "react";
import ClaimVerificationBadge from "./ClaimVerificationBadge";
import LegendEditor from "./LegendEditor";
import { useTranslations } from "next-intl";
import { Sparkles, AlertTriangle } from "lucide-react";
import type { FigureAnalysisDto } from "@/types/api";
import Image from "next/image";

interface FigureAnalysisCardProps {
  figure: {
    id: string;
    figureNumber: number;
    imageUrl: string;
    originalLegend: string | null;
    analyses?: FigureAnalysisDto[];
  };
}

export default function FigureAnalysisCard({ figure }: FigureAnalysisCardProps) {
  const t = useTranslations("PaperTools.figures");
  const [isEditingLegend, setIsEditingLegend] = useState(false);
  const latestAnalysis =
    figure.analyses && figure.analyses.length > 0
      ? figure.analyses[figure.analyses.length - 1]
      : null;
  const issues: string[] = Array.isArray(latestAnalysis?.issuesFound) ? (latestAnalysis.issuesFound as string[]) : [];

  return (
    <div className="rounded-2xl border border-slate-200/80 shadow-xs bg-white/90 backdrop-blur-md overflow-hidden flex flex-col transition-all hover:shadow-sm">
      <div className="relative w-full h-52 bg-slate-100 flex items-center justify-center p-2">
        <Image
          src={figure.imageUrl}
          alt={t("figure", { number: figure.figureNumber })}
          fill
          unoptimized
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-contain rounded-lg p-2"
        />
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2.5 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">{t("figure", { number: figure.figureNumber })}</h3>
            {latestAnalysis?.legendAccuracyScore && (
              <span className="text-xs font-semibold text-slate-500">
                {t("confidence", { score: latestAnalysis.legendAccuracyScore })}
              </span>
            )}
          </div>
          {latestAnalysis && (
            <ClaimVerificationBadge status={latestAnalysis.claimVerificationStatus ?? "unclear"} />
          )}
        </div>

        <div className="text-xs mb-4">
          <span className="font-semibold text-slate-600 block mb-1">{t("originalLegend")}</span>
          <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 line-clamp-3 leading-relaxed">
            {figure.originalLegend || t("noLegend")}
          </p>
        </div>

        {issues.length > 0 && (
          <div className="mb-4 p-3 bg-red-50/70 border border-red-200/70 rounded-xl space-y-1.5">
            <span className="font-bold text-xs text-red-700 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>{t("issues")}</span>
            </span>
            <ul className="list-disc pl-4 text-xs text-red-800 space-y-1">
              {issues.map((issue, idx) => (
                <li key={idx} className="leading-snug">{issue}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-auto pt-4 border-t border-slate-100">
          {isEditingLegend && latestAnalysis ? (
            <LegendEditor
              key={figure.id}
              figureId={figure.id}
              originalLegend={figure.originalLegend || ""}
              suggestedLegend={latestAnalysis.suggestedLegend ?? undefined}
              onClose={() => setIsEditingLegend(false)}
            />
          ) : (
            <button
              onClick={() => setIsEditingLegend(true)}
              className="w-full inline-flex items-center justify-center gap-2 bg-sky-50 hover:bg-sky-100 text-sky-700 py-2.5 rounded-xl transition-colors text-xs font-semibold cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>{t("reviewSuggestion")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
