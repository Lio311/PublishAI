"use client";

import React, { useState, useEffect } from "react";
import FigureAnalysisCard from "./FigureAnalysisCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Image as ImageIcon, Sparkles, RefreshCw, AlertCircle } from "lucide-react";

interface Figure {
  id: string;
  figureNumber: number;
  imageUrl: string;
  originalLegend: string | null;
  analyses?: any[];
}

interface FigureGalleryProps {
  paperId: number;
}

export default function FigureGallery({ paperId }: FigureGalleryProps) {
  const [figures, setFigures] = useState<Figure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFigures = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/papers/${paperId}/figures`);
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      if (data.figures) {
        setFigures(data.figures);
      }
    } catch (err: any) {
      console.error("Failed to fetch figures", err);
      setError(err?.message || "Failed to fetch figure analyses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFigures();
  }, [paperId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-2">
          <div className="space-y-1">
            <div className="h-5 w-48 bg-slate-200 animate-pulse rounded" />
            <div className="h-3 w-64 bg-slate-100 animate-pulse rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50/70 border border-red-200/80 rounded-2xl p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-base font-bold text-red-900">Error Loading Figures</h4>
          <p className="text-xs text-red-600 mt-1">{error}</p>
        </div>
        <button
          onClick={fetchFigures}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  if (!figures.length) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs p-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center mx-auto">
          <ImageIcon className="w-7 h-7" />
        </div>
        <div className="space-y-1 max-w-sm mx-auto">
          <h3 className="text-base font-bold text-slate-800">No Figures Extracted</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            No image figures or plots were detected in this PDF manuscript. If your manuscript contains figures, they will appear here once vision parsing completes.
          </p>
        </div>
        <button
          onClick={fetchFigures}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Gallery</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-100 text-sky-600">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Vision AI Figure Analysis</h3>
            <p className="text-xs text-slate-500">Autonomous legend verification, quality assessment, and claim alignment</p>
          </div>
        </div>

        <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold border border-slate-200">
          {figures.length} figures analyzed
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {figures.map((figure) => (
          <FigureAnalysisCard key={figure.id} figure={figure} />
        ))}
      </div>
    </div>
  );
}
