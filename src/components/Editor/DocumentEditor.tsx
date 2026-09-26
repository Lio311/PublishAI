"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { toast } from "sonner";
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
  Plus,
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

const JOURNAL_RULES: Record<string, { maxWords: number; maxAbstract: number; citationStyle: string }> = {
  "Nature Biotechnology": { maxWords: 8000, maxAbstract: 250, citationStyle: "Nature Numbered" },
  "Cell Systems": { maxWords: 7500, maxAbstract: 150, citationStyle: "Cell (Author-Date)" },
  "Bioinformatics (Oxford)": { maxWords: 6000, maxAbstract: 250, citationStyle: "Oxford Harvard" },
  "PLOS Computational Biology": { maxWords: 10000, maxAbstract: 300, citationStyle: "Vancouver" },
  "Scientific Reports": { maxWords: 8500, maxAbstract: 200, citationStyle: "Nature Numbered" },
};

function parseMarkdownSections(text: string): DocumentSection[] {
  if (!text || !text.trim()) {
    return [
      { id: "abstract", title: "Abstract", wordCount: 0 },
      { id: "intro", title: "1. Introduction", wordCount: 0 },
      { id: "methods", title: "2. Materials & Methods", wordCount: 0 },
      { id: "results", title: "3. Results", wordCount: 0 },
      { id: "discussion", title: "4. Discussion", wordCount: 0 },
      { id: "references", title: "References", wordCount: 0 },
    ];
  }

  const lines = text.split("\n");
  const sections: { title: string; lines: string[] }[] = [];
  let currentSection: { title: string; lines: string[] } | null = null;

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = { title: headingMatch[1].trim(), lines: [] };
    } else if (currentSection) {
      currentSection.lines.push(line);
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  if (sections.length > 0) {
    return sections.map((sec, idx) => {
      const sectionText = sec.lines.join(" ").trim();
      const count = sectionText ? sectionText.split(/\s+/).filter(Boolean).length : 0;
      return {
        id: `section-${idx}`,
        title: sec.title,
        wordCount: count,
      };
    });
  }

  const total = text.trim().split(/\s+/).filter(Boolean).length;
  return [
    { id: "abstract", title: "Abstract", wordCount: Math.min(total, 250) },
    { id: "intro", title: "1. Introduction", wordCount: Math.max(0, total - 250) },
    { id: "methods", title: "2. Materials & Methods", wordCount: 0 },
    { id: "results", title: "3. Results", wordCount: 0 },
    { id: "discussion", title: "4. Discussion", wordCount: 0 },
    { id: "references", title: "References", wordCount: 0 },
  ];
}

function extractMarkdownCitations(text: string): string[] {
  if (!text) return [];
  const citations = new Set<string>();

  const matches = text.matchAll(/\[@([a-zA-Z0-9_\-\.\:\/]+)\]/g);
  for (const m of matches) {
    if (m[1]) citations.add(m[1]);
  }

  const doiMatches = text.matchAll(/\b(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)\b/g);
  for (const m of doiMatches) {
    if (m[1]) citations.add(m[1]);
  }

  return Array.from(citations);
}

export default function DocumentEditor({
  documentId = "doc-new",
  initialTitle = "",
  initialJournal = "Nature Biotechnology",
  initialContent = "",
  onSave,
  onExport,
  onSubmitToJournal,
}: DocumentEditorProps) {
  const [currentDocId, setCurrentDocId] = useState(documentId);
  const [title, setTitle] = useState(initialTitle);
  const [journal, setJournal] = useState(initialJournal);
  const [content, setContent] = useState(initialContent);
  const [activeSection, setActiveSection] = useState("abstract");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [rightTab, setRightTab] = useState<"copilot" | "citations" | "compliance">("copilot");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // Citation search state
  const [citationQuery, setCitationQuery] = useState("");
  const [isSearchingCitations, setIsSearchingCitations] = useState(false);
  const [citationResults, setCitationResults] = useState<any[]>([]);

  const isMountedRef = useRef(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setCurrentDocId(documentId);
  }, [documentId]);

  // Synchronize initialContent prop updates
  useEffect(() => {
    if (initialContent !== undefined && initialContent !== content) {
      setContent(initialContent);
    }
  }, [initialContent]);

  // Synchronize initialTitle prop updates
  useEffect(() => {
    if (initialTitle && initialTitle !== title) {
      setTitle(initialTitle);
    }
  }, [initialTitle]);

  // Derived statistics
  const wordCount = useMemo(() => {
    const trimmed = content.trim();
    return trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
  }, [content]);

  const characterCount = content.length;
  const estimatedReadingTime = Math.ceil(wordCount / 220);

  // Dynamic sections and citations
  const sections = useMemo(() => parseMarkdownSections(content), [content]);
  const detectedCitations = useMemo(() => extractMarkdownCitations(content), [content]);

  // Dynamic compliance checks
  const journalRule = JOURNAL_RULES[journal] || JOURNAL_RULES["Nature Biotechnology"];
  const abstractSection = sections.find((s) => s.title.toLowerCase().includes("abstract"));
  const abstractWordCount = abstractSection ? abstractSection.wordCount : Math.min(wordCount, 250);
  const hasDataAvailability = useMemo(() => {
    return /data availability/i.test(content);
  }, [content]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setSaveStatus("unsaved");
  };

  // Robust Save Function with API persistence and Error Handling
  const performSave = async (isAutosave = false) => {
    if (saveStatus === "saving") return;

    if (!isAutosave) {
      setSaveStatus("saving");
    }

    try {
      let res: Response;
      const isNew = !currentDocId || currentDocId === "doc-new" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentDocId);

      if (isNew) {
        res = await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title || "Untitled Manuscript",
            content,
            wordCount,
            status: "draft",
          }),
        });

        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data?.document?.id && isMountedRef.current) {
            setCurrentDocId(data.document.id);
          }
        }
      } else {
        res = await fetch(`/api/documents/${currentDocId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            content,
            wordCount,
          }),
        });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Save failed (${res.status})`);
      }

      if (isMountedRef.current) {
        setSaveStatus("saved");
        onSave?.(content, title);
        if (!isAutosave) {
          toast.success("Document saved successfully");
        }
      }
    } catch (error: any) {
      console.error("[DocumentEditor] Save error:", error);
      if (isMountedRef.current) {
        setSaveStatus("unsaved");
        if (!isAutosave) {
          toast.error(error.message || "Failed to save document");
        }
      }
    }
  };

  // Debounced Autosave with cleanup
  useEffect(() => {
    if (saveStatus !== "unsaved") return;

    const timer = setTimeout(() => {
      performSave(true);
    }, 2500);

    return () => {
      clearTimeout(timer);
    };
  }, [saveStatus, content, title, currentDocId]);

  const handleManualSave = () => {
    performSave(false);
  };

  const handleAiAction = async (actionType: string) => {
    setIsAiGenerating(true);
    try {
      let prompt = aiPrompt;
      const systemPrompt = "You are an elite academic co-author.";

      if (actionType === "abstract") {
        prompt = "Please polish this abstract for clarity:\n" + content;
      } else if (actionType === "critique") {
        prompt = "Please provide a peer review critique for this text:\n" + content;
      } else if (actionType === "tone") {
        prompt = "Please verify the academic tone of this text and suggest improvements:\n" + content;
      }

      if (!prompt) {
        setIsAiGenerating(false);
        return;
      }

      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, systemPrompt }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate AI response");
      }

      const data = await response.json();

      setContent(
        (prev) =>
          prev +
          `\n\n### AI Suggestion (${actionType})\n` +
          data.text
      );
      setSaveStatus("unsaved");
      if (actionType === "custom") {
        setAiPrompt("");
      }
    } catch (error: any) {
      console.error("[DocumentEditor] AI error:", error);
      toast.error(error.message || "Failed to get AI response.");
    } finally {
      if (isMountedRef.current) {
        setIsAiGenerating(false);
      }
    }
  };

  const insertFormatting = (prefix: string, suffix: string = "") => {
    setContent((prev) => prev + `\n${prefix}Sample Text${suffix}\n`);
    setSaveStatus("unsaved");
  };

  // Search literature for citations
  const handleSearchCitations = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citationQuery.trim()) return;

    setIsSearchingCitations(true);
    try {
      const res = await fetch(`/api/literature/search?q=${encodeURIComponent(citationQuery)}`);
      if (res.ok) {
        const data = await res.json();
        if (isMountedRef.current) {
          setCitationResults(data.results || []);
        }
      } else {
        toast.error("Citation search failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error during citation search");
    } finally {
      if (isMountedRef.current) {
        setIsSearchingCitations(false);
      }
    }
  };

  const handleInsertCitation = (citationKey: string) => {
    setContent((prev) => prev + ` [@${citationKey}] `);
    setSaveStatus("unsaved");
    toast.success(`Inserted reference [@${citationKey}]`);
  };

  const handleInsertDataAvailability = () => {
    const statement = `\n\n## Data Availability Statement\nThe datasets generated and analyzed during the current study are available from the corresponding author on reasonable request.\n`;
    setContent((prev) => prev + statement);
    setSaveStatus("unsaved");
    toast.success("Data Availability Statement added");
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
              placeholder="Manuscript Title..."
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
                    <AlertCircle className="w-3 h-3" /> Unsaved changes
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
            disabled={saveStatus === "saving"}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-slate-500" />
            {saveStatus === "saving" ? "Saving..." : "Save"}
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
          onClick={() => {
            const key = prompt("Enter citation key (e.g. smith2023):", "ref");
            if (key) handleInsertCitation(key);
          }}
          className="px-2 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" /> + Citation
        </button>
        <button
          onClick={() => insertFormatting("![Figure: Caption](figure.png)")}
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
            {sections.map((sec) => (
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
              ref={textareaRef}
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
              Citations ({detectedCitations.length})
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAiAction("custom");
                        }
                      }}
                      className="w-full pl-3 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <button
                      onClick={() => handleAiAction("custom")}
                      disabled={isAiGenerating || !aiPrompt.trim()}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-sky-600 hover:text-sky-800 disabled:opacity-40 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {rightTab === "citations" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Document References</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                    {detectedCitations.length} Found
                  </span>
                </div>

                {detectedCitations.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {detectedCitations.map((key, i) => (
                      <div key={i} className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                        <span className="font-mono text-sky-700 truncate max-w-[200px]">[@{key}]</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-center text-[11px]">
                    No references detected in document text.
                  </div>
                )}

                {/* Literature Search & Insert */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <span className="font-semibold text-slate-700 block">Search & Insert Citations</span>
                  <form onSubmit={handleSearchCitations} className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="PubMed/Crossref query or DOI..."
                      value={citationQuery}
                      onChange={(e) => setCitationQuery(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    <button
                      type="submit"
                      disabled={isSearchingCitations}
                      className="px-2.5 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-medium hover:bg-sky-700 disabled:opacity-50 cursor-pointer"
                    >
                      {isSearchingCitations ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                    </button>
                  </form>

                  {citationResults.length > 0 && (
                    <div className="space-y-2 max-h-56 overflow-y-auto mt-2">
                      {citationResults.slice(0, 5).map((item, idx) => (
                        <div key={idx} className="p-2 bg-white border border-slate-200 rounded-lg space-y-1">
                          <p className="font-medium text-slate-800 line-clamp-1">{item.title}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{item.authors?.join(", ") || "Unknown Author"} ({item.year || item.publicationYear || "n.d."})</p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="font-mono text-[9px] text-slate-400">{item.doi || item.id || ""}</span>
                            <button
                              type="button"
                              onClick={() => handleInsertCitation(item.doi || item.id || `ref_${idx + 1}`)}
                              className="text-sky-600 hover:text-sky-800 font-medium text-[10px] flex items-center gap-0.5 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> Insert
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {rightTab === "compliance" && (
              <div className="space-y-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Target Journal Guidelines
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1">
                    Evaluating manuscript against {journal} submission standards.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200">
                    <span className="text-slate-600">Abstract Limit (&le; {journalRule.maxAbstract} words)</span>
                    <span className={`font-medium ${abstractWordCount <= journalRule.maxAbstract ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {abstractWordCount} / {journalRule.maxAbstract}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200">
                    <span className="text-slate-600">Main Word Count Limit</span>
                    <span className={`font-medium ${wordCount <= journalRule.maxWords ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {wordCount.toLocaleString()} / {journalRule.maxWords.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200">
                    <span className="text-slate-600">Citation Style</span>
                    <span className="text-slate-700 font-medium">{journalRule.citationStyle}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200">
                    <span className="text-slate-600">Data Availability Statement</span>
                    {hasDataAvailability ? (
                      <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Present
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-600 font-medium">Missing</span>
                        <button
                          onClick={handleInsertDataAvailability}
                          className="px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded text-[10px] font-medium transition-colors cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>
                    )}
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
