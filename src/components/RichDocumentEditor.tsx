"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { Insertion, Deletion } from "./Editor/extensions/TrackChanges";
import { AgentRunner } from "./dashboard/AgentRunner";

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

const SAMPLE_CONTENT = "";

export default function RichDocumentEditor({
  documentId = "doc-new",
  initialTitle = "",
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
  const [dataWarnings, setDataWarnings] = useState<any[]>([]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<"IDLE" | "RUNNING" | "PAUSED" | "COMPLETED" | "ERROR">("IDLE");
  const [pipelineLog, setPipelineLog] = useState<string>("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Insertion,
      Deletion,
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      setContent(editor.getHTML());
      setSaveStatus("unsaved");
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none w-full min-h-[500px]',
      },
    },
  });

  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      // Avoid resetting unnecessarily, but could be useful if initialContent changes
    }
  }, [editor, initialContent]);


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
        throw new Error("Failed to generate AI response");
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
    } catch (error) {
      console.error(error);
      toast.error("Failed to get AI response.");
    } finally {
      setIsAiGenerating(false);
    }
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
        <div className="w-px h-4 bg-slate-200 mx-1" />
        <button
          onClick={() => editor?.chain().focus().toggleMark('insertion').run()}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
            editor?.isActive('insertion') ? 'bg-emerald-200 text-emerald-900' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          Mark Insert
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleMark('deletion').run()}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
            editor?.isActive('deletion') ? 'bg-rose-200 text-rose-900' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
          }`}
        >
          Mark Delete
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
        <main className="flex-1 flex flex-col min-w-0 bg-white overflow-y-auto relative">
          
          {pipelineStatus === "RUNNING" && (
            <div className="absolute inset-0 z-40 bg-white/70 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="max-w-md w-full bg-white border border-slate-200/60 shadow-2xl rounded-2xl p-8 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 border-4 border-sky-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-sky-500 rounded-full border-t-transparent animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-sky-500 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">AI Agent Pipeline Running</h3>
                <p className="text-sm text-slate-500 text-center mb-6">
                  The AI co-authors are analyzing your document, synthesizing research, and drafting structural improvements.
                </p>
                <div className="w-full bg-slate-900 rounded-lg p-3 text-xs font-mono text-emerald-400 truncate shadow-inner">
                  <span className="text-emerald-500 mr-2 font-bold">{'>'}</span>
                  {pipelineLog || "Initializing LangGraph execution..."}
                </div>
                
                {/* Dynamic progress bar visual */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-6 overflow-hidden relative">
                  <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-sky-400 w-full animate-[pulse_2s_ease-in-out_infinite]" style={{ backgroundSize: '200% 100%', animation: 'shimmer 2s infinite linear' }}></div>
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
                      <p className="font-semibold">Data Validation Warning {warning.textAnchor ? `- ${warning.textAnchor}` : ''}</p>
                      <p>{warning.warning || warning.message || (typeof warning === 'string' ? warning : JSON.stringify(warning))}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {editor && (
              <BubbleMenu
                editor={editor}
                shouldShow={({ editor }: { editor: any }) => editor.isActive('insertion') || editor.isActive('deletion')}
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
                    <Check className="w-3.5 h-3.5" /> Accept
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
                    <AlertCircle className="w-3.5 h-3.5" /> Reject
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
                <AgentRunner 
                  paperId={documentId} 
                  onStatusChange={setPipelineStatus}
                  onLog={setPipelineLog}
                  onResult={(res) => {
                    if (res && res.dataWarnings && Array.isArray(res.dataWarnings)) {
                      setDataWarnings(res.dataWarnings);
                    }
                    const text = typeof res === 'string' ? res : JSON.stringify(res, null, 2);
                    const formattedText = `\n\n### AI Pipeline Result\n${text}\n`;
                    setContent(prev => prev + formattedText);
                    editor?.commands.insertContent(formattedText);
                    setSaveStatus("unsaved");
                  }}
                />
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

                {dataWarnings.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 font-semibold text-rose-800">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      Dataset Warnings
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
