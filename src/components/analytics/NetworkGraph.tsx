"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';

const TYPE_COLORS: Record<string, string> = {
  drug: '#3b82f6', // blue
  protein: '#10b981', // emerald
  gene: '#f59e0b', // amber
  disease: '#ef4444', // red
  concept: '#8b5cf6', // violet
  study: '#ec4899', // pink
  method: '#06b6d4', // cyan
};

interface Node {
  id: string;
  name: string;
  type: string;
  description?: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Edge {
  source: string;
  target: string;
  type: string;
  evidenceText?: string;
  confidenceScore: number;
  sourceNode?: Node;
  targetNode?: Node;
}

export default function NetworkGraph() {
  const locale = useLocale();
  const isHe = locale === 'he';
  
  const nodesRef = useRef<Node[]>([]);
  const edgesRef = useRef<Edge[]>([]);
  const [, forceRender] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const width = 800;
  const height = 500;

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/graph/network');
        if (!res.ok) throw new Error('Failed to fetch graph data');
        const data = await res.json();
        
        // Initialize nodes with random positions
        const initializedNodes = data.nodesRef.current.map((n: any) => ({
          ...n,
          x: width / 2 + (Math.random() - 0.5) * 100,
          y: height / 2 + (Math.random() - 0.5) * 100,
          vx: 0,
          vy: 0
        }));
        
        // Link edges to node objects
        const initializedEdges = data.edgesRef.current.map((e: any) => ({
          ...e,
          sourceNode: initializedNodes.find((n: Node) => n.id === e.source),
          targetNode: initializedNodes.find((n: Node) => n.id === e.target)
        })).filter((e: Edge) => e.sourceNode && e.targetNode);

        nodesRef.current = initializedNodes;
        edgesRef.current = initializedEdges;
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Could not load network graph');
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  // Force Directed Simulation Loop
  useEffect(() => {
    if (nodesRef.current.length === 0 || loading) return;

    const tick = () => {
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;
      
      const alpha = 0.1; // cooling factor
      
      // 1. Repulsion (charge) between all nodes
      for (let i = 0; i < currentNodes.length; i++) {
        for (let j = i + 1; j < currentNodes.length; j++) {
          const a = currentNodes[i];
          const b = currentNodes[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distSq = dx * dx + dy * dy;
          if (distSq === 0) continue;
          
          const dist = Math.sqrt(distSq);
          const force = 3000 / distSq; // Repel force
          
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          a.vx -= fx * alpha;
          a.vy -= fy * alpha;
          b.vx += fx * alpha;
          b.vy += fy * alpha;
        }
      }
      
      // 2. Attraction (links/springs)
      for (const edge of currentEdges) {
        if (!edge.sourceNode || !edge.targetNode) continue;
        const dx = edge.targetNode.x - edge.sourceNode.x;
        const dy = edge.targetNode.y - edge.sourceNode.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const idealDistance = 100;
        const force = (dist - idealDistance) * 0.05; // Spring stiffness
        
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        edge.sourceNode.vx += fx * alpha;
        edge.sourceNode.vy += fy * alpha;
        edge.targetNode.vx -= fx * alpha;
        edge.targetNode.vy -= fy * alpha;
      }
      
      // 3. Gravity (pull towards center)
      const centerX = width / 2;
      const centerY = height / 2;
      for (const node of currentNodes) {
        node.vx += (centerX - node.x) * 0.02 * alpha;
        node.vy += (centerY - node.y) * 0.02 * alpha;
        
        // Apply velocity and damping
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= 0.9; // Damping
        node.vy *= 0.9;
        
        // Bounds checking
        node.x = Math.max(20, Math.min(width - 20, node.x));
        node.y = Math.max(20, Math.min(height - 20, node.y));
      }
      
      forceRender({});
      
      // Keep simulating if there's enough energy
      let totalEnergy = currentNodes.reduce((sum, n) => sum + Math.abs(n.vx) + Math.abs(n.vy), 0);
      if (totalEnergy > 0.5) {
        requestRef.current = requestAnimationFrame(tick);
      }
    };

    requestRef.current = requestAnimationFrame(tick);
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [loading]);

  if (loading) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-red-50 text-red-600 border border-red-200 rounded-xl">
        {error}
      </div>
    );
  }

  if (nodesRef.current.length === 0) {
    return (
      <div className="w-full h-[500px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-xl text-gray-500">
        {isHe ? 'אין נתונים עדיין ב-GraphRAG.' : 'No data in GraphRAG yet.'}
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] bg-white border border-gray-200 rounded-xl overflow-hidden relative shadow-sm" ref={containerRef}>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid slice">
        {/* Draw Edges */}
        <g stroke="#e2e8f0" strokeOpacity={0.6}>
          {edgesRef.current.map((edge, i) => (
            <line 
              key={i}
              x1={edge.sourceNode?.x}
              y1={edge.sourceNode?.y}
              x2={edge.targetNode?.x}
              y2={edge.targetNode?.y}
              strokeWidth={Math.max(1, edge.confidenceScore * 3)}
              opacity={edge.confidenceScore}
            />
          ))}
        </g>
        
        {/* Draw Nodes */}
        <g>
          {nodesRef.current.map(node => (
            <g key={node.id} transform={`translate(${node.x},${node.y})`}>
              <circle 
                r={12} 
                fill={TYPE_COLORS[node.type] || '#94a3b8'} 
                stroke="#fff" 
                strokeWidth={2}
                className="cursor-pointer transition-transform hover:scale-125"
              >
                <title>{`${node.name} (${node.type})\n${node.description || ''}`}</title>
              </circle>
              <text 
                dy={24} 
                textAnchor="middle" 
                fontSize={10} 
                fill="#475569" 
                className="pointer-events-none font-medium"
              >
                {node.name}
              </text>
            </g>
          ))}
        </g>
      </svg>
      
      {/* Legend */}
      <div className={`absolute top-4 ${isHe ? 'right-4' : 'left-4'} bg-white/90 backdrop-blur p-3 rounded-lg border border-gray-200 shadow-sm text-xs`}>
        <div className="font-semibold mb-2">{isHe ? 'סוגי ישויות' : 'Entity Types'}</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
              <span className="capitalize text-gray-600">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
