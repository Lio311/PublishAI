"use client";

import React, { useState, useEffect, useEffectEvent, useRef, useMemo } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "@/app/i18n/routing";

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { Insertion, Deletion } from "./extensions/TrackChanges";
import { AgentRunner } from "../dashboard/AgentRunner";

import { Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, FileText, Save, Download, Sparkles, BookOpen, CheckCircle2, AlertCircle, Send, RefreshCw, Search, Check, Plus } from "lucide-react";
import { errorMessage } from "@/services/utils/errors";
import type { Editor } from "@tiptap/react";
import type { LiteratureItem as CitationSearchResult } from "@/services/literature/types";

export interface DocumentSection {
  id: string;
  title: string;
  wordCount: number;
}

export interface DocumentEditorProps {
  documentId?: string;
  /** Links newly created documents to this paper. */
  paperId?: number;
  initialTitle?: string;
  initialJournal?: string;
  initialContent?: string;
  onSave?: (content: string, title: string) => void;
  onExport?: (format: "docx" | "pdf" | "latex") => void;
  onSubmitToJournal?: () => void;
}

export type RichDocumentEditorProps = DocumentEditorProps;

/** Agent data-validation warnings: plain strings or structured findings. */
type DataWarning = string | { textAnchor?: string; warning?: string; message?: string };

/** Journal fields used for the compliance panel (from GET /api/journals). */
interface JournalOption {
  id: number;
  name: string;
  wordLimit: number | null;
  abstractLimit: number | null;
  citationStyle: string | null;
}

function parseDocumentSections(htmlOrText: string): DocumentSection[] {
  if (!htmlOrText || !htmlOrText.trim()) {
    return [
      { id: "abstract", title: "Abstract", wordCount: 0 },
      { id: "intro", title: "1. Introduction", wordCount: 0 },
      { id: "methods", title: "2. Materials & Methods", wordCount: 0 },
      { id: "results", title: "3. Results", wordCount: 0 },
      { id: "discussion", title: "4. Discussion", wordCount: 0 },
      { id: "references", title: "References", wordCount: 0 },
    ];
  }

  // Match HTML headings or Markdown headings
  const headingRegex = /<h[1-6][^>]*>(.*?)<\/h[1-6]>|^#{1,6}\s+(.+)$/gim;
  const matches: { title: string; index: number }[] = [];
  let match;
  while ((match = headingRegex.exec(htmlOrText)) !== null) {
    const rawTitle = (match[1] || match[2] || "").replace(/<[^>]*>/g, "").trim();
    if (rawTitle) {
      matches.push({ title: rawTitle, index: match.index });
    }
  }

  if (matches.length > 0) {
    return matches.map((m, idx) => {
      const start = m.index;
      const end = idx < matches.length - 1 ? matches[idx + 1].index : htmlOrText.length;
      const sectionHtml = htmlOrText.slice(start, end);
      const text = sectionHtml.replace(/<[^>]*>/g, " ").trim();
      const count = text ? text.split(/\s+/).filter(Boolean).length : 0;
      return {
        id: `section-${idx}`,
        title: m.title,
        wordCount: count,
      };
    });
  }

  const plain = htmlOrText.replace(/<[^>]*>/g, " ").trim();
  const total = plain ? plain.split(/\s+/).filter(Boolean).length : 0;
  return [
    { id: "abstract", title: "Abstract", wordCount: Math.min(total, 250) },
    { id: "intro", title: "1. Introduction", wordCount: Math.max(0, total - 250) },
    { id: "methods", title: "2. Materials & Methods", wordCount: 0 },
    { id: "results", title: "3. Results", wordCount: 0 },
    { id: "discussion", title: "4. Discussion", wordCount: 0 },
    { id: "references", title: "References", wordCount: 0 },
  ];
}

function extractDocumentCitations(htmlOrText: string): string[] {
  if (!htmlOrText) return [];
  const citations = new Set<string>();

  // Format [@citation_key]
  const bracketMatches = htmlOrText.matchAll(/\[@([a-zA-Z0-9_\-\.\:\/]+)\]/g);
  for (const m of bracketMatches) {
    if (m[1]) citations.add(m[1]);
  }

  // Format DOI (10.xxxx/...)
  const doiMatches = htmlOrText.matchAll(/\b(10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+)\b/g);
  for (const m of doiMatches) {
    if (m[1]) citations.add(m[1]);
  }

  return Array.from(citations);
}

export default function RichDocumentEditor({
  documentId = "doc-new",
  paperId,
  initialTitle = "",
  initialJournal = "",
  initialContent = "",
  onSave,
  onExport,
  onSubmitToJournal,
}: DocumentEditorProps) {
  const t = useTranslations("PaperTools.editor");
  const router = useRouter();
  const [currentDocId, setCurrentDocId] = useState(documentId);
  const [journalOptions, setJournalOptions] = useState<JournalOption[]>([]);
  const [title, setTitle] = useState(initialTitle);
  const [journal, setJournal] = useState(initialJournal);
  const [content, setContent] = useState(initialContent);
  const [activeSection, setActiveSection] = useState("abstract");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [rightTab, setRightTab] = useState<"copilot" | "citations" | "compliance">("copilot");
  const [dataWarnings, setDataWarnings] = useState<DataWarning[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<"IDLE" | "RUNNING" | "PAUSED" | "COMPLETED" | "ERROR">("IDLE");
  const [pipelineLog, setPipelineLog] = useState<string>("");

  // Citation search state
  const [citationQuery, setCitationQuery] = useState("");
  const [isSearchingCitations, setIsSearchingCitations] = useState(false);
  const [citationResults, setCitationResults] = useState<CitationSearchResult[]>([]);

  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Target journals and their limits come from the journal catalog, not a hardcoded list.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/journals")
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: JournalOption[]) => {
        if (cancelled || !Array.isArray(rows)) return;
        setJournalOptions(rows);
        setJournal((current) => current || rows[0]?.name || "");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Insertion,
      Deletion,
    ],
    content: initialContent,
    onUpdate: ({ editor: ed }) => {
      setContent(ed.getHTML());
      setSaveStatus("unsaved");
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none w-full min-h-[500px]',
      },
    },
  });

  // Derived statistics from actual plain text
  const plainText = useMemo(() => {
    return content.replace(/<[^>]*>/g, " ").trim();
  }, [content]);

  const wordCount = useMemo(() => {
    return plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  }, [plainText]);

  const characterCount = plainText.length;
  const estimatedReadingTime = Math.ceil(wordCount / 220);

  // Dynamic sections and citations
  const sections = useMemo(() => parseDocumentSections(content), [content]);
  const detectedCitations = useMemo(() => extractDocumentCitations(content), [content]);

  // Dynamic compliance calculations
  const selectedJournal = journalOptions.find((j) => j.name === journal);
  const journalRule = {
    maxWords: selectedJournal?.wordLimit ?? null,
    maxAbstract: selectedJournal?.abstractLimit ?? null,
    citationStyle: selectedJournal?.citationStyle || null,
  };
  const abstractSection = sections.find((s) => s.title.toLowerCase().includes("abstract"));
  const abstractWordCount = abstractSection ? abstractSection.wordCount : Math.min(wordCount, 250);
  const hasDataAvailability = useMemo(() => {
    return /data availability/i.test(plainText);
  }, [plainText]);

  // Robust Save Function with Error Handling & Creation for new documents
  const performSave = async (isAutosave = false) => {
    if (saveStatus === "saving") return;

    const contentToSave = editor ? editor.getHTML() : content;
    const plain = contentToSave.replace(/<[^>]*>/g, " ").trim();
    const words = plain ? plain.split(/\s+/).filter(Boolean).length : 0;

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
            content: contentToSave,
            wordCount: words,
            status: "draft",
            paperId,
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
            content: contentToSave,
            wordCount: words,
          }),
        });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Save returned status ${res.status}`);
      }

      if (isMountedRef.current) {
        setSaveStatus("saved");
        onSave?.(contentToSave, title);
        if (!isAutosave) {
          toast.success(t("saved"));
        }
      }
    } catch (error) {
      console.error("[RichDocumentEditor] Save error:", error);
      if (isMountedRef.current) {
        setSaveStatus("unsaved");
        if (!isAutosave) {
          toast.error(errorMessage(error) || t("saveFailed"));
        }
      }
    }
  };

  const autosave = useEffectEvent(() => {
    performSave(true);
  });

  // Debounced Autosave with cleanup
  useEffect(() => {
    if (saveStatus !== "unsaved") return;

    const timer = setTimeout(autosave, 2500);

    return () => {
      clearTimeout(timer);
    };
  }, [saveStatus, content, title, currentDocId]);

  const handleManualSave = () => {
    performSave(false);
  };

  // AI Co-Pilot Handler with synchronized TipTap insertion
  const handleAiAction = async (actionType: string) => {
    setIsAiGenerating(true);
    try {
      let prompt = aiPrompt;
      const systemPrompt = "You are an elite academic co-author.";
      const currentContent = editor ? editor.getHTML() : content;

      if (actionType === "abstract") {
        prompt = "Please polish this abstract for clarity:\n" + currentContent;
      } else if (actionType === "critique") {
        prompt = "Please provide a peer review critique for this text:\n" + currentContent;
      } else if (actionType === "tone") {
        prompt = "Please verify the academic tone of this text and suggest improvements:\n" + currentContent;
      }

      if (!prompt) {
        setIsAiGenerating(false);
        return;
      }

      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, systemPrompt, mode: "text" }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || t("aiFailed"));
      }

      const data = await response.json();
      const escapeHtml = (value: string) =>
        value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const suggestionBody = String(data.text || "")
        .split(/\n{2,}/)
        .map((para) => `<p>${escapeHtml(para.trim())}</p>`)
        .join("");
      const suggestionHtml = `<blockquote><h3>${escapeHtml(t("aiSuggestion"))}</h3>${suggestionBody}</blockquote>`;

      if (editor) {
        editor.chain().focus().insertContent(suggestionHtml).run();
        const updated = editor.getHTML();
        setContent(updated);
      } else {
        setContent((prev) => prev + suggestionHtml);
      }
      setSaveStatus("unsaved");
      if (actionType === "custom") {
        setAiPrompt("");
      }
    } catch (error) {
      console.error("[RichDocumentEditor] AI error:", error);
      toast.error(errorMessage(error) || t("aiFailed"));
    } finally {
      if (isMountedRef.current) {
        setIsAiGenerating(false);
      }
    }
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
        toast.error(t("citationSearchFailed"));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("citationSearchFailed"));
    } finally {
      if (isMountedRef.current) {
        setIsSearchingCitations(false);
      }
    }
  };

  const handleInsertCitation = (citationKey: string) => {
    if (editor) {
      editor.chain().focus().insertContent(` [@${citationKey}] `).run();
      setContent(editor.getHTML());
      setSaveStatus("unsaved");
      toast.success(t("citationInserted", { key: citationKey }));
    }
  };

  const handleInsertDataAvailability = () => {
    const statement = `\n\n<h3>Data Availability Statement</h3><p>The datasets generated and analyzed during the current study are available from the corresponding author on reasonable request.</p>\n`;
    if (editor) {
      editor.chain().focus().insertContent(statement).run();
      setContent(editor.getHTML());
      setSaveStatus("unsaved");
      toast.success(t("dataStatementAdded"));
    }
  };

  return (
    <div data-testid="tiptap-editor" className="w-full flex flex-col h-[calc(100vh-6rem)] bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden font-sans">
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
              aria-label={t("titleLabel")}
              placeholder={t("titlePlaceholder")}
              className="text-base md:text-lg font-bold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-sky-500 rounded px-1 w-full truncate"
            />
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
              <span className="font-medium text-slate-700">{t("target")}</span>
              <select
                value={journal}
                onChange={(e) => setJournal(e.target.value)}
                aria-label={t("targetLabel")}
                className="bg-transparent border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {!journal && <option value="">{t("chooseJournal")}</option>}
                {journal && !journalOptions.some((j) => j.name === journal) && <option value={journal}>{journal}</option>}
                {journalOptions.map((j) => (
                  <option key={j.id} value={j.name}>
                    {j.name}
                  </option>
                ))}
              </select>
              <span>•</span>
              <span className="flex items-center gap-1">
                {saveStatus === "saved" && (
                  <span className="text-emerald-600 flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> {t("statusSaved")}
                  </span>
                )}
                {saveStatus === "saving" && (
                  <span className="text-sky-600 flex items-center gap-0.5">
                    <RefreshCw className="w-3 h-3 animate-spin" /> {t("statusSaving")}
                  </span>
                )}
                {saveStatus === "unsaved" && (
                  <span className="text-amber-600 flex items-center gap-0.5">
                    <AlertCircle className="w-3 h-3" /> {t("statusUnsaved")}
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
            {saveStatus === "saving" ? t("statusSaving") : t("save")}
          </button>
          <button
            onClick={() => {
              if (onExport) return onExport("docx");
              if (/^[0-9a-f-]{36}$/i.test(currentDocId)) {
                window.location.assign(new URL(`/api/documents/${currentDocId}/export?format=docx`, window.location.origin));
              } else {
                toast.info(t("saveBeforeExport"));
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            {t("export")}
          </button>
          <button
            onClick={() => (onSubmitToJournal ? onSubmitToJournal() : router.push("/submissions"))}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors shadow-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {t("submit")}
          </button>
        </div>
      </header>

      {/* Editor Formatting Toolbar */}
      <div className="px-4 py-2 border-b border-slate-200 bg-white flex items-center gap-1 overflow-x-auto shrink-0 text-slate-700 text-xs">
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor?.isActive('bold') ? 'bg-slate-200 text-slate-900 font-bold' : 'hover:bg-slate-100 text-slate-700'
          }`}
          title={t("toolbar.bold")}
          aria-label={t("toolbar.bold")}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor?.isActive('italic') ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-100 text-slate-700'
          }`}
          title={t("toolbar.italic")}
          aria-label={t("toolbar.italic")}
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <button
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor?.isActive('heading', { level: 1 }) ? 'bg-slate-200 text-slate-900 font-bold' : 'hover:bg-slate-100 text-slate-700'
          }`}
          title={t("toolbar.h1")}
          aria-label={t("toolbar.h1")}
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor?.isActive('heading', { level: 2 }) ? 'bg-slate-200 text-slate-900 font-bold' : 'hover:bg-slate-100 text-slate-700'
          }`}
          title={t("toolbar.h2")}
          aria-label={t("toolbar.h2")}
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor?.isActive('heading', { level: 3 }) ? 'bg-slate-200 text-slate-900 font-bold' : 'hover:bg-slate-100 text-slate-700'
          }`}
          title={t("toolbar.h3")}
          aria-label={t("toolbar.h3")}
        >
          <Heading3 className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <button
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor?.isActive('bulletList') ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-100 text-slate-700'
          }`}
          title={t("toolbar.bulletList")}
          aria-label={t("toolbar.bulletList")}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor?.isActive('orderedList') ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-100 text-slate-700'
          }`}
          title={t("toolbar.orderedList")}
          aria-label={t("toolbar.orderedList")}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor?.isActive('blockquote') ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-100 text-slate-700'
          }`}
          title={t("toolbar.quote")}
          aria-label={t("toolbar.quote")}
        >
          <Quote className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor?.isActive('codeBlock') ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-100 text-slate-700'
          }`}
          title={t("toolbar.code")}
          aria-label={t("toolbar.code")}
        >
          <Code className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <button
          onClick={() => {
            const key = prompt(t("citationKeyPrompt"), "ref");
            if (key) handleInsertCitation(key);
          }}
          className="px-2 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" /> {t("toolbar.citation")}
        </button>
        <button
          onClick={() => editor?.chain().focus().insertContent(`<p><em>[${t("figurePlaceholder")}]</em></p>`).run()}
          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-medium transition-colors cursor-pointer"
        >
          {t("toolbar.figure")}
        </button>
        <button
          onClick={() => editor?.chain().focus().insertContent("<code>$$ E = mc^2 $$</code>").run()}
          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-xs font-medium transition-colors cursor-pointer"
        >
          {t("toolbar.latex")}
        </button>
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <button
          onClick={() => editor?.chain().focus().toggleMark('insertion').run()}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
            editor?.isActive('insertion') ? 'bg-emerald-200 text-emerald-900' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          {t("toolbar.trackInsert")}
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleMark('deletion').run()}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
            editor?.isActive('deletion') ? 'bg-rose-200 text-rose-900' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
          }`}
        >
          {t("toolbar.trackDelete")}
        </button>
      </div>

      {/* Main Workspace Area (3 Columns: Section Navigator, Text Area, AI Drawer) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Section Outline */}
        <aside className="w-56 border-r border-slate-200 bg-slate-50/40 p-3 hidden lg:flex flex-col shrink-0 overflow-y-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 px-2 mb-2">
            {t("sections")}
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
              <span>{t("totalWords")}</span>
              <span className="font-semibold text-slate-700">{wordCount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("readingTime")}</span>
              <span className="text-slate-700">{t("minutes", { count: estimatedReadingTime })}</span>
            </div>
            <div className="flex justify-between">
              <span>{t("characters")}</span>
              <span className="text-slate-700">{characterCount.toLocaleString()}</span>
            </div>
          </div>
        </aside>

        {/* Center Main Editor View */}
        <main className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto relative">
          {pipelineStatus === "RUNNING" && (
            <div className="absolute inset-0 z-40 bg-white/70 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="max-w-md w-full bg-white border border-slate-200/60 shadow-2xl rounded-2xl p-8 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 border-4 border-sky-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-sky-500 rounded-full border-t-transparent animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-sky-500 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{t("pipelineRunning")}</h3>
                <p className="text-sm text-slate-500 text-center mb-6">
                  {t("pipelineDescription")}
                </p>
                <div className="w-full bg-slate-900 rounded-lg p-3 text-xs font-mono text-emerald-400 truncate shadow-inner">
                  <span className="text-emerald-500 mr-2 font-bold">{'>'}</span>
                  {pipelineLog || t("pipelineStarting")}
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-6 overflow-hidden relative">
                  <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-sky-400 w-full animate-pulse"></div>
                </div>
              </div>
            </div>
          )}

          <div className="p-6 md:p-8 max-w-3xl mx-auto w-full flex-1 flex flex-col">
            {dataWarnings.length > 0 && (
              <div className="mb-6 space-y-2">
                {dataWarnings.map((warning, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">{t("dataWarning")} {typeof warning !== 'string' && warning.textAnchor ? `- ${warning.textAnchor}` : ''}</p>
                      <p>{typeof warning === 'string' ? warning : warning.warning || warning.message || JSON.stringify(warning)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {editor && (
              <BubbleMenu
                editor={editor}
                shouldShow={({ editor }: { editor: Editor }) => editor.isActive('insertion') || editor.isActive('deletion')}
              >
                <div className="flex items-center gap-1 bg-white border border-slate-200 shadow-lg rounded-lg p-1.5 z-50">
                  <button
                    onClick={() => {
                      if (editor.isActive('insertion')) {
                        editor.chain().focus().extendMarkRange('insertion').unsetInsertion().run();
                      } else if (editor.isActive('deletion')) {
                        editor.chain().focus().extendMarkRange('deletion').deleteSelection().run();
                      }
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> {t("accept")}
                  </button>
                  <button
                    onClick={() => {
                      if (editor.isActive('insertion')) {
                        editor.chain().focus().extendMarkRange('insertion').deleteSelection().run();
                      } else if (editor.isActive('deletion')) {
                        editor.chain().focus().extendMarkRange('deletion').unsetDeletion().run();
                      }
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 rounded flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <AlertCircle className="w-3.5 h-3.5" /> {t("reject")}
                  </button>
                </div>
              </BubbleMenu>
            )}
            <EditorContent editor={editor} className="w-full flex-1" />
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
              {t("tabCopilot")}
            </button>
            <button
              onClick={() => setRightTab("citations")}
              className={`flex-1 py-2.5 text-center transition-colors cursor-pointer ${
                rightTab === "citations"
                  ? "border-b-2 border-sky-600 text-sky-700 font-semibold"
                  : "hover:text-slate-900"
              }`}
            >
              {t("tabCitations", { count: detectedCitations.length })}
            </button>
            <button
              onClick={() => setRightTab("compliance")}
              className={`flex-1 py-2.5 text-center transition-colors cursor-pointer ${
                rightTab === "compliance"
                  ? "border-b-2 border-sky-600 text-sky-700 font-semibold"
                  : "hover:text-slate-900"
              }`}
            >
              {t("tabCompliance")}
            </button>
          </div>

          {/* Right Panel Content */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
            {rightTab === "copilot" && (
              <div className="space-y-3">
                <AgentRunner 
                  paperId={paperId ? String(paperId) : undefined}
                  onStatusChange={setPipelineStatus}
                  onLog={setPipelineLog}
                  onResult={(res) => {
                    if (res && typeof res === "object" && Array.isArray(res.dataWarnings)) {
                      setDataWarnings(res.dataWarnings as DataWarning[]);
                    }
                    const text = typeof res === 'string' ? res : JSON.stringify(res, null, 2);
                    const formattedHtml = `<div class="border-l-4 border-indigo-500 pl-4 py-2 my-4 bg-indigo-50/70 rounded-r"><h3>${t("pipelineResult")}</h3><pre>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre></div>`;
                    if (editor) {
                      editor.chain().focus().insertContent(formattedHtml).run();
                      setContent(editor.getHTML());
                    } else {
                      setContent(prev => prev + formattedHtml);
                    }
                    setSaveStatus("unsaved");
                  }}
                />

                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    {t("quickActions")}
                  </span>
                  <div className="grid grid-cols-1 gap-1.5">
                    <button
                      onClick={() => handleAiAction("abstract")}
                      disabled={isAiGenerating}
                      className="text-left px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-sky-300 hover:bg-sky-50/50 transition-all font-medium text-slate-700 cursor-pointer disabled:opacity-50"
                    >
                      {t("actionAbstract")}
                    </button>
                    <button
                      onClick={() => handleAiAction("critique")}
                      disabled={isAiGenerating}
                      className="text-left px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-sky-300 hover:bg-sky-50/50 transition-all font-medium text-slate-700 cursor-pointer disabled:opacity-50"
                    >
                      {t("actionCritique")}
                    </button>
                    <button
                      onClick={() => handleAiAction("tone")}
                      disabled={isAiGenerating}
                      className="text-left px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-sky-300 hover:bg-sky-50/50 transition-all font-medium text-slate-700 cursor-pointer disabled:opacity-50"
                    >
                      {t("actionTone")}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder={t("promptPlaceholder")}
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
                  <span className="font-semibold text-slate-700">{t("references")}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                    {t("found", { count: detectedCitations.length })}
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
                    {t("noReferences")}
                  </div>
                )}

                {/* Literature Search & Insert */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <span className="font-semibold text-slate-700 block">{t("searchCitations")}</span>
                  <form onSubmit={handleSearchCitations} className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder={t("searchPlaceholder")}
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
                          <p className="text-[10px] text-slate-500 line-clamp-1">{item.authors?.map((a) => a.name).join(", ") || "—"} ({item.year || "n.d."})</p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="font-mono text-[9px] text-slate-400">{item.doi || item.id || ""}</span>
                            <button
                              type="button"
                              onClick={() => handleInsertCitation(item.doi || item.id || `ref_${idx + 1}`)}
                              className="text-sky-600 hover:text-sky-800 font-medium text-[10px] flex items-center gap-0.5 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> {t("insert")}
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
                    {t("guidelines")}
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1">
                    {journal ? t("evaluating", { journal }) : t("chooseJournal")}
                  </p>
                </div>

                {dataWarnings.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 font-semibold text-rose-800">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      {t("datasetWarnings")}
                    </div>
                    <ul className="list-disc pl-4 mt-2 space-y-1 text-[11px] text-rose-700">
                      {dataWarnings.map((w, i) => (
                        <li key={i}>{typeof w === 'string' ? w : JSON.stringify(w)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200">
                    <span className="text-slate-600">{t("abstractLimit")}</span>
                    <span className={`font-medium ${journalRule.maxAbstract === null ? 'text-slate-500' : abstractWordCount <= journalRule.maxAbstract ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {abstractWordCount} / {journalRule.maxAbstract ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200">
                    <span className="text-slate-600">{t("wordLimit")}</span>
                    <span className={`font-medium ${journalRule.maxWords === null ? 'text-slate-500' : wordCount <= journalRule.maxWords ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {wordCount.toLocaleString()} / {journalRule.maxWords?.toLocaleString() ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200">
                    <span className="text-slate-600">{t("citationStyle")}</span>
                    <span className="text-slate-700 font-medium">{journalRule.citationStyle ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] py-1 border-b border-slate-200">
                    <span className="text-slate-600">{t("dataStatement")}</span>
                    {hasDataAvailability ? (
                      <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> {t("present")}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-600 font-medium">{t("missing")}</span>
                        <button
                          onClick={handleInsertDataAvailability}
                          className="px-1.5 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded text-[10px] font-medium transition-colors cursor-pointer"
                        >
                          {t("add")}
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
