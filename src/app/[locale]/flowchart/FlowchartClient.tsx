"use client";

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/app/i18n/routing';
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Upload, Code, FileText, Database, Zap, Brain, Search, Edit3, MessageSquare,
  ShieldCheck, CheckCircle, Download, Globe, Lock, Eye, Settings, Mail, User,
  Bot, Scissors, ListChecks, GitMerge, RefreshCw, ArrowRight, ArrowDown,
  AlertTriangle, CheckCircle2, Box, HelpCircle, Share2, Layers, BarChart2,
  Workflow, Server, Shield, Cpu, BookOpen, Terminal, Fingerprint, Activity
} from 'lucide-react';

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════
type NodeType = 'user' | 'agent' | 'queue' | 'rpa' | 'db' | 'logic' | 'success' | 'error' | 'infra' | 'default';

interface FlowNodeProps {
  titleEn: string;
  titleHe: string;
  descEn: string;
  descHe: string;
  icon: React.ElementType;
  type: NodeType;
  isHe: boolean;
  isDiamond?: boolean;
  techs?: string[];
  dataLabel?: { en: string; he: string };
}

// ═══════════════════════════════════════════
// Style Constants
// ═══════════════════════════════════════════
const nodeStyles: Record<NodeType, { bg: string; border: string; text: string; iconBg: string; iconColor: string }> = {
  user:    { bg: 'bg-blue-50',    border: 'border-blue-300',    text: 'text-blue-900',    iconBg: 'bg-blue-500',    iconColor: 'text-white' },
  agent:   { bg: 'bg-purple-50',  border: 'border-purple-300',  text: 'text-purple-900',  iconBg: 'bg-purple-500',  iconColor: 'text-white' },
  queue:   { bg: 'bg-orange-50',  border: 'border-orange-300',  text: 'text-orange-900',  iconBg: 'bg-orange-500',  iconColor: 'text-white' },
  rpa:     { bg: 'bg-teal-50',    border: 'border-teal-300',    text: 'text-teal-900',    iconBg: 'bg-teal-500',    iconColor: 'text-white' },
  db:      { bg: 'bg-green-50',   border: 'border-green-300',   text: 'text-green-900',   iconBg: 'bg-green-600',   iconColor: 'text-white' },
  logic:   { bg: 'bg-yellow-50',  border: 'border-yellow-400',  text: 'text-yellow-900',  iconBg: 'bg-yellow-500',  iconColor: 'text-white' },
  success: { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-900', iconBg: 'bg-emerald-500', iconColor: 'text-white' },
  error:   { bg: 'bg-red-50',     border: 'border-red-400',     text: 'text-red-900',     iconBg: 'bg-red-500',     iconColor: 'text-white' },
  infra:   { bg: 'bg-slate-50',   border: 'border-slate-300',   text: 'text-slate-800',   iconBg: 'bg-slate-600',   iconColor: 'text-white' },
  default: { bg: 'bg-gray-50',    border: 'border-gray-300',    text: 'text-gray-900',    iconBg: 'bg-gray-500',    iconColor: 'text-white' },
};

const techColors: Record<string, string> = {
  'Claude 3.7': 'bg-amber-100 text-amber-800 border-amber-300',
  'Claude 3.5 Haiku': 'bg-amber-50 text-amber-700 border-amber-200',
  'GPT-4o': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'GPT-4o-mini': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'OpenAI o1': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Gemini 1.5': 'bg-blue-100 text-blue-800 border-blue-300',
  'Vercel AI SDK': 'bg-gray-900 text-white border-gray-700',
  'LangGraph': 'bg-violet-100 text-violet-800 border-violet-300',
  'LangChain': 'bg-violet-50 text-violet-700 border-violet-200',
  'Inngest': 'bg-pink-100 text-pink-800 border-pink-300',
  'Neon Postgres': 'bg-green-100 text-green-800 border-green-300',
  'pgvector': 'bg-green-50 text-green-700 border-green-200',
  'Drizzle ORM': 'bg-green-50 text-green-700 border-green-200',
  'Upstash Redis': 'bg-red-100 text-red-800 border-red-300',
  'Vercel Blob': 'bg-gray-100 text-gray-800 border-gray-300',
  'Playwright': 'bg-green-100 text-green-800 border-green-300',
  'Nodemailer': 'bg-sky-100 text-sky-800 border-sky-300',
  'MCP': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'GraphRAG': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'E2B Sandbox': 'bg-orange-100 text-orange-800 border-orange-300',
  'Vision AI': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'Mem0': 'bg-purple-100 text-purple-800 border-purple-300',
  'Guardrails AI': 'bg-red-100 text-red-800 border-red-300',
  'Langfuse': 'bg-sky-100 text-sky-800 border-sky-300',
  'Mammoth': 'bg-gray-100 text-gray-700 border-gray-300',
  'PDF Parser': 'bg-gray-100 text-gray-700 border-gray-300',
  'Zod': 'bg-blue-100 text-blue-800 border-blue-300',
  'Next.js 16': 'bg-gray-900 text-white border-gray-700',
  'NextAuth.js': 'bg-violet-100 text-violet-800 border-violet-300',
  'Stripe': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'AES-256-GCM': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'WebSockets': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'RLHF': 'bg-pink-100 text-pink-800 border-pink-300',
  'Recharts': 'bg-sky-50 text-sky-700 border-sky-200',
  'Jest': 'bg-red-50 text-red-700 border-red-200',
  'DOCX': 'bg-blue-50 text-blue-700 border-blue-200',
  'react-force-graph': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300',
  'Tiptap': 'bg-violet-50 text-violet-700 border-violet-200',
};

// ═══════════════════════════════════════════
// Components
// ═══════════════════════════════════════════

function TechBadge({ name }: { name: string }) {
  const color = techColors[name] || 'bg-gray-100 text-gray-700 border-gray-300';
  return (
    <span className={`inline-block px-1.5 py-0.5 text-[9px] font-semibold rounded border ${color} whitespace-nowrap`}>
      {name}
    </span>
  );
}

function DataLabel({ label, isHe }: { label: { en: string; he: string }; isHe: boolean }) {
  return (
    <div className="text-[9px] font-mono bg-white/80 text-slate-600 px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap shadow-sm mx-1">
      {isHe ? label.he : label.en}
    </div>
  );
}

function FlowArrow({ isHe, vertical = false, label }: { isHe: boolean; vertical?: boolean; label?: { en: string; he: string } }) {
  if (vertical) {
    return (
      <div className="flex flex-col items-center my-1 shrink-0">
        {label && <DataLabel label={label} isHe={isHe} />}
        <ArrowDown className="w-5 h-5 text-slate-400" />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center shrink-0 mx-1">
      {label && <DataLabel label={label} isHe={isHe} />}
      <ArrowRight className={`w-5 h-5 text-slate-400 ${isHe ? 'rotate-180' : ''}`} />
    </div>
  );
}

function NodeCard({ titleEn, titleHe, descEn, descHe, icon: Icon, type, isHe, isDiamond, techs, dataLabel }: FlowNodeProps) {
  const s = nodeStyles[type];

  if (isDiamond) {
    return (
      <div className="relative flex flex-col items-center justify-center group shrink-0 mx-3 my-2">
        <div className={`w-24 h-24 ${s.bg} border-2 ${s.border} shadow-sm rotate-45 flex items-center justify-center transition-transform group-hover:scale-105`}>
          <div className="-rotate-45 flex flex-col items-center text-center p-1">
            <Icon className={`w-5 h-5 ${s.iconColor.replace('text-white', s.text.replace('text-', 'text-'))} mb-0.5`} />
            <span className={`text-[9px] font-bold leading-tight ${s.text}`}>{isHe ? titleHe : titleEn}</span>
          </div>
        </div>
        <div className="absolute top-full mt-1 w-44 bg-gray-800 text-white text-[10px] p-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none z-20 text-center transition-opacity">
          {isHe ? descHe : descEn}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-[165px] min-h-[110px] flex flex-col rounded-xl border-2 ${s.border} ${s.bg} p-2.5 shadow-sm transition-all hover:shadow-lg hover:scale-[1.02] group shrink-0 relative m-1.5`}>
      <div className={`w-9 h-9 rounded-lg ${s.iconBg} flex items-center justify-center mb-2 shadow-sm`}>
        <Icon className={`w-4.5 h-4.5 ${s.iconColor}`} />
      </div>
      <h3 className={`text-[12px] font-bold mb-0.5 leading-snug ${s.text}`}>{isHe ? titleHe : titleEn}</h3>
      <p className={`text-[10px] opacity-75 leading-snug ${s.text} mb-1.5`}>{isHe ? descHe : descEn}</p>
      {techs && techs.length > 0 && (
        <div className="flex flex-wrap gap-0.5 mt-auto pt-1 border-t border-black/5">
          {techs.map(t => <TechBadge key={t} name={t} />)}
        </div>
      )}
    </div>
  );
}

function PhaseHeader({ titleEn, titleHe, number, subEn, subHe, gradient, isHe }: {
  titleEn: string; titleHe: string; number: string; subEn?: string; subHe?: string; gradient: string; isHe: boolean;
}) {
  return (
    <div className={`w-full p-4 bg-gradient-to-r ${gradient} text-white rounded-t-2xl`}>
      <h2 className="text-lg font-bold">
        {isHe ? `שלב ${number}: ${titleHe}` : `Phase ${number}: ${titleEn}`}
      </h2>
      {subEn && <p className="text-sm opacity-80 mt-0.5">{isHe ? subHe : subEn}</p>}
    </div>
  );
}

function PhaseSection({ children, gradient, bg, titleEn, titleHe, number, subEn, subHe, isHe }: {
  children: React.ReactNode; gradient: string; bg: string; titleEn: string; titleHe: string;
  number: string; subEn?: string; subHe?: string; isHe: boolean;
}) {
  return (
    <div className={`w-full rounded-2xl overflow-hidden shadow-md border border-gray-200 ${bg} mb-2`}>
      <PhaseHeader titleEn={titleEn} titleHe={titleHe} number={number} subEn={subEn} subHe={subHe} gradient={gradient} isHe={isHe} />
      <div className="p-4 md:p-6">{children}</div>
    </div>
  );
}

function PhaseConnector({ label, isHe }: { label?: { en: string; he: string }; isHe: boolean }) {
  return (
    <div className="flex flex-col items-center my-3">
      {label && (
        <div className="text-[10px] font-mono text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-full mb-1 shadow-sm">
          {isHe ? label.he : label.en}
        </div>
      )}
      <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center shadow-sm">
        <ArrowDown className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  );
}

function BranchLabel({ text, color = 'text-green-600' }: { text: string; color?: string }) {
  return <span className={`text-[10px] font-bold ${color}`}>{text}</span>;
}

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

export default function FlowchartClient({ isAdmin }: { isAdmin: boolean }) {
  const locale = useLocale() as 'en' | 'he';
  const isHe = locale === 'he';

  return (
    <DashboardLayout isAdmin={isAdmin} showSidebar={isAdmin}>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20" dir={isHe ? 'rtl' : 'ltr'}>

        {/* ══ HEADER ══ */}
        <div className="w-full bg-white border-b border-gray-200 shadow-sm mb-6">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                    <Workflow className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                      {isHe ? 'תרשים זרימת מערכת' : 'System Flowchart'}
                    </h1>
                    <p className="text-sm text-gray-500">
                      {isHe ? 'מטיוטה לפרסום — סוכני AI, אוטומציה ואדם-בלולאה' : 'From manuscript to publication — AI Agents, automation & human-in-the-loop'}
                    </p>
                  </div>
                </div>
                <Link href="/architecture" className="text-sm text-blue-600 hover:text-blue-800 underline underline-offset-2 mt-1 inline-block">
                  {isHe ? '← חזרה לעמוד ארכיטקטורה' : '← Back to Architecture'}
                </Link>
              </div>

              {/* Legend */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-1.5 text-[11px]">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" />{isHe ? 'משתמש / ממשק' : 'User / UI'}</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500" />{isHe ? 'סוכן AI' : 'AI Agent'}</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500" />{isHe ? 'תור / אירוע' : 'Queue / Event'}</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-teal-500 rotate-45" />{isHe ? 'RPA / אוטומציה' : 'RPA / Playwright'}</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-green-600" />{isHe ? 'מסד נתונים' : 'Database'}</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-yellow-500 rotate-45" />{isHe ? 'לוגיקה / תנאי' : 'Logic / Condition'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col items-center">

          {/* ══════════════════════════════════
               PHASE 1: DATA INGESTION
             ══════════════════════════════════ */}
          <PhaseSection number="1" titleEn="User Initiation & Data Ingestion" titleHe="קליטת המסמך והנתונים"
            subEn="File upload → Parse → Store → Trigger background pipeline" subHe="העלאת קובץ → פירוק → שמירה → הפעלת צינור רקע"
            gradient="from-blue-600 to-blue-800" bg="bg-blue-50/30" isHe={isHe}>
            <div className="flex flex-wrap justify-center items-center">
              <NodeCard type="user" icon={User} isHe={isHe}
                titleEn="1. User UI" titleHe="1. ממשק משתמש"
                descEn="Upload Draft Manuscript (Word/PDF) & select Target Journal"
                descHe="העלאת טיוטת מאמר (Word/PDF) ובחירת כתב עת יעד"
                techs={['Next.js 16', 'Tiptap']} />
              <FlowArrow isHe={isHe} label={{ en: 'File + journal', he: 'קובץ + עיתון' }} />
              <NodeCard type="infra" icon={Code} isHe={isHe}
                titleEn="2. Frontend Parser" titleHe="2. מנתח מסמכים"
                descEn="Next.js API Route parses document to raw text"
                descHe="נתיב API של Next.js מפרק את המסמך לטקסט גולמי"
                techs={['Mammoth', 'PDF Parser']} />
              <FlowArrow isHe={isHe} label={{ en: 'Raw text', he: 'טקסט גולמי' }} />
              <NodeCard type="infra" icon={FileText} isHe={isHe}
                titleEn="3. Metadata Extraction" titleHe="3. חילוץ מטא-דאטה"
                descEn="Extract Authors, Affiliations, Keywords, Abstract"
                descHe="חילוץ מחברים, שיוך מוסדי, מילות מפתח, תקציר"
                techs={['Claude 3.5 Haiku', 'Zod']} />
              <FlowArrow isHe={isHe} label={{ en: 'Metadata JSON', he: 'JSON מטא-דאטה' }} />
              <NodeCard type="db" icon={Database} isHe={isHe}
                titleEn="4. Neon PostgreSQL" titleHe="4. מסד נתונים"
                descEn="INSERT into 'papers' table. Returns Record ID. Cache in Redis."
                descHe="שמירת רשומה בטבלת papers. החזרת מזהה. שמירה ב-Redis."
                techs={['Neon Postgres', 'Drizzle ORM', 'Upstash Redis']} />
              <FlowArrow isHe={isHe} label={{ en: 'paper.id', he: 'paper.id' }} />
              <NodeCard type="queue" icon={Zap} isHe={isHe}
                titleEn="5. Inngest Queue" titleHe="5. תור משימות"
                descEn="Fire event: 'paper/uploaded' with paperId payload"
                descHe="הפעלת אירוע 'paper/uploaded' עם מזהה המאמר"
                techs={['Inngest']} />
            </div>
          </PhaseSection>

          <PhaseConnector label={{ en: "Event: 'paper/uploaded'", he: "אירוע: 'paper/uploaded'" }} isHe={isHe} />

          {/* ══════════════════════════════════
               PHASE 2: 10-AGENT PIPELINE
             ══════════════════════════════════ */}
          <PhaseSection number="2" titleEn="The 10-Agent Rewriting Pipeline" titleHe="צינור 10 הסוכנים"
            subEn="AgentOrchestrator passes shared AgentContext sequentially through 10 specialized agents"
            subHe="מנצח הסוכנים מעביר הקשר משותף ברצף דרך 10 סוכנים מומחים"
            gradient="from-green-600 to-green-800" bg="bg-green-50/30" isHe={isHe}>

            {/* Orchestrator */}
            <div className="flex flex-wrap items-center justify-center mb-3">
              <NodeCard type="queue" icon={Zap} isHe={isHe}
                titleEn="Event Trigger" titleHe="טריגר אירוע"
                descEn="Inngest function 'paper/uploaded' fires"
                descHe="פונקציית Inngest מופעלת"
                techs={['Inngest']} />
              <FlowArrow isHe={isHe} />
              <NodeCard type="agent" icon={Bot} isHe={isHe}
                titleEn="AgentOrchestrator" titleHe="מנצח הסוכנים"
                descEn="Instantiates AgentContext. Routes through 10 agents sequentially."
                descHe="יוצר אובייקט הקשר משותף ומנתב ברצף דרך 10 סוכנים."
                techs={['LangGraph', 'Langfuse', 'Mem0']} />
              <FlowArrow isHe={isHe} label={{ en: 'AgentContext', he: 'הקשר סוכן' }} />
            </div>

            {/* Row 1: Agents 6-10 */}
            <div className="border-2 border-dashed border-green-200 rounded-xl p-3 mb-3 bg-green-50/50">
              <span className="text-[10px] font-bold text-green-600 mb-2 block">{isHe ? 'שלב ניתוח ותכנון' : 'Analysis & Planning Phase'}</span>
              <div className="flex flex-wrap justify-center items-center">
                <NodeCard type="agent" icon={Search} isHe={isHe}
                  titleEn="6. ClarificationAgent" titleHe="6. סוכן הבהרה"
                  descEn="Interviews user, extracts editorial goals & journal constraints"
                  descHe="מראיין את המשתמש, מחלץ יעדי עריכה ואילוצי כתב עת"
                  techs={['Claude 3.7', 'Vercel AI SDK', 'Zod']} />
                <FlowArrow isHe={isHe} label={{ en: 'ClarificationReport', he: 'דוח הבהרה' }} />
                <NodeCard type="agent" icon={FileText} isHe={isHe}
                  titleEn="7. PlanningAgent" titleHe="7. סוכן תכנון"
                  descEn="Builds step-by-step revision DAG & narrative arc"
                  descHe="בונה גרף משימות מכוון (DAG) וקשת נרטיב"
                  techs={['Claude 3.7']} />
                <FlowArrow isHe={isHe} label={{ en: 'RevisionPlan', he: 'תוכנית שכתוב' }} />
                <NodeCard type="agent" icon={Search} isHe={isHe}
                  titleEn="8. KnowledgeAgent" titleHe="8. סוכן ידע"
                  descEn="MCP → PubMed/ArXiv. GraphRAG for literature. Finds missing citations."
                  descHe="חיפוש ספרות דרך MCP + PubMed/ArXiv. GraphRAG למציאת ציטוטים חסרים."
                  techs={['Claude 3.7', 'MCP', 'pgvector', 'GraphRAG']} />
                <FlowArrow isHe={isHe} label={{ en: 'LiteratureMatrix', he: 'מטריצת ספרות' }} />
                <NodeCard type="agent" icon={MessageSquare} isHe={isHe}
                  titleEn="9. SciReviewAgent" titleHe="9. עימות סוקרים"
                  descEn="Multi-model debate: Harsh (Claude) + Analytical (GPT-4o) + Optimist (Gemini)"
                  descHe="דיבייט רב-מודלי: קשוח (Claude) + אנליטי (GPT-4o) + אופטימי (Gemini)"
                  techs={['Claude 3.7', 'GPT-4o', 'Gemini 1.5', 'Vercel AI SDK']} />
                <FlowArrow isHe={isHe} label={{ en: 'DebateTranscript', he: 'תמלול דיבייט' }} />
                <NodeCard type="agent" icon={Layers} isHe={isHe}
                  titleEn="Area Chair (o1)" titleHe="סוכן-על (o1)"
                  descEn="Synthesizes debate into concrete action plan using deep reasoning"
                  descHe="מסנתז את הדיבייט לתוכנית פעולה באמצעות הסקה לוגית עמוקה"
                  techs={['OpenAI o1', 'RLHF']} />
              </div>
            </div>

            {/* Row 2: Writing loop */}
            <div className="border-2 border-dashed border-purple-200 rounded-xl p-3 mb-3 bg-purple-50/30">
              <span className="text-[10px] font-bold text-purple-600 mb-2 block">{isHe ? 'לולאת כתיבה (LangGraph + Langfuse)' : 'Writing Loop (LangGraph + Langfuse)'}</span>
              <div className="flex flex-wrap justify-center items-center">
                <NodeCard type="agent" icon={Brain} isHe={isHe}
                  titleEn="Mem0 Context" titleHe="הקשר Mem0"
                  descEn="Fetch user preferences, past feedback & writing style from long-term memory"
                  descHe="שליפת העדפות, משוב קודם וסגנון כתיבה מהזיכרון ארוך-טווח"
                  techs={['Mem0', 'Upstash Redis']} />
                <FlowArrow isHe={isHe} label={{ en: 'preferences', he: 'העדפות' }} />
                <NodeCard type="agent" icon={Edit3} isHe={isHe}
                  titleEn="10. AcademicWriting" titleHe="10. סוכן כתיבה"
                  descEn="Iterative LangGraph loop. Rewrites prose to Nature/Science standards."
                  descHe="לולאת LangGraph איטרטיבית. שכתוב לרמה של Nature/Science."
                  techs={['Claude 3.7', 'LangGraph', 'Langfuse']} />
                <FlowArrow isHe={isHe} label={{ en: 'revisedText', he: 'טקסט משוכתב' }} />
                <NodeCard type="logic" icon={ShieldCheck} isHe={isHe}
                  titleEn="Guardrails AI" titleHe="בדיקת בטיחות"
                  descEn="Validate: no PII leakage, no AI clichés, academic tone, no hallucinations"
                  descHe="ולידציה: ללא PII, ללא קלישאות AI, טון אקדמי, ללא הזיות"
                  techs={['Guardrails AI', 'Zod']} />
                <div className="flex flex-col items-center mx-2">
                  <BranchLabel text={isHe ? 'נכשל → חזרה' : 'Fail → Loop'} color="text-red-500" />
                  <RefreshCw className="w-4 h-4 text-red-400" />
                </div>
              </div>
            </div>

            {/* Row 3: Execution + Integrity */}
            <div className="flex flex-wrap justify-center items-center mb-3">
              <NodeCard type="agent" icon={Code} isHe={isHe}
                titleEn="11. ExecutionAgent" titleHe="11. סוכן ביצוע"
                descEn="Applies line-by-line diff to manuscript. Generates JSON patch & changelog."
                descHe="מחיל שינויים סעיף-אחר-סעיף. מייצר Diff ויומן שינויים."
                techs={['Claude 3.7', 'Tiptap']} />
              <FlowArrow isHe={isHe} label={{ en: 'Diff patch', he: 'תיקונים' }} />
              <NodeCard type="logic" icon={Shield} isHe={isHe}
                titleEn="IntegrityScanner" titleHe="סורק תקינות"
                descEn="Plagiarism score + AI-generation detection"
                descHe="ציון פלגיאט + זיהוי יצירת AI"
                techs={['Claude 3.7']} />
              <FlowArrow isHe={isHe} />
              <NodeCard type="logic" icon={HelpCircle} isDiamond isHe={isHe}
                titleEn="Pass?" titleHe="עבר?"
                descEn="Integrity threshold check" descHe="האם עבר בדיקת סף?" />
              <div className="flex flex-col items-center mx-2">
                <BranchLabel text={isHe ? 'נכשל' : 'Fail'} color="text-red-500" />
                <FlowArrow isHe={isHe} />
              </div>
              <NodeCard type="error" icon={AlertTriangle} isHe={isHe}
                titleEn="Halt Pipeline" titleHe="עצירת תהליך"
                descEn="Throw error. Notify user." descHe="זריקת שגיאה. התראה למשתמש." />
            </div>

            {/* Row 4: QA to email */}
            <div className="border-t-2 border-dashed border-green-200 pt-3">
              <span className="text-[10px] font-bold text-green-600 mb-2 block">{isHe ? 'בקרת איכות ואריזה (Pass ↓)' : 'QA & Packaging (Pass ↓)'}</span>
              <div className="flex flex-wrap justify-center items-center">
                <NodeCard type="agent" icon={CheckCircle} isHe={isHe}
                  titleEn="14. QaAgent" titleHe="14. סוכן QA"
                  descEn="Final consistency, formatting, cross-references, grammar check"
                  descHe="בדיקת עקביות סופית, עיצוב, הפניות צולבות, דקדוק"
                  techs={['Claude 3.7', 'Jest']} />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={ListChecks} isHe={isHe}
                  titleEn="15. VerificationAgent" titleHe="15. סוכן אימות"
                  descEn="Verify journal guidelines compliance (word limits, citations)"
                  descHe="אימות עמידה בהנחיות כתב העת (מגבלת מילים, ציטוטים)"
                  techs={['OpenAI o1']} />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={FileText} isHe={isHe}
                  titleEn="16. CoverLetterAgent" titleHe="16. מכתב מקדים"
                  descEn="Generate persuasive cover letter to Editor-in-Chief"
                  descHe="יצירת מכתב מקדים משכנע לעורך הראשי"
                  techs={['Claude 3.7']} />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Download} isHe={isHe}
                  titleEn="17. CompilationAgent" titleHe="17. סוכן הידור"
                  descEn="Compile final manuscript + cover letter + metadata payload"
                  descHe="הידור מאמר סופי + מכתב מקדים + מטען נתונים"
                  techs={['Claude 3.7', 'DOCX']} />
                <FlowArrow isHe={isHe} label={{ en: 'Package', he: 'חבילה' }} />
                <NodeCard type="db" icon={Database} isHe={isHe}
                  titleEn="18. Update DB" titleHe="18. עדכון מסד"
                  descEn="status → 'awaiting_approval'. Save paperVersions."
                  descHe="עדכון סטטוס → 'ממתין לאישור'. שמירת גרסאות."
                  techs={['Neon Postgres', 'Drizzle ORM']} />
                <FlowArrow isHe={isHe} />
                <NodeCard type="rpa" icon={Mail} isHe={isHe}
                  titleEn="19. Email Notify" titleHe="19. התראה"
                  descEn="Send 'Paper Ready for Review' email to user"
                  descHe="שליחת מייל 'מאמר מוכן לבדיקה' למשתמש"
                  techs={['Nodemailer']} />
              </div>
            </div>
          </PhaseSection>

          <PhaseConnector label={{ en: "User reviews → clicks 'Approve & Submit'", he: "המשתמש סוקר → לוחץ 'אשר והגש'" }} isHe={isHe} />

          {/* ══════════════════════════════════
               PHASE 3: CREDENTIAL GATEWAY
             ══════════════════════════════════ */}
          <PhaseSection number="3" titleEn="Credential Decryption & Submission Gateway" titleHe="פענוח הרשאות ושער הגשה"
            subEn="Decrypt credentials → Route to the correct submission pathway by journal platform type"
            subHe="פענוח הרשאות → ניתוב לנתיב ההגשה המתאים לפי סוג הפלטפורמה"
            gradient="from-rose-500 to-rose-700" bg="bg-rose-50/30" isHe={isHe}>
            <div className="flex flex-wrap justify-center items-center">
              <NodeCard type="user" icon={User} isHe={isHe}
                titleEn="20. Approve & Submit" titleHe="20. אישור והגשה"
                descEn="User reviews final paper and clicks 'Approve & Submit'"
                descHe="המשתמש סוקר את המאמר ולוחץ 'אשר והגש'"
                techs={['Next.js 16']} />
              <FlowArrow isHe={isHe} label={{ en: "submission/process", he: "submission/process" }} />
              <NodeCard type="queue" icon={Zap} isHe={isHe}
                titleEn="21. Inngest Queue" titleHe="21. תור הגשות"
                descEn="Trigger event: 'submission/process' with submissionId"
                descHe="הפעלת אירוע תהליך הגשה עם מזהה ההגשה"
                techs={['Inngest']} />
              <FlowArrow isHe={isHe} label={{ en: "credentials", he: "הרשאות" }} />
              <NodeCard type="rpa" icon={Lock} isHe={isHe}
                titleEn="22. AES-256-GCM" titleHe="22. פענוח הצפנה"
                descEn="Decrypt user credentials from journalConnections table"
                descHe="פענוח הרשאות מוצפנות מטבלת חיבורי כתבי עת"
                techs={['AES-256-GCM', 'Neon Postgres']} />
              <FlowArrow isHe={isHe} />
              <NodeCard type="logic" icon={Settings} isDiamond isHe={isHe}
                titleEn="23. Platform Router" titleHe="23. ניתוב פלטפורמה"
                descEn="journalPlatformEnum: WordPress / Editorial Manager / Email / Generic"
                descHe="ניתוב לפי סוג: WordPress / Editorial Manager / Email / כללי" />
              <FlowArrow isHe={isHe} />
              <div className="w-[180px] border-2 border-dashed border-rose-300 bg-white p-3 rounded-xl m-1.5">
                <h4 className="font-bold text-rose-800 text-[12px] mb-1.5 text-center">{isHe ? '4 נתיבי הגשה' : '4 Submission Pathways'}</h4>
                <div className="text-[10px] text-rose-600 space-y-1">
                  <div className="flex items-center gap-1"><Globe className="w-3 h-3" /> WordPress / OJS API</div>
                  <div className="flex items-center gap-1"><Globe className="w-3 h-3" /> Editorial Manager API</div>
                  <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email (SMTP)</div>
                  <div className="flex items-center gap-1"><Bot className="w-3 h-3" /> RPA Bot (Playwright)</div>
                </div>
              </div>
            </div>
          </PhaseSection>

          <PhaseConnector isHe={isHe} />

          {/* ══════════════════════════════════
               PHASES 4A & 4B: PARALLEL
             ══════════════════════════════════ */}
          <div className="w-full flex flex-col lg:flex-row gap-4">

            {/* 4A: Fast Lanes */}
            <div className="flex-1">
              <PhaseSection number="4A" titleEn="API & Email (Fast Lanes)" titleHe="נתיבי הגשה מהירים (API/Mail)"
                gradient="from-teal-500 to-teal-700" bg="bg-teal-50/30" isHe={isHe}>
                <div className="space-y-3">
                  {[
                    { id: '1', icon: Globe, tEn: 'WordPress / OJS', tHe: 'WordPress / OJS', dEn: 'Execute POST to REST API', dHe: 'ביצוע קריאות REST API', techs: ['Next.js 16', 'Drizzle ORM'] },
                    { id: '2', icon: Globe, tEn: 'EditorialManager API', tHe: 'EditorialManager API', dEn: 'Execute API stub requests', dHe: 'ביצוע קריאות API', techs: ['Next.js 16'] },
                    { id: '3', icon: Mail, tEn: 'EmailAdapter', tHe: 'מתאם אימייל', dEn: 'Multipart MIME → SMTP → Editor', dHe: 'שליחת מייל עם חבילת הגשה ישירות לעורך', techs: ['Nodemailer'] },
                  ].map(item => (
                    <div key={item.id} className="flex items-center">
                      <NodeCard type="rpa" icon={item.icon} isHe={isHe} titleEn={`4A.${item.id}. ${item.tEn}`} titleHe={`4A.${item.id}. ${item.tHe}`} descEn={item.dEn} descHe={item.dHe} techs={item.techs} />
                      <FlowArrow isHe={isHe} />
                      <NodeCard type="success" icon={CheckCircle2} isHe={isHe} titleEn="Success ✓" titleHe="הצלחה ✓" descEn="Submission complete" descHe="ההגשה הושלמה" techs={['Neon Postgres']} />
                    </div>
                  ))}
                </div>
              </PhaseSection>
            </div>

            {/* 4B: RPA Complex Lane */}
            <div className="flex-1">
              <PhaseSection number="4B" titleEn="Autonomous RPA Bot (Complex Lane)" titleHe="בוט RPA אוטונומי (נתיב מורכב)"
                gradient="from-purple-600 to-purple-800" bg="bg-purple-50/30" isHe={isHe}>
                <div className="flex flex-col items-center">
                  <NodeCard type="rpa" icon={Bot} isHe={isHe}
                    titleEn="4B.1 GenericNavigator" titleHe="4B.1 נווט גנרי"
                    descEn="Launch headless Chromium & load journal portal"
                    descHe="הפעלת דפדפן ללא ראש וטעינת פורטל כתב העת"
                    techs={['Playwright']} />
                  <FlowArrow isHe={isHe} vertical />
                  <NodeCard type="logic" icon={Search} isDiamond isHe={isHe}
                    titleEn="4B.2 DOM Found?" titleHe="4B.2 אלמנטים נמצאו?"
                    descEn="Are CSS selectors visible?" descHe="האם סלקטורים קיימים?" />
                  <div className="flex w-full mt-2 justify-center gap-4">
                    <div className="flex flex-col items-center">
                      <BranchLabel text={isHe ? 'לא' : 'No'} color="text-red-500" />
                      <NodeCard type="rpa" icon={Eye} isHe={isHe}
                        titleEn="4B.3 Vision AI" titleHe="4B.3 ראייה ממוחשבת"
                        descEn="Claude → JSON {X,Y} → Click" descHe="Claude → קואורדינטות → לחיצה"
                        techs={['Vision AI', 'Claude 3.5 Haiku']} />
                    </div>
                    <div className="flex flex-col items-center">
                      <BranchLabel text={isHe ? 'כן' : 'Yes'} />
                      <NodeCard type="rpa" icon={Edit3} isHe={isHe}
                        titleEn="4B.4 Fill & Upload" titleHe="4B.4 מילוי והעלאה"
                        descEn="fillForm() & uploadFiles()" descHe="מילוי שדות והעלאת קבצים"
                        techs={['Playwright']} />
                    </div>
                  </div>
                  <FlowArrow isHe={isHe} vertical />
                  <NodeCard type="logic" icon={Lock} isDiamond isHe={isHe}
                    titleEn="4B.5 CAPTCHA?" titleHe="4B.5 אימות?"
                    descEn="CAPTCHA / 2FA detected?" descHe="זוהה CAPTCHA / אימות דו-שלבי?" />
                  <div className="flex w-full mt-2 justify-center gap-4">
                    <div className="flex flex-col items-center">
                      <BranchLabel text={isHe ? 'כן' : 'Yes'} color="text-orange-500" />
                      <NodeCard type="queue" icon={User} isHe={isHe}
                        titleEn="4B.6 Pause & HITL" titleHe="4B.6 השהיה + HITL"
                        descEn="Screenshot → WebSocket → User solves → Resume"
                        descHe="צילום מסך → התראה → המשתמש פותר → חידוש"
                        techs={['WebSockets', 'Inngest']} />
                    </div>
                    <div className="flex flex-col items-center">
                      <BranchLabel text={isHe ? 'לא' : 'No'} />
                      <NodeCard type="rpa" icon={CheckCircle2} isHe={isHe}
                        titleEn="4B.7 Final Submit" titleHe="4B.7 הגשה סופית"
                        descEn="Click Submit → Scrape Tracking ID"
                        descHe="לחיצה על שליחה → חילוץ מזהה מעקב"
                        techs={['Playwright']} />
                    </div>
                  </div>
                  <FlowArrow isHe={isHe} vertical />
                  <NodeCard type="db" icon={Database} isHe={isHe}
                    titleEn="4B.8 Update DB" titleHe="4B.8 עדכון מסד"
                    descEn="submissions.status → 'submitted'. Save trackingId."
                    descHe="עדכון סטטוס → 'הוגש'. שמירת מזהה מעקב."
                    techs={['Neon Postgres', 'Drizzle ORM']} />
                </div>
              </PhaseSection>
            </div>
          </div>

          <PhaseConnector label={{ en: "Event: 'reviewer-comments-received'", he: "אירוע: 'קבלת הערות סוקרים'" }} isHe={isHe} />

          {/* ══════════════════════════════════
               PHASE 5: PEER REVIEW PING-PONG
             ══════════════════════════════════ */}
          <PhaseSection number="5" titleEn="Peer Review Ping-Pong (Resubmission)" titleHe="פינג-פונג ביקורת עמיתים"
            subEn="Ingest reviewer feedback → Generate rebuttal strategy → Re-run agents → Submit revision"
            subHe="קליטת משוב סוקרים → יצירת אסטרטגיית תגובה → הרצת סוכנים מחדש → הגשת גרסה מתוקנת"
            gradient="from-amber-500 to-amber-700" bg="bg-amber-50/30" isHe={isHe}>
            {/* Row 1 */}
            <div className="flex flex-wrap justify-center items-center mb-3">
              <NodeCard type="queue" icon={Zap} isHe={isHe}
                titleEn="36. Webhook" titleHe="36. אירוע"
                descEn="Event: 'reviewer-comments-received'"
                descHe="אירוע: 'קבלת הערות סוקרים'"
                techs={['Inngest']} />
              <FlowArrow isHe={isHe} />
              <NodeCard type="db" icon={FileText} isHe={isHe}
                titleEn="37. Fetch Manuscript" titleHe="37. שליפת מאמר"
                descEn="Load latest version from 'paperStages' table"
                descHe="טעינת הגרסה האחרונה מטבלת הגרסאות"
                techs={['Neon Postgres', 'Drizzle ORM']} />
              <FlowArrow isHe={isHe} label={{ en: 'manuscript + comments', he: 'מאמר + הערות' }} />
              <NodeCard type="agent" icon={Brain} isHe={isHe}
                titleEn="38. RebuttalAgent" titleHe="38. סוכן תגובה"
                descEn="Parse critique → Classify (Major/Minor) → Generate rebuttalStrategy"
                descHe="ניתוח ביקורת → סיווג (מהותי/משני) → יצירת אסטרטגיית תגובה"
                techs={['Claude 3.7', 'GPT-4o-mini', 'Zod']} />
              <FlowArrow isHe={isHe} />
              <NodeCard type="db" icon={Database} isHe={isHe}
                titleEn="39. Save Strategy" titleHe="39. שמירת אסטרטגיה"
                descEn="Save to 'paperVersions' table"
                descHe="שמירה בטבלת גרסאות המאמר"
                techs={['Neon Postgres']} />
              <FlowArrow isHe={isHe} />
              <NodeCard type="user" icon={User} isHe={isHe}
                titleEn="40. User Approve" titleHe="40. אישור משתמש"
                descEn="User reviews & approves rebuttal strategy"
                descHe="המשתמש סוקר ומאשר את אסטרטגיית התגובה"
                techs={['Next.js 16']} />
            </div>

            {/* Loop */}
            <div className="border-2 border-purple-300 rounded-xl p-3 bg-purple-50/30 mb-3">
              <span className="text-[10px] font-bold text-purple-600 block mb-2">{isHe ? '41. הרצת סוכנים מחדש (Loop)' : '41. Re-run Agents (Loop)'}</span>
              <div className="flex flex-wrap justify-center items-center">
                <NodeCard type="agent" icon={Search} isHe={isHe}
                  titleEn="KnowledgeAgent" titleHe="סוכן ידע"
                  descEn="Find new citations for rebuttal" descHe="מציאת ציטוטים חדשים לתגובה"
                  techs={['MCP', 'pgvector']} />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Code} isHe={isHe}
                  titleEn="ExecutionAgent" titleHe="סוכן ביצוע"
                  descEn="Apply targeted edits to specific paragraphs" descHe="עריכה ממוקדת של הפסקאות הרלוונטיות"
                  techs={['Claude 3.7', 'LangGraph']} />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={CheckCircle} isHe={isHe}
                  titleEn="QaAgent" titleHe="סוכן QA"
                  descEn="Verify changes don't break other sections" descHe="ווידוא שהתיקונים לא שוברים חלקים אחרים"
                  techs={['Claude 3.7']} />
              </div>
            </div>

            <div className="flex flex-wrap justify-center items-center">
              <NodeCard type="agent" icon={Edit3} isHe={isHe}
                titleEn="42. Generate Rebuttal" titleHe="42. הפקת מכתב תגובה"
                descEn="Point-by-point Response to Reviewers document"
                descHe="מסמך תגובה נקודתי לסוקרים"
                techs={['Claude 3.7', 'DOCX']} />
              <FlowArrow isHe={isHe} />
              <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3 flex flex-col items-center shadow-sm m-1.5">
                <RefreshCw className="w-5 h-5 text-rose-600 mb-1" />
                <span className="text-[11px] font-bold text-rose-700 text-center">
                  {isHe ? '↩ חזרה לשלב 3 (שער הגשה)' : '↩ Back to Phase 3 (Gateway)'}
                </span>
              </div>
            </div>
          </PhaseSection>

          <PhaseConnector label={{ en: "Event: 'processPaperRejected'", he: "אירוע: 'עיבוד מאמר שנדחה'" }} isHe={isHe} />

          {/* ══════════════════════════════════
               PHASE 6: JOURNAL CASCADE
             ══════════════════════════════════ */}
          <PhaseSection number="6" titleEn="Journal Cascade (Rejection Handling)" titleHe="מפל כתבי עת (טיפול בדחייה)"
            subEn="Auto-find next-tier journal from cascade map → Reformat → Resubmit"
            subHe="מציאה אוטומטית של כתב העת הבא ברשימת היעדים → עיצוב מחדש → הגשה"
            gradient="from-emerald-600 to-emerald-800" bg="bg-emerald-50/30" isHe={isHe}>
            <div className="flex flex-wrap justify-center items-center">
              <NodeCard type="queue" icon={Zap} isHe={isHe}
                titleEn="44. Queue Event" titleHe="44. אירוע דחייה"
                descEn="'processPaperRejected' with paperId"
                descHe="הפעלת תהליך טיפול במאמר שנדחה"
                techs={['Inngest']} />
              <FlowArrow isHe={isHe} />
              <NodeCard type="agent" icon={Brain} isHe={isHe}
                titleEn="45. Cascade Agent" titleHe="45. סוכן מפל"
                descEn="Read 'JournalCascadeMap' → Find next-tier journal based on field & impact factor"
                descHe="קריאת מפת המפל → מציאת כתב העת הבא לפי תחום ואימפקט פקטור"
                techs={['Claude 3.7', 'Neon Postgres']} />
              <FlowArrow isHe={isHe} label={{ en: 'new journal rules', he: 'הנחיות חדשות' }} />
              <NodeCard type="agent" icon={Scissors} isHe={isHe}
                titleEn="46. Reformat" titleHe="46. עיצוב מחדש"
                descEn="Restructure manuscript to fit new journal guidelines (citations, word limit, sections)"
                descHe="התאמת המאמר להנחיות החדשות (ציטוטים, מגבלת מילים, מבנה)"
                techs={['Claude 3.7']} />
              <FlowArrow isHe={isHe} />
              <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-3 flex flex-col items-center shadow-sm m-1.5">
                <RefreshCw className="w-5 h-5 text-rose-600 mb-1" />
                <span className="text-[11px] font-bold text-rose-700 text-center">
                  {isHe ? '↩ חזרה לשער ההגשה (שלב 3)' : '↩ Back to Gateway (Phase 3)'}
                </span>
              </div>
              <FlowArrow isHe={isHe} />
              <NodeCard type="success" icon={CheckCircle2} isHe={isHe}
                titleEn="48. Published! 🎉" titleHe="48. פורסם! 🎉"
                descEn="Paper accepted & published in target journal"
                descHe="המאמר התקבל ופורסם בכתב העת"
                techs={['Neon Postgres', 'Nodemailer']} />
            </div>
          </PhaseSection>

          {/* ══════════════════════════════════
               GLOBAL INFRASTRUCTURE
             ══════════════════════════════════ */}
          <div className="w-full mt-6">
            <PhaseSection number="∞" titleEn="Global Infrastructure (Cross-Cutting)" titleHe="תשתיות רוחביות"
              subEn="These services run across all phases"
              subHe="שירותים אלו פועלים לרוחב כל השלבים"
              gradient="from-slate-600 to-slate-800" bg="bg-slate-50/30" isHe={isHe}>
              <div className="flex flex-wrap justify-center gap-2">
                <NodeCard type="infra" icon={Shield} isHe={isHe}
                  titleEn="Authentication" titleHe="הזדהות ואבטחה"
                  descEn="User login, session management, role-based access"
                  descHe="התחברות, ניהול סשנים, הרשאות מבוססות תפקיד"
                  techs={['NextAuth.js', 'Upstash Redis', 'Neon Postgres']} />
                <NodeCard type="infra" icon={Activity} isHe={isHe}
                  titleEn="Observability" titleHe="ניטור ומעקב"
                  descEn="LLM tracing, token usage, latency monitoring, prompt management"
                  descHe="מעקב אחר מודלים, שימוש בטוקנים, חביון, ניהול פרומפטים"
                  techs={['Langfuse']} />
                <NodeCard type="infra" icon={Brain} isHe={isHe}
                  titleEn="Long-Term Memory" titleHe="זיכרון ארוך-טווח"
                  descEn="Cross-session user preferences, writing style, feedback history"
                  descHe="העדפות משתמש, סגנון כתיבה ומשוב חוצי-סשנים"
                  techs={['Mem0', 'Upstash Redis']} />
                <NodeCard type="infra" icon={BarChart2} isHe={isHe}
                  titleEn="Analytics & RLHF" titleHe="אנליטיקס ו-RLHF"
                  descEn="Admin dashboards, agent performance, user feedback loop"
                  descHe="דשבורדים, ביצועי סוכנים, לולאת משוב מהמשתמש"
                  techs={['Recharts', 'GPT-4o-mini', 'RLHF']} />
                <NodeCard type="infra" icon={Cpu} isHe={isHe}
                  titleEn="Data Science Sandbox" titleHe="סביבת מחקר נתונים"
                  descEn="Run Python code for statistical verification in isolated E2B sandbox"
                  descHe="הרצת קוד Python לאימות סטטיסטי בסביבת E2B מבודדת"
                  techs={['E2B Sandbox']} />
                <NodeCard type="infra" icon={Fingerprint} isHe={isHe}
                  titleEn="Billing & Payments" titleHe="חיוב ותשלומים"
                  descEn="Subscription management, usage-based billing"
                  descHe="ניהול מנויים וחיוב לפי שימוש"
                  techs={['Stripe']} />
              </div>
            </PhaseSection>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
