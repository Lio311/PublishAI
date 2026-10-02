"use client";

import React, { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { 
  Share2, 
  RefreshCw, 
  ZoomIn, 
  ZoomOut, 
  AlertCircle, 
  Table as TableIcon,
  Eye,
  Layers
} from "lucide-react";
import { useLoadable } from "@/hooks/useLoadable";
import type { ForceGraphMethods, LinkObject, NodeObject } from "react-force-graph-2d";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { 
  ssr: false,
  loading: () => <KnowledgeGraphViewerSkeleton />
});

export interface KnowledgeGraphNode {
  id: string;
  name: string;
  group?: string;
  type?: string;
  description?: string;
  x?: number;
  y?: number;
}

export interface KnowledgeGraphLink {
  source: string | KnowledgeGraphNode;
  target: string | KnowledgeGraphNode;
  label?: string;
  evidence?: string;
  confidence?: number;
}

export interface KnowledgeGraphData {
  nodes: KnowledgeGraphNode[];
  links: KnowledgeGraphLink[];
}

export function KnowledgeGraphViewerSkeleton() {
  const t = useTranslations("PaperTools.graph");
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={t("loading")}
      className="w-full bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col animate-pulse"
    >
      {/* Toolbar Skeleton */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-100" />
          <div className="space-y-1.5">
            <div className="w-36 h-4 rounded bg-slate-200" />
            <div className="w-48 h-3 rounded bg-slate-200" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-6 rounded-full bg-slate-200" />
          <div className="w-24 h-6 rounded-full bg-slate-200" />
          <div className="w-6 h-6 rounded bg-slate-200" />
          <div className="w-6 h-6 rounded bg-slate-200" />
        </div>
      </div>

      {/* Canvas Viewport Skeleton */}
      <div className="h-[520px] w-full bg-slate-950 relative flex items-center justify-center overflow-hidden">
        <svg className="w-full h-full opacity-20" viewBox="0 0 800 500" aria-hidden="true">
          <line x1="200" y1="200" x2="400" y2="260" stroke="#38bdf8" strokeWidth="2" strokeDasharray="5 5" />
          <line x1="400" y1="260" x2="600" y2="180" stroke="#a855f7" strokeWidth="2" strokeDasharray="5 5" />
          <line x1="400" y1="260" x2="350" y2="400" stroke="#38bdf8" strokeWidth="2" strokeDasharray="5 5" />
          <line x1="400" y1="260" x2="550" y2="380" stroke="#a855f7" strokeWidth="2" strokeDasharray="5 5" />
          <circle cx="400" cy="260" r="22" fill="#38bdf8" />
          <circle cx="200" cy="200" r="16" fill="#818cf8" />
          <circle cx="600" cy="180" r="16" fill="#c084fc" />
          <circle cx="350" cy="400" r="14" fill="#38bdf8" />
          <circle cx="550" cy="380" r="14" fill="#c084fc" />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-2">
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg flex items-center gap-3 text-slate-300 text-xs">
            <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
            <div className="text-left">
              <span className="font-semibold block text-slate-100">{t("loading")}</span>
              <span className="text-[11px] text-slate-400">{t("loadingDetail")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KnowledgeGraphViewerInternal({ paperId }: { paperId: number }) {
  const t = useTranslations("PaperTools.graph");
  const [viewMode, setViewMode] = useState<"graph" | "table">("graph");
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);

  const loadGraph = useCallback(async (signal: AbortSignal): Promise<KnowledgeGraphData> => {
    const res = await fetch(`/api/graph/visualize/${paperId}`, { signal });
    if (!res.ok) throw new Error(`Server returned ${res.status}`);
    const json = await res.json();
    return {
      nodes: Array.isArray(json?.nodes) ? json.nodes : [],
      links: Array.isArray(json?.links) ? json.links : [],
    };
  }, [paperId]);
  const { data, loading, error, reload } = useLoadable(loadGraph);

  const handleResetZoom = () => {
    if (fgRef.current?.zoomToFit) {
      fgRef.current.zoomToFit(800, 40);
    }
  };

  const handleZoomIn = () => {
    if (fgRef.current?.zoom) {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom * 1.3, 400);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current?.zoom) {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom / 1.3, 400);
    }
  };

  if (loading) {
    return <KnowledgeGraphViewerSkeleton />;
  }

  if (error) {
    return (
      <div 
        role="alert"
        className="w-full h-[360px] bg-red-50/50 backdrop-blur-md rounded-2xl border border-red-200 shadow-xs flex flex-col items-center justify-center p-6 text-center space-y-4"
      >
        <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-base font-semibold text-red-900">{t("renderFailed")}</h4>
          <p className="text-xs text-red-600 mt-1 max-w-sm">{error}</p>
        </div>
        <button
          type="button"
          onClick={reload}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t("retry")}</span>
        </button>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div 
        role="region"
        aria-label={t("emptyTitle")}
        className="w-full h-[360px] bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center p-6 text-center space-y-3"
      >
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
          <Share2 className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-base font-semibold text-slate-800">{t("emptyTitle")}</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {t("emptyDescription")}
          </p>
        </div>
        <button
          type="button"
          onClick={reload}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{t("refresh")}</span>
        </button>
      </div>
    );
  }

  return (
    <div 
      className="w-full bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col"
      role="region"
      aria-label={t("title")}
    >
      {/* Screen reader summary */}
      <div className="sr-only">
        <h4>{t("srSummary", { paperId })}</h4>
        <p>{t("srCounts", { entities: data.nodes.length, relationships: data.links.length })}</p>
        <ul>
          {data.nodes.map((n) => (
            <li key={n.id}>
              {t("srEntity", { name: n.name, category: n.group || "-", description: n.description || "-" })}
            </li>
          ))}
        </ul>
      </div>

      {/* Graph Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-100 text-sky-600">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">{t("title")}</h3>
            <p className="text-xs text-slate-500">
              {viewMode === "graph"
                ? t("graphHint")
                : t("tableHint")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
            <span>{t("nodes", { count: data.nodes.length })}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100">
            <span>{t("relationships", { count: data.links.length })}</span>
          </span>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Toggle Accessible Table View */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "graph" ? "table" : "graph")}
            aria-label={viewMode === "graph" ? t("toTable") : t("toGraph")}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            {viewMode === "graph" ? (
              <>
                <TableIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>{t("table")}</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>{t("graph")}</span>
              </>
            )}
          </button>

          {viewMode === "graph" && (
            <>
              <button
                type="button"
                onClick={handleZoomIn}
                aria-label={t("zoomIn")}
                title={t("zoomIn")}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                aria-label={t("zoomOut")}
                title={t("zoomOut")}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                aria-label={t("fit")}
                title={t("fit")}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Viewport */}
      {viewMode === "graph" ? (
        <div 
          className="h-[520px] w-full bg-slate-950 relative"
          role="region"
          aria-label={t("canvas")}
        >
          <ErrorBoundary 
            name="ForceGraph2D"
            fallback={
              <div className="h-full flex flex-col items-center justify-center p-6 text-slate-300 text-xs text-center space-y-3">
                <Layers className="w-8 h-8 text-slate-500" />
                <p>{t("canvasFailed")}</p>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold"
                >
                  {t("viewAsTable")}
                </button>
              </div>
            }
          >
            <ForceGraph2D
              ref={fgRef}
              graphData={data}
              nodeLabel="name"
              nodeAutoColorBy="group"
              linkDirectionalArrowLength={4}
              linkDirectionalArrowRelPos={1}
              linkCurvature={0.2}
              linkLabel={(link: LinkObject) => `${String(link.label ?? "relates")}\n${String(link.evidence ?? "")}`}
              backgroundColor="#020617"
              onNodeClick={(node: NodeObject) => {
                if (fgRef.current && node.x !== undefined && node.y !== undefined) {
                  fgRef.current.centerAt(node.x, node.y, 800);
                  fgRef.current.zoom(4, 1000);
                }
              }}
            />
          </ErrorBoundary>
        </div>
      ) : (
        /* Accessible Table View */
        <div className="h-[520px] overflow-auto p-4 bg-white">
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{t("entitiesHeading", { count: data.nodes.length })}</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">{t("colName")}</th>
                      <th className="py-2.5 px-3 font-semibold">{t("colType")}</th>
                      <th className="py-2.5 px-3 font-semibold">{t("colDescription")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.nodes.map((n) => (
                      <tr key={n.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-medium text-slate-900">{n.name}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 capitalize">
                            {n.group || "Entity"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{n.description || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{t("relationshipsHeading", { count: data.links.length })}</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">{t("colSource")}</th>
                      <th className="py-2.5 px-3 font-semibold">{t("colType")}</th>
                      <th className="py-2.5 px-3 font-semibold">{t("colTarget")}</th>
                      <th className="py-2.5 px-3 font-semibold">{t("colEvidence")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.links.map((link, idx) => {
                      const sourceName = typeof link.source === "object" ? link.source.name : link.source;
                      const targetName = typeof link.target === "object" ? link.target.name : link.target;
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-medium text-slate-900">{sourceName}</td>
                          <td className="py-2.5 px-3 text-violet-700 font-semibold">{link.label || "relates"}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">{targetName}</td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={link.evidence}>
                            {link.evidence || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function KnowledgeGraphViewer({ paperId }: { paperId: number }) {
  return (
    <ErrorBoundary name="KnowledgeGraphViewer" fallback={<KnowledgeGraphViewerSkeleton />}>
      <KnowledgeGraphViewerInternal paperId={paperId} />
    </ErrorBoundary>
  );
}
