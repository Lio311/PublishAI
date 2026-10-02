"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
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
import { SubmissionTracker } from "@/components/rpa/SubmissionTracker";
import RejectStateHandler, { type JournalRecommendation } from "@/components/cascade/RejectStateHandler";
import CitationSearch from "@/components/literature/CitationSearch";


interface PaperTabsProps {
  paperId: number;
  paperTitle: string;
  initialStatus: string;
  journalName: string | null;
  isRejected: boolean;
  suggestedJournals: unknown[];
  manuscript: { id: string; title: string; html: string } | null;
}

function toRecommendations(suggested: unknown[]): JournalRecommendation[] {
  return suggested
    .filter((s): s is Record<string, unknown> => typeof s === "object" && s !== null && "name" in s)
    .map((s, i) => ({
      id: String(s.id ?? s.journalId ?? i),
      name: String(s.name),
      impactFactor: typeof s.impactFactor === "number" ? s.impactFactor : undefined,
      matchScore: Number(s.matchScore ?? s.score ?? 0),
      rationale: String(s.rationale ?? s.reason ?? ""),
    }));
}

interface TabDefinition {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

export default function PaperTabs({
  paperId,
  paperTitle,
  initialStatus,
  journalName,
  isRejected,
  suggestedJournals,
  manuscript,
}: PaperTabsProps) {
  const [activeTab, setActiveTab] = useState("Editor");
  const t = useTranslations("Papers");

  const tabs: TabDefinition[] = [
    {
      id: "Editor",
      label: t("tabs.editor"),
      icon: Edit3,
      description: t("tabs.editorDesc"),
    },
    {
      id: "Processing",
      label: t("tabs.processing"),
      icon: Sparkles,
      description: t("tabs.processingDesc"),
    },
    {
      id: "Data Sandbox",
      label: t("tabs.dataSandbox"),
      icon: Database,
      description: t("tabs.dataSandboxDesc"),
    },
    {
      id: "Knowledge Graph",
      label: t("tabs.knowledgeGraph"),
      icon: Network,
      description: t("tabs.knowledgeGraphDesc"),
    },
    {
      id: "AI Debate",
      label: t("tabs.aiDebate"),
      icon: Users,
      description: t("tabs.aiDebateDesc"),
    },
    {
      id: "Vision AI",
      label: t("tabs.visionAi"),
      icon: Eye,
      description: t("tabs.visionAiDesc"),
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
              <RichDocumentEditor
                documentId={manuscript?.id}
                paperId={paperId}
                initialTitle={manuscript?.title ?? paperTitle}
                initialContent={manuscript?.html ?? ""}
                {...(journalName ? { initialJournal: journalName } : {})}
              />
              <CitationSearch />
            </div>
          </ErrorBoundary>
        )}

                {activeTab === "Processing" && (
          <ErrorBoundary name="Pipeline Processing">
            <div className="space-y-8">
              <PaperProcessingUI paperId={paperId} initialStatus={initialStatus} />
              <SubmissionTracker paperId={paperId} />
              {isRejected && (
                <RejectStateHandler
                  paperTitle={paperTitle}
                  originalJournal={journalName ?? ""}
                  recommendations={toRecommendations(suggestedJournals)}
                />
              )}
            </div>
          </ErrorBoundary>
        )}

                {activeTab === "Data Sandbox" && (
          <ErrorBoundary name="Data Sandbox">
            <div className="space-y-8">
              <PreflightCheckPanel paperId={String(paperId)} codeSnippet="" dependencies={[]} />
              <DataUploadSection paperId={paperId} />
              <AnalysisStatus paperId={paperId} />
              <GeneratedChartsViewer paperId={paperId} />
            </div>
          </ErrorBoundary>
        )}

                {activeTab === "Knowledge Graph" && (
          <ErrorBoundary name="Knowledge Graph">
            <div className="space-y-8">
              <KnowledgeGraphViewer paperId={paperId} />
              <LogicConsistencyReport paperId={paperId} />
            </div>
          </ErrorBoundary>
        )}

                {activeTab === "AI Debate" && (
          <ErrorBoundary name="AI Debate Room">
            <div className="space-y-8">
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
