"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Share2, RefreshCw, ZoomIn, ZoomOut, AlertCircle } from "lucide-react";

// @ts-ignore
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface Node {
  id: string;
  name: string;
  group: string;
  description: string;
  x?: number;
  y?: number;
}

interface Link {
  source: string | Node;
  target: string | Node;
  label: string;
  evidence: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export default function KnowledgeGraphViewer({ paperId }: { paperId: number }) {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const fgRef = useRef<any>(null);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/graph/visualize/${paperId}`);
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const json = await res.json();
      setData(json || { nodes: [], links: [] });
    } catch (err: any) {
      console.error("Knowledge graph fetch failed:", err);
      setError(err?.message || "Failed to load knowledge graph.");
    } finally {
      setLoading(false);
    }
  }, [paperId]);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  const handleResetZoom = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(800, 40);
    }
  };

  const handleZoomIn = () => {
    if (fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom * 1.3, 400);
    }
  };

  const handleZoomOut = () => {
    if (fgRef.current) {
      const currentZoom = fgRef.current.zoom();
      fgRef.current.zoom(currentZoom / 1.3, 400);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[520px] bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-center p-8">
        <LoadingSpinner
          size="lg"
          label="Constructing Knowledge Graph..."
          sublabel="Mapping scientific claims, methodologies, and cross-paper citations"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[360px] bg-red-50/50 backdrop-blur-md rounded-2xl border border-red-200 shadow-xs flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-base font-semibold text-red-900">Failed to render knowledge graph</h4>
          <p className="text-xs text-red-600 mt-1 max-w-sm">{error}</p>
        </div>
        <button
          onClick={fetchGraph}
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
      <div className="w-full h-[360px] bg-white/70 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs flex flex-col items-center justify-center p-6 text-center space-y-3">
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
          onClick={fetchGraph}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      {/* Graph Toolbar */}
      <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-100 text-sky-600">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Interactive Entity Network</h3>
            <p className="text-xs text-slate-500">Click any node to zoom in and center its citations</p>
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

          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetZoom}
            title="Fit to Screen"
            className="p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Force Graph Viewport */}
      <div className="h-[520px] w-full bg-slate-950 relative">
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
      </div>
    </div>
  );
}
