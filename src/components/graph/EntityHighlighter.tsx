"use client";

import React, { useEffect, useState, useCallback, useId } from "react";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { SkeletonText } from "@/components/ui/Skeleton";
import { AlertCircle } from "lucide-react";

export interface HighlightEntity {
  id: string;
  name: string;
  type: string;
  description?: string;
}

export interface EntityHighlighterProps {
  text: string;
  className?: string;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function EntityHighlighterInternal({ text, className = "" }: EntityHighlighterProps) {
  const [entities, setEntities] = useState<HighlightEntity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const containerId = useId();

  const fetchEntities = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/graph/entities", { signal });
      if (!res.ok) {
        throw new Error(`Failed to fetch entities (${res.status})`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setEntities(data);
      } else {
        setEntities([]);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error("EntityHighlighter fetch error:", err);
      setError("Unable to load entity glossary");
      setEntities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchEntities(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchEntities]);

  const highlightText = (content: string, ents: HighlightEntity[]) => {
    if (!content) return null;
    if (!Array.isArray(ents) || ents.length === 0) return content;

    try {
      // Sort entities by length descending to match longest phrases first
      const sorted = [...ents]
        .filter((e) => typeof e?.name === "string" && e.name.trim().length > 0)
        .sort((a, b) => b.name.length - a.name.length);

      if (sorted.length === 0) return content;

      // Escape special characters in names
      const escapedNames = sorted.map((e) => escapeRegExp(e.name.trim()));
      // Build safe regular expression
      const pattern = new RegExp(`\\b(${escapedNames.join("|")})\\b`, "gi");

      const parts = content.split(pattern);

      return parts.map((part, i) => {
        const lowerPart = part.toLowerCase();
        const matchedEntity = sorted.find(
          (e) => e.name.toLowerCase() === lowerPart
        );

        if (matchedEntity) {
          const tooltipId = `${containerId}-entity-${i}`;
          return (
            <span
              key={`match-${i}`}
              tabIndex={0}
              role="mark"
              aria-describedby={tooltipId}
              aria-label={`${matchedEntity.name}, ${matchedEntity.type} entity`}
              className="bg-amber-100 hover:bg-amber-200 border-b-2 border-amber-600 text-slate-900 cursor-pointer relative group inline-block rounded-xs px-0.5 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
            >
              <span className="font-medium">{part}</span>
              <span
                id={tooltipId}
                role="tooltip"
                className="hidden group-hover:block group-focus:block group-focus-within:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-slate-900/95 text-white text-xs p-2.5 rounded-lg w-52 z-30 shadow-lg pointer-events-none text-left backdrop-blur-xs border border-slate-700 leading-normal"
              >
                <span className="font-bold block text-amber-300">
                  {matchedEntity.name}
                </span>
                <span className="text-[11px] text-slate-400 capitalize block mb-1">
                  Type: {matchedEntity.type}
                </span>
                {matchedEntity.description && (
                  <span className="text-[11px] text-slate-200 block border-t border-slate-700/80 pt-1 mt-1 line-clamp-3">
                    {matchedEntity.description}
                  </span>
                )}
              </span>
            </span>
          );
        }
        return part;
      });
    } catch (err) {
      console.error("EntityHighlighter parsing error:", err);
      return content;
    }
  };

  if (loading) {
    return (
      <div 
        aria-busy="true"
        aria-label="Loading entity glossary"
        className={`leading-relaxed p-4 bg-white border border-slate-200 rounded-xl space-y-2 ${className}`}
      >
        <div className="flex items-center gap-2 mb-2 text-xs text-slate-400">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>Scanning text for scientific entities...</span>
        </div>
        <SkeletonText lines={3} />
      </div>
    );
  }

  return (
    <div className={`leading-relaxed p-4 bg-white border border-slate-200 rounded-xl text-slate-800 ${className}`}>
      {error && (
        <div className="mb-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2" role="status">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}. Displaying raw text.</span>
        </div>
      )}
      {highlightText(text, entities)}
    </div>
  );
}

export default function EntityHighlighter(props: EntityHighlighterProps) {
  return (
    <ErrorBoundary
      name="EntityHighlighter"
      fallback={
        <div className={`leading-relaxed p-4 bg-white border border-slate-200 rounded-xl text-slate-800 ${props.className || ""}`}>
          {props.text}
        </div>
      }
    >
      <EntityHighlighterInternal {...props} />
    </ErrorBoundary>
  );
}
