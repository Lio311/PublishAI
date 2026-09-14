"use client";

import React, { useState } from "react";
import PaperProcessingUI from "@/components/papers/PaperProcessingUI";
import { DataUploadSection } from "@/components/sandbox/DataUploadSection";
import { AnalysisStatus } from "@/components/sandbox/AnalysisStatus";
import { GeneratedChartsViewer } from "@/components/sandbox/GeneratedChartsViewer";
import KnowledgeGraphViewer from "@/components/graph/KnowledgeGraphViewer";
import LogicConsistencyReport from "@/components/graph/LogicConsistencyReport";
import DebateRoom from "@/components/debates/DebateRoom";
import FigureGallery from "@/components/vision/FigureGallery";

interface PaperTabsProps {
  paperId: number;
  initialStatus: string;
}

export default function PaperTabs({ paperId, initialStatus }: PaperTabsProps) {
  const [activeTab, setActiveTab] = useState("Processing");

  const tabs = [
    "Processing",
    "Data Sandbox",
    "Knowledge Graph",
    "AI Debate",
    "Vision AI"
  ];

  return (
    <div className="w-full">
      <div className="flex border-b border-gray-200 mb-6 space-x-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`py-2 px-4 border-b-2 font-medium text-sm focus:outline-none transition-colors ${
              activeTab === tab
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {activeTab === "Processing" && (
          <PaperProcessingUI paperId={paperId} initialStatus={initialStatus} />
        )}
        
        {activeTab === "Data Sandbox" && (
          <div className="space-y-8">
            <DataUploadSection paperId={paperId} />
            <AnalysisStatus paperId={paperId} />
            <GeneratedChartsViewer paperId={paperId} />
          </div>
        )}
        
        {activeTab === "Knowledge Graph" && (
          <div className="space-y-8">
            <KnowledgeGraphViewer paperId={paperId} />
            <LogicConsistencyReport paperId={paperId} />
          </div>
        )}
        
        {activeTab === "AI Debate" && (
          <div className="space-y-8">
            <DebateRoom debateId={paperId.toString()} />
          </div>
        )}
        
        {activeTab === "Vision AI" && (
          <div className="space-y-8">
            <FigureGallery paperId={paperId} />
          </div>
        )}
      </div>
    </div>
  );
}
