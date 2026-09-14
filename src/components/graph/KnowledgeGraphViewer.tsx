"use client";

import React, { useEffect, useState, useRef } from "react";
// @ts-ignore
import ForceGraph2D from "react-force-graph-2d";

interface Node {
  id: string;
  name: string;
  group: string;
  description: string;
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
  const fgRef = useRef<any>(null);

  useEffect(() => {
    fetch(`/api/graph/visualize/${paperId}`)
      .then(res => res.json())
      .then(setData);
  }, [paperId]);

  if (!data) return <div>Loading Knowledge Graph...</div>;

  return (
    <div style={{ height: "600px", width: "100%", border: "1px solid #ccc", borderRadius: "8px" }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={data}
        nodeLabel="name"
        nodeAutoColorBy="group"
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.25}
        linkLabel={(link: any) => `${link.label}\\n${link.evidence}`}
        onNodeClick={(node: any) => {
          // Center/zoom on node
          if (fgRef.current) {
            fgRef.current.centerAt(node.x, node.y, 1000);
            fgRef.current.zoom(8, 2000);
          }
        }}
      />
    </div>
  );
}
