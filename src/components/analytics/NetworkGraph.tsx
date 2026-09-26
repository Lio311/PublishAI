'use client';

import React, { useRef, useState, useEffect, useCallback, useId } from 'react';
import { useLocale } from 'next-intl';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { AlertCircle, RefreshCw, Layers } from 'lucide-react';

export const TYPE_COLORS: Record<string, string> = {
  drug: '#3b82f6',     // blue
  protein: '#10b981',  // emerald
  gene: '#f59e0b',     // amber
  disease: '#ef4444',  // red
  concept: '#8b5cf6',  // violet
  study: '#ec4899',    // pink
  method: '#06b6d4',   // cyan
  author: '#3b82f6',   // legacy fallback
  journal: '#f59e0b',  // legacy fallback
};

export interface NetworkNode {
  id: string;
  name: string;
  type: string;
  description?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface NetworkEdge {
  source: string;
  target: string;
  type: string;
  evidenceText?: string;
  confidenceScore: number;
  sourceNode?: NetworkNode;
  targetNode?: NetworkNode;
}

export function NetworkGraphSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading network graph"
      className="w-full h-[500px] bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden flex flex-col items-center justify-center p-6 animate-pulse"
    >
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/80 px-3 py-2 rounded-lg border border-slate-200">
        <div className="w-4 h-4 rounded bg-slate-200" />
        <div className="w-24 h-3 rounded bg-slate-200" />
      </div>

      <div className="absolute top-4 right-4 bg-white/80 p-3 rounded-lg border border-slate-200 w-36 space-y-2">
        <div className="w-16 h-3 rounded bg-slate-200" />
        <div className="w-full h-2 rounded bg-slate-200" />
        <div className="w-3/4 h-2 rounded bg-slate-200" />
        <div className="w-5/6 h-2 rounded bg-slate-200" />
      </div>

      {/* SVG Skeleton placeholders for nodes & links */}
      <svg className="w-full h-full opacity-40" viewBox="0 0 800 500" aria-hidden="true">
        <line x1="250" y1="180" x2="400" y2="250" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="400" y1="250" x2="550" y2="200" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="400" y1="250" x2="350" y2="380" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="400" y1="250" x2="520" y2="360" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
        <line x1="250" y1="180" x2="350" y2="380" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />

        <circle cx="400" cy="250" r="18" fill="#94a3b8" />
        <circle cx="250" cy="180" r="14" fill="#94a3b8" />
        <circle cx="550" cy="200" r="14" fill="#94a3b8" />
        <circle cx="350" cy="380" r="14" fill="#94a3b8" />
        <circle cx="520" cy="360" r="14" fill="#94a3b8" />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="bg-white/90 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5 text-xs font-medium text-slate-600">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          <span>Simulating GraphRAG Knowledge Network...</span>
        </div>
      </div>
      <span className="sr-only">Loading graph network data...</span>
    </div>
  );
}

function NetworkGraphInternal() {
  const locale = useLocale();
  const isHe = locale === 'he';
  const graphTitleId = useId();
  const graphDescId = useId();
  
  const nodesRef = useRef<NetworkNode[]>([]);
  const edgesRef = useRef<NetworkEdge[]>([]);
  const [, forceRender] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  const width = 800;
  const height = 500;

  const fetchData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    setSelectedNode(null);

    try {
      const res = await fetch('/api/graph/network', { signal });
      if (!res.ok) throw new Error(`Failed to fetch graph data (${res.status})`);
      const data = await res.json();

      if (!isMountedRef.current) return;

      const rawNodes = Array.isArray(data?.nodes) ? data.nodes : [];
      const rawEdges = Array.isArray(data?.edges) ? data.edges : [];

      // Initialize nodes with distributed positions
      const initializedNodes: NetworkNode[] = rawNodes.map((n: any, idx: number) => {
        const angle = (idx / (rawNodes.length || 1)) * 2 * Math.PI;
        const radius = 100 + Math.random() * 80;
        return {
          ...n,
          id: String(n.id || idx),
          name: String(n.name || 'Unnamed'),
          type: String(n.type || 'concept').toLowerCase(),
          description: n.description || '',
          x: width / 2 + Math.cos(angle) * radius,
          y: height / 2 + Math.sin(angle) * radius,
          vx: 0,
          vy: 0,
        };
      });

      // Link edges to node objects
      const initializedEdges: NetworkEdge[] = rawEdges
        .map((e: any) => ({
          ...e,
          confidenceScore: typeof e.confidenceScore === 'number' ? e.confidenceScore : 0.8,
          sourceNode: initializedNodes.find((n) => n.id === String(e.source)),
          targetNode: initializedNodes.find((n) => n.id === String(e.target)),
        }))
        .filter((e: NetworkEdge): e is NetworkEdge & { sourceNode: NetworkNode; targetNode: NetworkNode } => 
          Boolean(e.sourceNode && e.targetNode)
        );

      nodesRef.current = initializedNodes;
      edgesRef.current = initializedEdges;
      setLoading(false);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      if (!isMountedRef.current) return;
      console.error('Network graph fetch error:', err);
      setError(err?.message || 'Could not load network graph');
      setLoading(false);
    }
  }, [width, height]);

  useEffect(() => {
    isMountedRef.current = true;
    const controller = new AbortController();
    fetchData(controller.signal);

    return () => {
      isMountedRef.current = false;
      controller.abort();
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [fetchData]);

  // Force Directed Simulation Loop
  useEffect(() => {
    if (loading || nodesRef.current.length === 0) return;

    let isSimulating = true;

    const tick = () => {
      if (!isMountedRef.current || !isSimulating) return;

      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;
      const alpha = 0.08; // cooling factor

      // 1. Repulsion (charge) between all nodes
      for (let i = 0; i < currentNodes.length; i++) {
        for (let j = i + 1; j < currentNodes.length; j++) {
          const a = currentNodes[i];
          const b = currentNodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 1) continue;

          const dist = Math.sqrt(distSq);
          const force = 3200 / Math.max(distSq, 100);

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (!isNaN(fx) && !isNaN(fy)) {
            a.vx -= fx * alpha;
            a.vy -= fy * alpha;
            b.vx += fx * alpha;
            b.vy += fy * alpha;
          }
        }
      }

      // 2. Attraction (links/springs)
      for (const edge of currentEdges) {
        if (!edge.sourceNode || !edge.targetNode) continue;
        const dx = edge.targetNode.x - edge.sourceNode.x;
        const dy = edge.targetNode.y - edge.sourceNode.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq);
        if (dist === 0) continue;

        const idealDistance = 110;
        const force = (dist - idealDistance) * 0.04;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (!isNaN(fx) && !isNaN(fy)) {
          edge.sourceNode.vx += fx * alpha;
          edge.sourceNode.vy += fy * alpha;
          edge.targetNode.vx -= fx * alpha;
          edge.targetNode.vy -= fy * alpha;
        }
      }

      // 3. Gravity (pull towards center)
      const centerX = width / 2;
      const centerY = height / 2;
      for (const node of currentNodes) {
        node.vx += (centerX - node.x) * 0.015 * alpha;
        node.vy += (centerY - node.y) * 0.015 * alpha;

        // Apply velocity and damping
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.88;
        node.vy *= 0.88;

        // Bounds checking
        node.x = Math.max(30, Math.min(width - 30, node.x));
        node.y = Math.max(30, Math.min(height - 30, node.y));
      }

      forceRender({});

      // Continue simulation if kinetic energy remains
      const totalEnergy = currentNodes.reduce(
        (sum, n) => sum + Math.abs(n.vx) + Math.abs(n.vy),
        0
      );

      if (totalEnergy > 0.4 && isSimulating && isMountedRef.current) {
        requestRef.current = requestAnimationFrame(tick);
      }
    };

    requestRef.current = requestAnimationFrame(tick);

    return () => {
      isSimulating = false;
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [loading, width, height]);

  // Extract unique types present in current nodes for dynamic legend
  const presentTypes = Array.from(
    new Set(nodesRef.current.map((n) => n.type.toLowerCase()))
  );
  const legendTypes = presentTypes.length > 0 
    ? presentTypes 
    : Object.keys(TYPE_COLORS).slice(0, 5);

  if (loading) {
    return <NetworkGraphSkeleton />;
  }

  if (error) {
    return (
      <div 
        role="alert"
        className="w-full h-[500px] flex flex-col items-center justify-center bg-red-50/70 border border-red-200 rounded-xl p-6 text-center space-y-3"
      >
        <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-red-900">
            {isHe ? 'שגיאה בטעינת תרשים הרשת' : 'Failed to load network graph'}
          </h4>
          <p className="text-xs text-red-600 mt-1 max-w-sm">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => fetchData()}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isHe ? 'נסה שוב' : 'Retry'}</span>
        </button>
      </div>
    );
  }

  if (nodesRef.current.length === 0) {
    return (
      <div className="w-full h-[500px] flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
          <Layers className="w-5 h-5" />
        </div>
        <p className="text-sm text-slate-500 font-medium">
          {isHe ? 'אין נתונים עדיין ב-GraphRAG.' : 'No data in GraphRAG yet.'}
        </p>
        <button
          type="button"
          onClick={() => fetchData()}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isHe ? 'רענן' : 'Refresh'}</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="w-full h-[500px] bg-slate-900 border border-slate-800 rounded-xl overflow-hidden relative shadow-sm"
      ref={containerRef}
      role="region"
      aria-label={isHe ? 'תרשים רשת מושגים מדעיים' : 'Scientific concept network graph'}
    >
      {/* Screen reader data alternative */}
      <div className="sr-only">
        <h4>{isHe ? 'נתוני רשת ישויות' : 'Entity Network Data'}</h4>
        <p>
          {isHe
            ? `הרשת כוללת ${nodesRef.current.length} ישויות ו-${edgesRef.current.length} קשרים.`
            : `The network contains ${nodesRef.current.length} entities and ${edgesRef.current.length} relationships.`}
        </p>
        <ul>
          {nodesRef.current.map((n) => (
            <li key={n.id}>
              {n.name} ({n.type}) - {n.description || 'No description'}
            </li>
          ))}
        </ul>
      </div>

      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-labelledby={`${graphTitleId} ${graphDescId}`}
      >
        <title id={graphTitleId}>
          {isHe ? 'גרף קשרי ישויות מדעיות' : 'Scientific Entity Network'}
        </title>
        <desc id={graphDescId}>
          {isHe
            ? 'גרף אינטראקטיבי המציג קשרים בין תרופות, חלבונים, גנים ומושגים'
            : 'Interactive graph displaying relationships between drugs, proteins, genes, and scientific concepts.'}
        </desc>

        {/* Draw Edges */}
        <g stroke="#475569" strokeOpacity={0.6} aria-hidden="true">
          {edgesRef.current.map((edge, i) => (
            <line
              key={`edge-${i}`}
              x1={edge.sourceNode?.x}
              y1={edge.sourceNode?.y}
              x2={edge.targetNode?.x}
              y2={edge.targetNode?.y}
              strokeWidth={Math.max(1, (edge.confidenceScore || 0.5) * 2.5)}
              stroke={
                selectedNode && (edge.source === selectedNode.id || edge.target === selectedNode.id)
                  ? '#38bdf8'
                  : '#475569'
              }
              opacity={
                selectedNode
                  ? edge.source === selectedNode.id || edge.target === selectedNode.id
                    ? 1
                    : 0.2
                  : 0.6
              }
            />
          ))}
        </g>

        {/* Draw Nodes */}
        <g>
          {nodesRef.current.map((node) => {
            const isSelected = selectedNode?.id === node.id;
            const nodeColor = TYPE_COLORS[node.type] || '#94a3b8';

            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                tabIndex={0}
                role="button"
                aria-label={`${node.name}, type: ${node.type}${node.description ? `, ${node.description}` : ''}`}
                aria-pressed={isSelected}
                className="cursor-pointer focus:outline-none group"
                onClick={() => setSelectedNode(isSelected ? null : node)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedNode(isSelected ? null : node);
                  }
                }}
              >
                {/* Focus indicator ring */}
                <circle
                  r={isSelected ? 18 : 15}
                  fill="none"
                  stroke={isSelected ? '#38bdf8' : '#ffffff'}
                  strokeWidth={isSelected ? 3 : 0}
                  className="transition-all group-focus:stroke-2 group-focus:stroke-amber-400"
                />

                <circle
                  r={12}
                  fill={nodeColor}
                  stroke="#ffffff"
                  strokeWidth={2}
                  className="transition-transform group-hover:scale-125"
                />

                {/* Node Label with outline for contrast */}
                <text
                  dy={22}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#f1f5f9"
                  stroke="#0f172a"
                  strokeWidth={3}
                  paintOrder="stroke"
                  className="pointer-events-none font-medium select-none"
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Selected Node Details Card */}
      {selectedNode && (
        <div
          className={`absolute bottom-4 ${isHe ? 'right-4' : 'left-4'} max-w-xs bg-slate-800/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-700 text-white shadow-lg text-xs space-y-1.5 z-10`}
          role="region"
          aria-live="polite"
          aria-label={isHe ? 'פרטי ישות נבחרת' : 'Selected entity details'}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-sm text-slate-100">{selectedNode.name}</span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white capitalize"
              style={{ backgroundColor: TYPE_COLORS[selectedNode.type] || '#64748b' }}
            >
              {selectedNode.type}
            </span>
          </div>
          {selectedNode.description && (
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {selectedNode.description}
            </p>
          )}
          <button
            type="button"
            onClick={() => setSelectedNode(null)}
            className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer pt-1"
          >
            {isHe ? 'סגור פרטים' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Legend */}
      <div
        className={`absolute top-4 ${isHe ? 'right-4' : 'left-4'} bg-slate-800/90 backdrop-blur-md p-3 rounded-lg border border-slate-700 shadow-sm text-xs`}
        aria-label={isHe ? 'מקרא סוגי ישויות' : 'Entity type legend'}
      >
        <div className="font-semibold mb-2 text-slate-200">
          {isHe ? 'סוגי ישויות' : 'Entity Types'}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {legendTypes.map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: TYPE_COLORS[type] || '#94a3b8' }}
                aria-hidden="true"
              />
              <span className="capitalize text-slate-300 text-[11px]">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function NetworkGraph() {
  return (
    <ErrorBoundary name="NetworkGraph" fallback={<NetworkGraphSkeleton />}>
      <NetworkGraphInternal />
    </ErrorBoundary>
  );
}
