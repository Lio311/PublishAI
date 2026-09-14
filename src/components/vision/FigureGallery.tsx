"use client";

import React, { useState, useEffect } from "react";
import FigureAnalysisCard from "./FigureAnalysisCard";

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

  useEffect(() => {
    async function fetchFigures() {
      try {
        const res = await fetch(`/api/papers/${paperId}/figures`);
        const data = await res.json();
        if (data.figures) {
          setFigures(data.figures);
        }
      } catch (error) {
        console.error("Failed to fetch figures", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchFigures();
  }, [paperId]);

  if (loading) return <div className="p-4">Loading figures...</div>;
  if (!figures.length) return <div className="p-4">No figures found for this paper.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {figures.map(figure => (
        <FigureAnalysisCard key={figure.id} figure={figure} />
      ))}
    </div>
  );
}
