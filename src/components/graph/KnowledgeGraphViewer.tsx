"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
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

// @ts-ignore
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
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Constructing Knowledge Graph"
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
              <span className="font-semibold block text-slate-100">Constructing Knowledge Graph...</span>
              <span className="text-[11px] text-slate-400">Extracting entities and cross-paper citations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KnowledgeGraphViewerInternal({ paperId }: { paperId: number }) {
  const [data, setData] = useState<KnowledgeGraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"graph" | "table">("graph");
  const fgRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  const fetchGraph = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/graph/visualize/${paperId}`, { signal });
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const json = await res.json();
      if (!isMountedRef.current) return;

      const rawNodes = Array.isArray(json?.nodes) ? json.nodes : [];
      const rawLinks = Array.isArray(json?.links) ? json.links : [];

      setData({ nodes: rawNodes, links: rawLinks });
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      if (!isMountedRef.current) return;
      console.error("Knowledge graph fetch failed:", err);
      setError(err?.message || "Failed to load knowledge graph.");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [paperId]);

  useEffect(() => {
    isMountedRef.current = true;
    const controller = new AbortController();
    fetchGraph(controller.signal);

    return () => {
      isMountedRef.current = false;
      controller.abort();
    };
  }, [fetchGraph]);

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
          <h4 className="text-base font-semibold text-red-900">Failed to render knowledge graph</h4>
          <p className="text-xs text-red-600 mt-1 max-w-sm">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => fetchGraph()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Graph Extraction</span>
        </button>
      </div>
    );
  }

  if (!data || data.nodes.length === 0) {
    return (
      <div 
        role="region"
        aria-label="Empty Knowledge Graph"
        className="w-full h-[360px] bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center p-6 text-center space-y-3"
      >
        <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
          <Share2 className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-base font-semibold text-slate-800">No Knowledge Graph Entities Extracted</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Entities and cross-disciplinary concepts will appear once the manuscript has finished full text processing.
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchGraph()}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>
    );
  }

  return (
    <div 
      className="w-full bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col"
      role="region"
      aria-label="Paper Knowledge Graph"
    >
      {/* Screen reader summary */}
      <div className="sr-only">
        <h4>Knowledge Graph Summary for Paper #{paperId}</h4>
        <p>This graph has {data.nodes.length} entities and {data.links.length} relationships.</p>
        <ul>
          {data.nodes.map((n) => (
            <li key={n.id}>
              {n.name} (Category: {n.group || "Entity"}) - {n.description || "No description"}
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
            <h3 className="text-sm font-bold text-slate-800">Interactive Entity Network</h3>
            <p className="text-xs text-slate-500">
              {viewMode === "graph"
                ? "Click any node to zoom in and center its citations"
                : "Accessible tabular representation of graph relationships"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
            <span>{data.nodes.length} nodes</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-100">
            <span>{data.links.length} relationships</span>
          </span>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Toggle Accessible Table View */}
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "graph" ? "table" : "graph")}
            aria-label={viewMode === "graph" ? "Switch to accessible table view" : "Switch to 2D force graph"}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            {viewMode === "graph" ? (
              <>
                <TableIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Table</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>Graph</span>
              </>
            )}
          </button>

          {viewMode === "graph" && (
            <>
              <button
                type="button"
                onClick={handleZoomIn}
                aria-label="Zoom In"
                title="Zoom In"
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomOut}
                aria-label="Zoom Out"
                title="Zoom Out"
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                aria-label="Fit to Screen"
                title="Fit to Screen"
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
          aria-label="Interactive force-directed graph canvas"
        >
          <ErrorBoundary 
            name="ForceGraph2D"
            fallback={
              <div className="h-full flex flex-col items-center justify-center p-6 text-slate-300 text-xs text-center space-y-3">
                <Layers className="w-8 h-8 text-slate-500" />
                <p>2D Canvas rendering was interrupted or not supported.</p>
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 text-white text-xs font-semibold"
                >
                  View as Table
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
              linkLabel={(link: any) => `${link.label || "relates"}\n${link.evidence || ""}`}
              backgroundColor="#020617"
              onNodeClick={(node: any) => {
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
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Entities ({data.nodes.length})</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Name</th>
                      <th className="py-2.5 px-3 font-semibold">Type</th>
                      <th className="py-2.5 px-3 font-semibold">Description</th>
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
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Relationships ({data.links.length})</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Source</th>
                      <th className="py-2.5 px-3 font-semibold">Type</th>
                      <th className="py-2.5 px-3 font-semibold">Target</th>
                      <th className="py-2.5 px-3 font-semibold">Evidence</th>
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
