"use client";

import React, { useState } from "react";
import {
  FileText,
  Plus,
  Upload,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  ExternalLink,
  MoreVertical,
  BookOpen,
  Send,
  Filter,
} from "lucide-react";

export interface ManuscriptItem {
  id: string;
  title: string;
  journal: string;
  category: string;
  status: "draft" | "review" | "revision" | "accepted";
  updatedAt: string;
  wordCount: number;
  progress: number;
}

export interface DashboardProps {
  userName?: string;
  manuscripts?: ManuscriptItem[];
  onNewDocument?: () => void;
  onOpenDocument?: (id: string) => void;
  onImportDocument?: () => void;
}

const DEFAULT_MANUSCRIPTS: ManuscriptItem[] = [
  {
    id: "doc-1",
    title: "Deep Learning for Genomic Variant Interpretation: A Multi-Omics Perspective",
    journal: "Nature Biotechnology",
    category: "Bioinformatics",
    status: "revision",
    updatedAt: "2 hours ago",
    wordCount: 6840,
    progress: 78,
  },
  {
    id: "doc-2",
    title: "Zero-Shot Protein Structure Alignment Using Hyperbolic Geometric Transformers",
    journal: "Cell Systems",
    category: "Computational Biology",
    status: "review",
    updatedAt: "Yesterday",
    wordCount: 8120,
    progress: 95,
  },
  {
    id: "doc-3",
    title: "Automated Evidence Synthesis in Systematic Reviews via LLM Debate Protocols",
    journal: "Bioinformatics (Oxford)",
    category: "Machine Learning",
    status: "draft",
    updatedAt: "3 days ago",
    wordCount: 3420,
    progress: 42,
  },
  {
    id: "doc-4",
    title: "High-Throughput Single-Cell RNA-seq Quantification of Cardiomyocyte Differentiation",
    journal: "Scientific Reports",
    category: "Genomics",
    status: "accepted",
    updatedAt: "1 week ago",
    wordCount: 9240,
    progress: 100,
  },
];

export default function Dashboard({
  userName = "Researcher",
  manuscripts = DEFAULT_MANUSCRIPTS,
  onNewDocument,
  onOpenDocument,
  onImportDocument,
}: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const filteredManuscripts = manuscripts.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.journal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (selectedFilter === "all") return matchesSearch;
    return matchesSearch && item.status === selectedFilter;
  });

  const getStatusBadge = (status: ManuscriptItem["status"]) => {
    switch (status) {
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Accepted
          </span>
        );
      case "revision":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" /> Revision Requested
          </span>
        );
      case "review":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            <Clock className="w-3 h-3 text-blue-600" /> Under Review
          </span>
        );
      case "draft":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <FileText className="w-3 h-3 text-slate-500" /> Draft
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-8 font-sans">
      {/* Top Header & Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur border border-slate-200/80 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
              PublishAI MVP
            </span>
            <span className="text-xs text-slate-500">Autonomous Publication Hub</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Welcome back, {userName}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Prepare, polish, and submit your research manuscripts with agentic peer-review intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onImportDocument}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm cursor-pointer"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            Import (.docx / .pdf)
          </button>
          <button
            onClick={onNewDocument}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-xl hover:bg-sky-700 transition-all shadow-sm shadow-sky-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Manuscript
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Manuscripts
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">4</span>
            <span className="text-xs font-medium text-emerald-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +2 this month
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">1 ready for final submission</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Peer Review Status
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">1 Revision</span>
            <span className="text-xs text-slate-500">2 pending</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Nature Biotech comments imported</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Citations Verified
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">142</span>
            <span className="text-xs font-medium text-indigo-600">99.3% accuracy</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Crossref & PubMed matched</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              AI Publication Score
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">94 / 100</span>
            <span className="text-xs font-medium text-emerald-600">High Acceptance</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">Compliance & novelty verified</p>
        </div>
      </div>

      {/* Main Content Area: Manuscripts List & Filter */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Controls Bar */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-900 text-lg">My Manuscripts</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
              {filteredManuscripts.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search title, journal, tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all w-56 md:w-64"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-200/60 p-1 rounded-xl text-xs font-medium text-slate-600">
              {["all", "draft", "review", "revision", "accepted"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                    selectedFilter === filter
                      ? "bg-white text-slate-900 shadow-xs font-semibold"
                      : "hover:text-slate-900"
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Manuscripts Table/List */}
        <div className="divide-y divide-slate-100">
          {filteredManuscripts.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">No manuscripts found</p>
              <p className="text-xs text-slate-400 mt-1">
                Try adjusting your search criteria or create a new paper.
              </p>
            </div>
          ) : (
            filteredManuscripts.map((item) => (
              <div
                key={item.id}
                className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(item.status)}
                    <span className="text-xs font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                      {item.journal}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{item.category}</span>
                  </div>

                  <h3
                    onClick={() => onOpenDocument?.(item.id)}
                    className="text-base font-semibold text-slate-900 hover:text-sky-600 transition-colors cursor-pointer"
                  >
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{item.wordCount.toLocaleString()} words</span>
                    <span>•</span>
                    <span>Updated {item.updatedAt}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      Completion: {item.progress}%
                    </span>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onOpenDocument?.(item.id)}
                    className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs cursor-pointer"
                  >
                    Open Editor
                  </button>
                  <button
                    title="Quick actions"
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Features & Agent Status Highlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-linear-to-br from-sky-50 to-blue-50/40 border border-sky-100 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-sky-800 font-semibold text-sm mb-2">
            <Sparkles className="w-4 h-4 text-sky-600" /> AI Co-Author & Synthesis
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Generate manuscript sections with inline citation binding to PubMed, Crossref, and preprint databases.
          </p>
        </div>

        <div className="bg-linear-to-br from-amber-50 to-orange-50/40 border border-amber-100 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm mb-2">
            <AlertCircle className="w-4 h-4 text-amber-600" /> Automated Peer Reviewer
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Simulate harsh peer reviewer critiques, uncover logical gaps, and draft point-by-point rebuttal responses.
          </p>
        </div>

        <div className="bg-linear-to-br from-emerald-50 to-teal-50/40 border border-emerald-100 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm mb-2">
            <Send className="w-4 h-4 text-emerald-600" /> One-Click Journal Submission
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Auto-format manuscript style, references, and supplementary files to match target journal author guidelines.
          </p>
        </div>
      </div>
    </div>
  );
}
