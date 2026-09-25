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
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { Sparkles, Database, Network, Users, Eye, Edit3 } from "lucide-react";
import RichDocumentEditor from "@/components/RichDocumentEditor";
import { PreflightCheckPanel } from "@/components/sandbox/PreflightCheckPanel";
import DataScienceSandboxUI from "@/components/stage1/DataScienceSandboxUI";
import EntityHighlighter from "@/components/graph/EntityHighlighter";
import { MultiAgentDebatePanel } from "@/components/debate/MultiAgentDebatePanel";
import { SubmissionTracker } from "@/components/rpa/SubmissionTracker";
import RejectStateHandler from "@/components/cascade/RejectStateHandler";
import { RevisionRequestForm } from "@/components/pingpong/RevisionRequestForm";
import { RevisionDiffViewer } from "@/components/pingpong/RevisionDiffViewer";
import AITiptapEditor from "@/components/Editor/AITiptapEditor";
import CitationSearch from "@/components/literature/CitationSearch";
import { ExportAgentToggle } from "@/components/export/ExportAgentToggle";
import UploadClarificationModal from "@/components/stage1/UploadClarificationModal";
import { CaptchaSolver } from "@/components/submission/CaptchaSolver";
import { TwoFactorDialog } from "@/components/submission/TwoFactorDialog";


interface PaperTabsProps {
  paperId: number;
  initialStatus: string;
}

interface TabDefinition {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

export default function PaperTabs({ paperId, initialStatus }: PaperTabsProps) {
  const [activeTab, setActiveTab] = useState("Editor");

  const tabs: TabDefinition[] = [
    {
      id: "Editor",
      label: "Editor",
      icon: Edit3,
      description: "Rich text editing with AI track changes",
    },
    {
      id: "Processing",
      label: "Processing",
      icon: Sparkles,
      description: "Pipeline status & publication workflow",
    },
    {
      id: "Data Sandbox",
      label: "Data Sandbox",
      icon: Database,
      description: "Statistical analysis & data verification",
    },
    {
      id: "Knowledge Graph",
      label: "Knowledge Graph",
      icon: Network,
      description: "Entity relationships & logic validation",
    },
    {
      id: "AI Debate",
      label: "AI Debate",
      icon: Users,
      description: "Autonomous peer review & cross-examination",
    },
    {
      id: "Vision AI",
      label: "Vision AI",
      icon: Eye,
      description: "Figure extraction & visual artifact checks",
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Modern Pill Navigation Bar */}
      <div className="bg-white/70 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-sky-500 text-white shadow-xs font-semibold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="relative">
                {activeTab === "Editor" && (
          <ErrorBoundary name="Editor">
            <div className="space-y-8">
              <RichDocumentEditor documentId={String(paperId)} />
              <AITiptapEditor initialContent="" />
              <CitationSearch />
              <RevisionRequestForm onSubmit={() => {}} isLoading={false} />
              <RevisionDiffViewer originalContent="" newContent="" />
              <ExportAgentToggle paperId={String(paperId)} hasVerifiedCode={true} />
            </div>
          </ErrorBoundary>
        )}

                {activeTab === "Processing" && (
          <ErrorBoundary name="Pipeline Processing">
            <div className="space-y-8">
              <PaperProcessingUI paperId={paperId} initialStatus={initialStatus} />
              <SubmissionTracker jobId={String(paperId)} />
              <RejectStateHandler paperTitle="Sample Paper" originalJournal="Nature" recommendations={[]} />
              <UploadClarificationModal isOpen={false} onClose={() => {}} onComplete={() => {}} />
              <CaptchaSolver submissionId={String(paperId)} />
              <TwoFactorDialog isOpen={false} onClose={() => {}} onSubmit={async () => {}} />
            </div>
          </ErrorBoundary>
        )}

                {activeTab === "Data Sandbox" && (
          <ErrorBoundary name="Data Sandbox">
            <div className="space-y-8">
              <PreflightCheckPanel paperId={String(paperId)} codeSnippet="" dependencies={[]} />
              <DataScienceSandboxUI />
              <DataUploadSection paperId={paperId} />
              <AnalysisStatus paperId={paperId} />
              <GeneratedChartsViewer paperId={paperId} />
            </div>
          </ErrorBoundary>
        )}

                {activeTab === "Knowledge Graph" && (
          <ErrorBoundary name="Knowledge Graph">
            <div className="space-y-8">
              <EntityHighlighter text="" />
              <KnowledgeGraphViewer paperId={paperId} />
              <LogicConsistencyReport paperId={paperId} />
            </div>
          </ErrorBoundary>
        )}

                {activeTab === "AI Debate" && (
          <ErrorBoundary name="AI Debate Room">
            <div className="space-y-8">
              <MultiAgentDebatePanel userFindings="No initial findings" />
              <DebateRoom paperId={paperId} />
            </div>
          </ErrorBoundary>
        )}

        {activeTab === "Vision AI" && (
          <ErrorBoundary name="Vision AI Figure Gallery">
            <div className="space-y-8">
              <FigureGallery paperId={paperId} />
            </div>
          </ErrorBoundary>
        )}
      </div>
    </div>
  );
}
