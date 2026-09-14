"use client";

import React, { useState } from "react";
import Image from "next/image";
import ClaimVerificationBadge from "./ClaimVerificationBadge";
import LegendEditor from "./LegendEditor";

interface FigureAnalysisCardProps {
  figure: {
    id: string;
    figureNumber: number;
    imageUrl: string;
    originalLegend: string | null;
    analyses?: any[];
  }
}

export default function FigureAnalysisCard({ figure }: FigureAnalysisCardProps) {
  const [isEditingLegend, setIsEditingLegend] = useState(false);
  const latestAnalysis = figure.analyses && figure.analyses.length > 0 
    ? figure.analyses[figure.analyses.length - 1] 
    : null;

  return (
    <div className="border rounded-lg shadow-sm bg-white overflow-hidden flex flex-col">
      <div className="relative w-full h-48 bg-gray-100">
        <img 
          src={figure.imageUrl} 
          alt={`Figure ${figure.figureNumber}`}
          className="w-full h-full object-contain"
        />
      </div>
      
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold">Figure {figure.figureNumber}</h3>
          {latestAnalysis && (
            <ClaimVerificationBadge status={latestAnalysis.claimVerificationStatus} />
          )}
        </div>
        
        {latestAnalysis?.legendAccuracyScore && (
          <div className="text-sm text-gray-500 mb-2">
            Quality Score: {latestAnalysis.legendAccuracyScore}/100
          </div>
        )}

        <div className="text-sm mb-4">
          <span className="font-medium">Original Legend:</span>
          <p className="text-gray-700 mt-1 line-clamp-3">
            {figure.originalLegend || "No legend available."}
          </p>
        </div>

        {latestAnalysis?.issuesFound && latestAnalysis.issuesFound.length > 0 && (
          <div className="mb-4">
            <span className="font-medium text-sm text-red-600">Issues Detected:</span>
            <ul className="list-disc pl-5 text-sm text-red-500 mt-1">
              {latestAnalysis.issuesFound.map((issue: string, idx: number) => (
                <li key={idx}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-auto pt-4 border-t">
          {isEditingLegend && latestAnalysis ? (
            <LegendEditor 
              figureId={figure.id}
              originalLegend={figure.originalLegend || ""}
              suggestedLegend={latestAnalysis.suggestedLegend}
              onClose={() => setIsEditingLegend(false)}
            />
          ) : (
            <button 
              onClick={() => setIsEditingLegend(true)}
              className="w-full bg-blue-50 text-blue-600 py-2 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              Review Legend Suggestions
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
