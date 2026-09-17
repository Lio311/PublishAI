"use client";

import React, { useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  FileText,
  Save,
  Download,
  Share2,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Send,
  RefreshCw,
  Search,
  Check,
  Eye,
} from "lucide-react";

export interface DocumentSection {
  id: string;
  title: string;
  wordCount: number;
}

export interface DocumentEditorProps {
  documentId?: string;
  initialTitle?: string;
  initialJournal?: string;
  initialContent?: string;
  onSave?: (content: string, title: string) => void;
  onExport?: (format: "docx" | "pdf" | "latex") => void;
  onSubmitToJournal?: () => void;
}

const DEFAULT_SECTIONS: DocumentSection[] = [
  { id: "abstract", title: "Abstract", wordCount: 245 },
  { id: "intro", title: "1. Introduction", wordCount: 1120 },
  { id: "methods", title: "2. Materials & Methods", wordCount: 1850 },
  { id: "results", title: "3. Results", wordCount: 2310 },
  { id: "discussion", title: "4. Discussion", wordCount: 1420 },
  { id: "references", title: "References", wordCount: 540 },
];

const SAMPLE_CONTENT = `# Deep Learning for Genomic Variant Interpretation: A Multi-Omics Perspective

## Abstract
Recent advances in deep learning architectures, particularly foundation models pretrained on genomic, transcriptomic, and proteomic sequences, offer unprecedented opportunities to decipher non-coding variant consequences. However, systematic benchmarking across complex disease phenotypes remains limited. Here, we present PublishAI-Genetics, an end-to-end multi-modal transformer framework that unifies chromatin accessibility profiles, 3D genome conformation maps, and evolutionary conservation scores to predict functional pathogenic variants with high sensitivity and specificity.

## 1. Introduction
Deciphering the pathogenicity of non-coding genetic variants represents one of the foremost challenges in modern human genetics. While genome-wide association studies (GWAS) have identified tens of thousands of loci associated with complex human diseases, over 90% of identified variants reside in non-coding regulatory sequences [1].

Traditional variant effect predictors typically rely on evolutionary conservation metrics or linear sequence motifs. While valuable, these approaches frequently overlook spatial genome organization, cell-type specific chromatin dynamics, and synergistic regulatory networks.

## 2. Materials & Methods
### 2.1 Multi-Omics Dataset Integration
We aggregated high-resolution chromatin conformation capture (Hi-C) contact maps, single-cell ATAC-seq, and CAGE-seq expression profiles spanning 128 human tissue types from ENCODE and the Roadmap Epigenomics Project.

### 2.2 Model Architecture
The core model incorporates an axial self-attention transformer backbone with hyperbolic latent projections to capture hierarchical genomic dependencies across multi-megabase genomic loci.`;

export default function DocumentEditor({
  documentId = "doc-new",
  initialTitle = "Deep Learning for Genomic Variant Interpretation: A Multi-Omics Perspective",
  initialJournal = "Nature Biotechnology",
  initialContent = SAMPLE_CONTENT,
  onSave,
  onExport,
  onSubmitToJournal,
}: DocumentEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [journal, setJournal] = useState(initialJournal);
  const [content, setContent] = useState(initialContent);
  const [activeSection, setActiveSection] = useState("abstract");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [rightTab, setRightTab] = useState<"copilot" | "citations" | "compliance">("copilot");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Derived statistics
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const characterCount = content.length;
  const estimatedReadingTime = Math.ceil(wordCount / 220);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setSaveStatus("unsaved");
  };

  const handleManualSave = () => {
    setSaveStatus("saving");
    setTimeout(() => {
      onSave?.(content, title);
      setSaveStatus("saved");
    }, 600);
  };

  const handleAiAction = (actionType: string) => {
    setIsAiGenerating(true);
    setTimeout(() => {
      setIsAiGenerating(false);
      if (actionType === "abstract") {
        setContent(
          (prev) =>
            prev +
            "\n\n### AI Suggestion: Enhanced Abstract\n" +
            "Our benchmarking across 14 independent clinical cohort datasets demonstrates a 18.4% improvement in AUROC over existing state-of-the-art predictors, providing actionable mechanistic insights for variant prioritization."
        );
        setSaveStatus("unsaved");
      }
    }, 1200);
  };

  const insertFormatting = (prefix: string, suffix: string = "") => {
    setContent((prev) => prev + `\n${prefix}Sample Text${suffix}\n`);
    setSaveStatus("unsaved");
  };

  return (
    <div className="w-full flex flex-col h-[calc(100vh-6rem)] bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden font-sans">
      {/* Document Top Bar */}
      <header className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSaveStatus("unsaved");
              }}
              aria-label="Document Title"
              className="text-base md:text-lg font-bold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-sky-500 rounded px-1 w-full truncate"
            />
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="font-medium text-slate-700">Target:</span>
              <select
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                aria-label="Target Journal"
                className="bg-transparent border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                <option>Nature Biotechnology</option>
                <option>Cell Systems</option>
                <option>Bioinformatics (Oxford)</option>
                <option>PLOS Computational Biology</option>
                <option>Scientific Reports</option>
              </select>
              <span>•</span>
              <span className="flex items-center gap-1">
                {saveStatus === "saved" && (
                  <span className="text-emerald-600 flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Saved
                  </span>
                )}
                {saveStatus === "saving" && (
                  <span className="text-sky-600 flex items-center gap-0.5">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Saving...
                  </span>
                )}
                {saveStatus === "unsaved" && (
                  <span className="text-amber-600 flex items-center gap-0.5">
                    <AlertCircle className="w-3 h-3" /> Unsaved
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleManualSave}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            Save
          </button>
          <button
            onClick={() => onExport?.("docx")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export
          </button>
          <button
            onClick={onSubmitToJournal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Submit Journal
          </button>
        </div>
      </header>

      {/* Editor Formatting Toolbar */}
      <div className="px-4 py-2 border-b border-slate-200 bg-white flex items-center gap-1 overflow-x-auto shrink-0 text-slate-700 text-xs">
        <button
          onClick={() => insertFormatting("**", "**")}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertFormatting("*", "*")}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <button
          onClick={() => insertFormatting("# ")}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertFormatting("## ")}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertFormatting("### ")}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <button
          onClick={() => insertFormatting("- ")}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertFormatting("1. ")}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertFormatting("> ")}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          onClick={() => insertFormatting("```\n", "\n```")}
          className="p-1.5 hover:bg-slate-100 rounded text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <button
          onClick={() => insertFormatting("[@citation_key]")}
          className="px-2 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" /> + Citation
        </button>
        <button
          onClick={() => insertFormatting("![Figure 1: Caption](figure1.png)")}
          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-medium transition-colors cursor-pointer"
        >
          + Figure
        </button>
        <button
          onClick={() => insertFormatting("$$ E = mc^2 $$")}
          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-medium transition-colors cursor-pointer"
        >
          + LaTeX
        </button>
      </div>

      {/* Main Workspace Area (3 Columns: Section Navigator, Text Area, AI Drawer) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Section Outline */}
        <aside className="w-56 border-r border-slate-200 bg-slate-50/40 p-3 hidden lg:flex flex-col shrink-0 overflow-y-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-2 mb-2">
            Sections
          </span>
          <div className="space-y-1">
            {DEFAULT_SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  activeSection === sec.id
                    ? "bg-sky-100/70 text-sky-900 font-semibold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="truncate">{sec.title}</span>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {sec.wordCount}w
                </span>
              </button>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-slate-200 text-xs text-slate-500 space-y-1 px-2">
            <div className="flex justify-between">
              <span>Total words:</span>
              <span className="font-semibold text-slate-700">{wordCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Reading time:</span>
              <span className="text-slate-700">~{estimatedReadingTime} min</span>
            </div>
            <div className="flex justify-between">
              <span>Characters:</span>
              <span className="text-slate-700">{characterCount.toLocaleString()}</span>
            </div>
          </div>
        </aside>

        {/* Center Main Editor View */}
        <main className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto">
          <div className="p-6 md:p-8 max-w-3xl mx-auto w-full flex-1 flex flex-col">
            <textarea
              value={content}
              onChange={handleContentChange}
              placeholder="Begin drafting your scientific paper here using markdown..."
              aria-label="Document Content"
              className="w-full flex-1 min-h-[500px] text-sm md:text-base leading-relaxed text-slate-800 placeholder-slate-400 bg-transparent border-none focus:outline-none resize-none font-mono"
            />
          </div>
        </main>

        {/* Right Panel: AI Co-Pilot & Compliance */}
        <aside className="w-80 border-l border-slate-200 bg-slate-50/50 flex flex-col shrink-0 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-white text-xs font-medium text-slate-600">
            <button
              onClick={() => setRightTab("copilot")}
              className={`flex-1 py-2.5 text-center transition-colors cursor-pointer ${
                rightTab === "copilot"
                  ? "border-b-2 border-sky-600 text-sky-700 font-semibold"
                  : "hover:text-slate-900"
              }`}
            >
              AI Co-Pilot
            </button>
            <button
              onClick={() => setRightTab("citations")}
              className={`flex-1 py-2.5 text-center transition-colors cursor-pointer ${
                rightTab === "citations"
                  ? "border-b-2 border-sky-600 text-sky-700 font-semibold"
                  : "hover:text-slate-900"
              }`}
            >
              Citations
            </button>
            <button
              onClick={() => setRightTab("compliance")}
              className={`flex-1 py-2.5 text-center transition-colors cursor-pointer ${
                rightTab === "compliance"
                  ? "border-b-2 border-sky-600 text-sky-700 font-semibold"
                  : "hover:text-slate-900"
              }`}
            >
              Compliance
            </button>
          </div>

          {/* Right Panel Content */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
            {rightTab === "copilot" && (
              <div className="space-y-3">
                <div className="bg-sky-50 border border-sky-200/80 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 font-semibold text-sky-800 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    PublishAI Assistant
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    Ask AI to refine arguments, expand methodology, or draft rebuttal comments.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Quick AI Actions
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    <button
                      onClick={() => handleAiAction("abstract")}
                      disabled={isAiGenerating}
                      className="text-left px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-sky-300 hover:bg-sky-50/50 transition-all font-medium text-slate-700 cursor-pointer disabled:opacity-50"
                    >
                      ✨ Polish Abstract for Clarity
                    </button>
                    <button
                      onClick={() => handleAiAction("critique")}
                      disabled={isAiGenerating}
                      className="text-left px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-sky-300 hover:bg-sky-50/50 transition-all font-medium text-slate-700 cursor-pointer disabled:opacity-50"
                    >
                      🔍 Run Simulated Peer Review
                    </button>
                    <button
                      onClick={() => handleAiAction("tone")}
                      disabled={isAiGenerating}
                      className="text-left px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-sky-300 hover:bg-sky-50/50 transition-all font-medium text-slate-700 cursor-pointer disabled:opacity-50"
                    >
                      🎯 Verify Academic Tone & Rigor
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Prompt AI Co-author..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <button
                      onClick={() => handleAiAction("custom")}
                      disabled={isAiGenerating}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-sky-600 hover:text-sky-800 disabled:opacity-40 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {rightTab === "citations" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Verified References</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                    28 Found
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-800">
                      <span>[1] Maurano et al.</span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      Systematic localization of common disease-associated variation in regulatory DNA. Science (2012).
                    </p>
                    <span className="text-[10px] text-sky-600 font-mono">DOI: 10.1126/science.1222794</span>
                  </div>
                </div>
              </div>
            )}

            {rightTab === "compliance" && (
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Journal Requirements Met
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1">
                    Formatted for {journal} author guidelines.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200">
                    <span className="text-slate-600">Abstract Limit (&le; 250 words)</span>
                    <span className="text-emerald-600 font-medium">245 / 250</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200">
                    <span className="text-slate-600">Main Word Count Limit</span>
                    <span className="text-emerald-600 font-medium">6,840 / 8,000</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200">
                    <span className="text-slate-600">Citation Style</span>
                    <span className="text-slate-700 font-medium">Nature Numbered</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200">
                    <span className="text-slate-600">Data Availability Statement</span>
                    <span className="text-emerald-600 font-medium">Present</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
