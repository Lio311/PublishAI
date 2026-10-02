"use client";

import React from 'react';
import { useLocale } from 'next-intl';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Code, FileText, Database, Zap, Brain, Search, Edit3, MessageSquare, ShieldCheck, CheckCircle, Download, Globe, Lock, Eye, Settings, Mail, User, Bot, Scissors, ListChecks, RefreshCw, CheckCircle2, Workflow, BarChart2, Shield, Activity, Key, Layers, ArrowRight } from 'lucide-react';

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
  user:    { bg: 'bg-blue-50',    border: 'border-blue-400',    text: 'text-blue-900',    iconBg: 'bg-blue-500',    iconColor: 'text-white' },
  agent:   { bg: 'bg-purple-50',  border: 'border-purple-400',  text: 'text-purple-900',  iconBg: 'bg-purple-500',  iconColor: 'text-white' },
  queue:   { bg: 'bg-orange-50',  border: 'border-orange-400',  text: 'text-orange-900',  iconBg: 'bg-orange-500',  iconColor: 'text-white' },
  rpa:     { bg: 'bg-teal-50',    border: 'border-teal-400',    text: 'text-teal-900',    iconBg: 'bg-teal-500',    iconColor: 'text-white' },
  db:      { bg: 'bg-green-50',   border: 'border-green-400',   text: 'text-green-900',   iconBg: 'bg-green-600',   iconColor: 'text-white' },
  logic:   { bg: 'bg-yellow-50',  border: 'border-yellow-500',  text: 'text-yellow-900',  iconBg: 'bg-yellow-500',  iconColor: 'text-white' },
  success: { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-900', iconBg: 'bg-emerald-500', iconColor: 'text-white' },
  error:   { bg: 'bg-red-50',     border: 'border-red-500',     text: 'text-red-900',     iconBg: 'bg-red-500',     iconColor: 'text-white' },
  infra:   { bg: 'bg-slate-50',   border: 'border-slate-400',   text: 'text-slate-800',   iconBg: 'bg-slate-600',   iconColor: 'text-white' },
  default: { bg: 'bg-gray-50',    border: 'border-gray-400',    text: 'text-gray-900',    iconBg: 'bg-gray-500',    iconColor: 'text-white' },
};

const techColors: Record<string, string> = {
  'Claude Opus 5.5': 'bg-amber-100 text-amber-800 border-amber-300',
  'Claude Sonnet 5.5': 'bg-amber-50 text-amber-700 border-amber-200',
  'GPT-4o': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'GPT-4o-mini': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Gemini Pro': 'bg-blue-100 text-blue-800 border-blue-300',
  'OpenAlex': 'bg-orange-50 text-orange-700 border-orange-200',
  'PubMed': 'bg-blue-50 text-blue-700 border-blue-200',
  'Site PIN': 'bg-yellow-50 text-yellow-800 border-yellow-200',
  'Vercel Blob': 'bg-gray-100 text-gray-700 border-gray-300',
  'xlsx': 'bg-green-100 text-green-800 border-green-300',
  'Vercel AI SDK': 'bg-gray-900 text-white border-gray-700',
  'LangGraph': 'bg-violet-100 text-violet-800 border-violet-300',
  'Inngest': 'bg-pink-100 text-pink-800 border-pink-300',
  'Neon Postgres': 'bg-green-100 text-green-800 border-green-300',
  'pgvector': 'bg-green-50 text-green-700 border-green-200',
  'Drizzle ORM': 'bg-green-50 text-green-700 border-green-200',
  'Upstash Redis': 'bg-red-100 text-red-800 border-red-300',
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
  'RLHF': 'bg-pink-100 text-pink-800 border-pink-300',
  'DOCX': 'bg-blue-50 text-blue-700 border-blue-200',
  'Tiptap': 'bg-violet-50 text-violet-700 border-violet-200',
  'Python': 'bg-blue-100 text-blue-800 border-blue-300',
  'WordPress API': 'bg-sky-100 text-sky-800 border-sky-300',
  'Semantic Scholar': 'bg-blue-100 text-blue-800 border-blue-300',
  'LangChain': 'bg-sky-100 text-sky-800 border-sky-300',
  'OpenAI': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Pandas': 'bg-blue-100 text-blue-800 border-blue-300',
  'Scipy': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'Rate Limiter': 'bg-rose-100 text-rose-800 border-rose-300',
};

// ═══════════════════════════════════════════
// Components
// ═══════════════════════════════════════════

function TechBadge({ name }: { name: string }) {
  const color = techColors[name] || 'bg-gray-100 text-gray-700 border-gray-300';
  return (
    <span className={`inline-block px-1 py-0.5 text-[8.5px] font-semibold rounded border ${color} whitespace-nowrap leading-none`}>
      {name}
    </span>
  );
}

function DataLabel({ label, isHe }: { label: { en: string; he: string }; isHe: boolean }) {
  return (
    <div className="absolute bottom-[calc(50%+10px)] left-1/2 -translate-x-1/2 text-[8.5px] font-mono bg-white/90 text-slate-600 px-1.5 py-0.5 rounded border border-slate-300 whitespace-nowrap shadow-sm z-20">
      {isHe ? label.he : label.en}
    </div>
  );
}

// Solid line horizontal arrow
function FlowArrow({ isHe, reverse = false, label }: { isHe: boolean; reverse?: boolean; label?: { en: string; he: string } }) {
  const pointsLeft = (isHe && !reverse) || (!isHe && reverse);
  
  return (
    <div className="hidden lg:flex flex-1 items-center justify-center min-w-[15px] relative z-0 shrink">
      <div className="w-full h-[3px] bg-slate-400 relative">
        {pointsLeft ? (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 border-r-[10px] border-r-slate-400 border-y-[6px] border-y-transparent -translate-x-[1px]"></div>
        ) : (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 border-l-[10px] border-l-slate-400 border-y-[6px] border-y-transparent translate-x-[1px]"></div>
        )}
      </div>
      {label && <DataLabel label={label} isHe={isHe} />}
    </div>
  );
}

// Solid line vertical arrow
function VerticalFlowArrow({ isHe, label, length = 'h-12' }: { isHe: boolean; label?: { en: string; he: string }, length?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center w-full ${length} relative z-0`}>
      <div className="h-full w-[3px] bg-slate-400 relative">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 border-t-[10px] border-t-slate-400 border-x-[6px] border-x-transparent translate-y-[1px]"></div>
      </div>
      {label && (
        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 ml-3 bg-white px-1.5 py-0.5 border border-slate-300 rounded text-[8.5px] font-mono text-slate-600 shadow-sm z-20 whitespace-nowrap">
          {isHe ? label.he : label.en}
        </div>
      )}
    </div>
  );
}

// U-Turn Arrow for connecting rows in a snake layout (Desktop only)
function SideDropArrow({ isRightSide }: { isRightSide: boolean }) {
  return (
    <div className={`hidden lg:flex absolute top-[100%] h-12 w-[175px] justify-center z-0 ${isRightSide ? 'right-0' : 'left-0'}`}>
      <div className="h-[120%] w-[3px] bg-slate-400 relative">
        <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 border-t-[10px] border-t-slate-400 border-x-[6px] border-x-transparent"></div>
      </div>
    </div>
  );
}

function NodeCard({ titleEn, titleHe, descEn, descHe, icon: Icon, type, isHe, isDiamond, techs }: FlowNodeProps) {
  const s = nodeStyles[type];

  if (isDiamond) {
    return (
      <div className="relative flex flex-col items-center justify-center group shrink-0 z-10 my-2">
        <div className={`w-[100px] h-[100px] ${s.bg} border-[3px] ${s.border} shadow-md rotate-45 flex items-center justify-center transition-transform group-hover:scale-105`}>
          <div className="-rotate-45 flex flex-col items-center text-center p-1 w-[130px]">
            <Icon className={`w-5 h-5 ${s.iconColor.replace('text-white', s.text.replace('text-', 'text-'))} mb-1`} />
            <span className={`text-[10px] font-bold leading-tight ${s.text}`}>{isHe ? titleHe : titleEn}</span>
          </div>
        </div>
        <div className="absolute top-full mt-2 w-48 bg-slate-800 text-white text-[11px] p-2.5 rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none z-50 text-center transition-opacity">
          {isHe ? descHe : descEn}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-[175px] min-w-[130px] shrink flex-1 min-h-[110px] flex flex-col items-center text-center rounded-xl border-[3px] ${s.border} ${s.bg} p-2 shadow-md transition-all hover:shadow-lg hover:-translate-y-1 group relative z-10 bg-opacity-95`}>
      <div className={`w-10 h-10 rounded-lg ${s.iconBg} flex items-center justify-center mb-2 shadow-sm shrink-0`}>
        <Icon className={`w-5 h-5 ${s.iconColor}`} />
      </div>
      <h3 className={`text-[12.5px] font-bold mb-1 leading-snug ${s.text}`}>{isHe ? titleHe : titleEn}</h3>
      <p className={`text-[10.5px] opacity-80 leading-snug ${s.text} mb-2 flex-grow`}>{isHe ? descHe : descEn}</p>
      {techs && techs.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mt-auto pt-1.5 border-t border-black/10 w-full">
          {techs.map(t => <TechBadge key={t} name={t} />)}
        </div>
      )}
    </div>
  );
}


function OrDivider({ isHe, labelEn = 'OR', labelHe = 'או (נתיב חלופי)' }: { isHe: boolean, labelEn?: string, labelHe?: string }) {
  return (
    <div className="w-full flex items-center justify-center my-1.5 z-20 relative">
      <div className="absolute w-full h-[1px] bg-slate-200/50 -z-10"></div>
      <div className="bg-white border-2 border-slate-300 rounded-full px-2.5 py-0.5 shadow-sm text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        {isHe ? labelHe : labelEn}
      </div>
    </div>
  );
}


function SplitFork({ yesLabel, noLabel }: { isHe: boolean, yesLabel: string, noLabel: string }) {
  return (
    <div className="flex flex-col items-center w-full my-0 relative z-0">
      <div className="h-4 w-[3px] bg-slate-400"></div>
      <div className="flex w-full max-w-[320px] relative">
        <div className="absolute top-0 left-[25%] right-[25%] h-[3px] bg-slate-400"></div>
        <div className="flex-1 flex flex-col items-center">
          <div className="h-8 w-[3px] bg-slate-400 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 rounded-full border border-slate-200 z-10 whitespace-nowrap">
              {yesLabel}
            </div>
            <div className="absolute bottom-[0px] left-1/2 -translate-x-1/2 border-t-[8px] border-t-slate-400 border-x-[5px] border-x-transparent translate-y-full"></div>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className="h-8 w-[3px] bg-slate-400 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 rounded-full border border-slate-200 z-10 whitespace-nowrap">
              {noLabel}
            </div>
            <div className="absolute bottom-[0px] left-1/2 -translate-x-1/2 border-t-[8px] border-t-slate-400 border-x-[5px] border-x-transparent translate-y-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MergeFork() {
  return (
    <div className="flex flex-col items-center w-full my-0 relative z-0">
      <div className="flex w-full max-w-[320px] relative">
        <div className="absolute bottom-0 left-[25%] right-[25%] h-[3px] bg-slate-400"></div>
        <div className="flex-1 flex flex-col items-center">
          <div className="h-6 w-[3px] bg-slate-400"></div>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className="h-6 w-[3px] bg-slate-400"></div>
        </div>
      </div>
      <div className="h-6 w-[3px] bg-slate-400 relative">
        <div className="absolute bottom-[0px] left-1/2 -translate-x-1/2 border-t-[8px] border-t-slate-400 border-x-[5px] border-x-transparent translate-y-full"></div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════

export default function FlowchartClient({ isAdmin }: { isAdmin: boolean }) {
  const locale = useLocale() as 'en' | 'he';
  const isHe = locale === 'he';

  return (
    <DashboardLayout isAdmin={isAdmin} showSidebar={true}>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 overflow-x-hidden" dir={isHe ? 'rtl' : 'ltr'}>

        {/* ══ HEADER ══ */}
        <div className="w-full bg-white border-b border-gray-200 shadow-sm mb-6">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                    <Workflow className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
                      {isHe ? 'תרשים זרימת מערכת מלא' : 'Full System Flowchart'}
                    </h1>
                    <p className="text-sm text-gray-500 font-medium">
                      {isHe ? 'מטיוטה לפרסום — מחובר חזותית מקצה לקצה' : 'From draft to publication — Visually connected end-to-end'}
                    </p>
                  </div>
                </div>
                
              </div>

              {/* Legend */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-x-5 gap-y-2 text-[11.5px] shadow-sm font-semibold">
                <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-inner" />{isHe ? 'משתמש / ממשק' : 'User / UI'}</div>
                <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-purple-500 shadow-inner" />{isHe ? 'סוכן AI' : 'AI Agent'}</div>
                <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-orange-500 shadow-inner" />{isHe ? 'תור / אירוע' : 'Queue / Event'}</div>
                <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-sm bg-teal-500 rotate-45 shadow-inner" />{isHe ? 'RPA / אוטומציה' : 'RPA / Automation'}</div>
                <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-sm bg-green-600 shadow-inner" />{isHe ? 'מסד נתונים' : 'Database'}</div>
                <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-sm bg-yellow-500 rotate-45 shadow-inner" />{isHe ? 'לוגיקה / תנאי' : 'Logic / Condition'}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1500px] mx-auto px-4 md:px-8 flex flex-col items-center">

          
          {/* ══════════════════════════════════
               PHASE 0
             ══════════════════════════════════ */}
          <div className="w-full rounded-2xl overflow-visible shadow-lg border border-indigo-200 bg-indigo-50/40 mb-2 relative">
            <div className="w-full p-4 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-t-xl">
              <h2 className="text-xl font-bold">{isHe ? 'שלב 0: ידע ארגוני, ארגז חול וניתוח חזותי' : 'Phase 0: GraphRAG, Sandbox & Vision'}</h2>
            </div>
            <div className="p-6 md:p-10 flex flex-col items-center w-full relative">
              <div className="flex flex-col lg:flex-row justify-between items-center w-full">
                <NodeCard type="user" icon={Database} isHe={isHe} titleEn="Data Upload" titleHe="העלאת נתונים" descEn="Upload raw datasets & Figures" descHe="העלאת קובצי נתונים ואיורים" techs={['Next.js 16', 'xlsx', 'Vercel Blob']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="queue" icon={Layers} isHe={isHe} titleEn="Vector & Graph Ingestion" titleHe="הטמעת ידע ורשת" descEn="Chunk to vectors & extract GraphRAG entities" descHe="קידוד וקטורי וחילוץ ישויות רשת ידע" techs={['Inngest', 'LangChain', 'Vercel AI SDK']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={BarChart2} isHe={isHe} titleEn="Data & Vision Validation" titleHe="אימות נתונים וראייה" descEn="Validate graphs vs Excel using Python" descHe="אימות סטטיסטי בין גרפים לאקסל" techs={['E2B Sandbox', 'Pandas', 'Scipy']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="user" icon={Search} isHe={isHe} titleEn="GraphRAG Analytics" titleHe="ניתוח Knowledge Graph" descEn="Network graph & entity analytics" descHe="תצוגת רשת וניתוח ישויות מתקדם" techs={['GraphRAG', 'Neon Postgres']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="success" icon={CheckCircle2} isHe={isHe} titleEn="Ready for Draft" titleHe="מוכן לטיוטה" descEn="Assets ready for paper generation" descHe="התוצרים מוכנים ליצירת המאמר" techs={['Neon Postgres']} />
              </div>
            </div>
          </div>
          
          <VerticalFlowArrow isHe={isHe} length="h-16" label={{ en: "Proceed to Drafting", he: "מעבר לכתיבת טיוטה" }} />

          {/* ══════════════════════════════════
               PHASE 1
             ══════════════════════════════════ */}
          <div className="w-full rounded-2xl overflow-visible shadow-lg border border-blue-200 bg-blue-50/40 mb-2 relative">
            <div className="w-full p-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-xl">
              <h2 className="text-xl font-bold">{isHe ? 'שלב 1: קליטת המסמך והנתונים' : 'Phase 1: User Initiation & Data Ingestion'}</h2>
            </div>
            <div className="py-6 px-2 md:py-10 md:px-2 lg:px-2 xl:px-4 flex flex-col items-center w-full relative">
              <div className="flex flex-col lg:flex-row justify-between items-center w-full">
                <NodeCard type="user" icon={User} isHe={isHe} titleEn="User UI" titleHe="ממשק משתמש" descEn="Upload Draft Manuscript & Target Journal" descHe="העלאת טיוטת מאמר וכתב עת יעד" techs={['Next.js 16', 'Tailwind CSS', 'Vercel Blob']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} label={{ en: 'File', he: 'קובץ' }} />
                <NodeCard type="infra" icon={Code} isHe={isHe} titleEn="Parse & Extract" titleHe="ניתוח וחילוץ" descEn="Extract text from PDF / Word" descHe="חילוץ טקסט מקובצי PDF ו-Word" techs={['PDF Parser', 'Mammoth']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} label={{ en: 'Raw text', he: 'טקסט' }} />
                <NodeCard type="infra" icon={FileText} isHe={isHe} titleEn="Metadata" titleHe="מטא-דאטה" descEn="Extract Authors, Keywords, Abstract" descHe="חילוץ מחברים, מילות מפתח, תקציר" techs={['Claude Sonnet 5.5', 'Zod']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} label={{ en: 'Enrich', he: 'העשרה' }} />
                <NodeCard type="agent" icon={Database} isHe={isHe} titleEn="JCR & Predict" titleHe="ניבוי וחיזוי" descEn="Fetch JCR metrics & Predict Acceptance %" descHe="הבאת מדדי כתב עת וניבוי אחוזי קבלה" techs={['OpenAlex', 'GPT-4o']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} label={{ en: 'JSON', he: 'JSON' }} />
                <NodeCard type="db" icon={Database} isHe={isHe} titleEn="Database" titleHe="מסד נתונים" descEn="Save initial record. Return ID." descHe="שמירת רשומה. החזרת מזהה." techs={['Drizzle ORM', 'Neon Postgres']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="queue" icon={Zap} isHe={isHe} titleEn="Queue" titleHe="תור משימות" descEn="Fire event: 'paper/uploaded'" descHe="הפעלת אירוע 'מאמר הועלה'" techs={['Inngest']} />
              </div>
            </div>
          </div>
          
          <VerticalFlowArrow isHe={isHe} length="h-16" label={{ en: "Choose a target journal", he: "בחירת כתב עת יעד" }} />

          {/* ══════════════════════════════════
               PHASE 1B: JOURNAL MATCH
             ══════════════════════════════════ */}
          <div className="w-full rounded-2xl overflow-visible shadow-lg border border-orange-200 bg-orange-50/40 mb-2 relative">
            <div className="w-full p-4 bg-gradient-to-r from-orange-500 to-orange-700 text-white rounded-t-xl">
              <h2 className="text-xl font-bold">{isHe ? 'שלב 1B: התאמת כתב עת (לשונית Journal Match)' : 'Phase 1B: Journal Match'}</h2>
            </div>
            <div className="p-6 md:p-10 flex flex-col items-center w-full relative">
              <div className="flex flex-col lg:flex-row justify-between items-center w-full">
                <NodeCard type="agent" icon={FileText} isHe={isHe} titleEn="Profiler" titleHe="פרופיל מאמר" descEn="Field, methods, contribution & audience" descHe="תחום, שיטות, תרומה וקהל יעד" techs={['Claude Opus 5.5']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="infra" icon={Globe} isHe={isHe} titleEn="Candidate Venues" titleHe="כתבי עת מועמדים" descEn="Real venues from OpenAlex + editor agent" descHe="כתבי עת אמיתיים מ-OpenAlex ומסוכן עורך" techs={['OpenAlex']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={ListChecks} isHe={isHe} titleEn="Parallel Evaluators" titleHe="סוכני הערכה מקבילים" descEn="Scope fit, quality & acceptance odds per venue" descHe="התאמת תחום, איכות וסיכויי קבלה לכל כתב עת" techs={['Claude Opus 5.5']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Layers} isHe={isHe} titleEn="Chief Editor" titleHe="עורך ראשי" descEn="Ranks the final top 3 with reasons" descHe="מדרג את 3 ההמלצות הסופיות עם נימוק" techs={['Claude Opus 5.5']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="success" icon={CheckCircle2} isHe={isHe} titleEn="Top 3 Journals" titleHe="3 כתבי עת מומלצים" descEn="Ranked recommendations with rationale" descHe="המלצות מדורגות עם נימוק" techs={['Next.js 16']} />
              </div>
            </div>
          </div>

          <VerticalFlowArrow isHe={isHe} length="h-16" label={{ en: "Event triggered", he: "אירוע הופעל" }} />

          {/* ══════════════════════════════════
               PHASE 2
             ══════════════════════════════════ */}
          <div className="w-full rounded-2xl overflow-visible shadow-lg border border-green-200 bg-green-50/40 mb-2">
            <div className="w-full p-4 bg-gradient-to-r from-green-600 to-green-800 text-white rounded-t-xl">
              <h2 className="text-xl font-bold">{isHe ? 'שלב 2: צינור הסוכנים (AgentOrchestrator)' : 'Phase 2: The AI Agents Pipeline'}</h2>
            </div>
            
            <div className="p-6 md:p-10 flex flex-col items-center w-full relative">
              {/* Row 1 */}
              <div className="flex flex-col lg:flex-row justify-between items-center w-full relative z-10">
                <NodeCard type="agent" icon={Bot} isHe={isHe} titleEn="Orchestrator" titleHe="מנצח הסוכנים" descEn="Runs each agent as a durable, retryable step" descHe="מריץ כל סוכן כשלב עמיד עם ניסיונות חוזרים" techs={['Inngest', 'Langfuse']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="logic" icon={Shield} isHe={isHe} titleEn="Integrity Scan" titleHe="סורק תקינות" descEn="LLM estimate of plagiarism & AI-generated text in the original" descHe="הערכת פלגיאט וטקסט שנוצר ב-AI במקור, באמצעות מודל שפה" techs={['GPT-4o']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Search} isHe={isHe} titleEn="Clarification" titleHe="סוכן הבהרה" descEn="Extracts editorial goals & constraints" descHe="מחלץ יעדי עריכה ואילוצי כתב עת" techs={['Claude Sonnet 5.5']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={FileText} isHe={isHe} titleEn="Planning" titleHe="סוכן תכנון" descEn="Builds the revision plan" descHe="בונה את תוכנית השכתוב" techs={['Claude Opus 5.5']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Search} isHe={isHe} titleEn="Knowledge" titleHe="סוכן ידע" descEn="Searches PubMed & Semantic Scholar" descHe="חיפוש ספרות ב-PubMed וב-Semantic Scholar" techs={['Claude Sonnet 5.5', 'PubMed', 'Semantic Scholar']} />

                <SideDropArrow isRightSide={!isHe} />
                <VerticalFlowArrow isHe={isHe} length="h-16 lg:hidden" />
              </div>

              {/* Row 2 - RTL mapped logically via flex-row-reverse on desktop */}
              <div className={`mt-0 lg:mt-12 flex flex-col items-center w-full relative justify-between z-10 lg:flex-row-reverse`}>
                <NodeCard type="agent" icon={MessageSquare} isHe={isHe} titleEn="Scientific Review" titleHe="ביקורת מדעית" descEn="Rigorous reviewer-style critique" descHe="ביקורת קפדנית בסגנון סוקר" techs={['Claude Opus 5.5']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} reverse={true} />
                <NodeCard type="agent" icon={Edit3} isHe={isHe} titleEn="Writer" titleHe="סוכן כתיבה" descEn="Rewrites prose to journal standards" descHe="שכתוב לרמה של כתבי עת מובילים" techs={['Claude Opus 5.5']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} reverse={true} />
                <NodeCard type="agent" icon={Code} isHe={isHe} titleEn="Execution" titleHe="סוכן ביצוע" descEn="Applies the edits & summarizes changes" descHe="מיישם את התיקונים ומסכם את השינויים" techs={['Claude Opus 5.5']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} reverse={true} />
                <NodeCard type="agent" icon={CheckCircle} isHe={isHe} titleEn="QA" titleHe="סוכן QA" descEn="Final consistency, formatting, grammar check" descHe="בדיקת עקביות סופית, עיצוב ודקדוק" techs={['Claude Sonnet 5.5']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} reverse={true} />
                <NodeCard type="agent" icon={ListChecks} isHe={isHe} titleEn="Verification" titleHe="סוכן אימות" descEn="Verify journal guidelines compliance" descHe="אימות עמידה מלאה בהנחיות כתב העת" techs={['Claude Sonnet 5.5']} />

                <SideDropArrow isRightSide={isHe} />
                <VerticalFlowArrow isHe={isHe} length="h-16 lg:hidden" />
              </div>

              {/* Row 3 - LTR */}
              <div className="mt-0 lg:mt-12 flex flex-col lg:flex-row justify-between items-center w-full relative z-10">
                <NodeCard type="agent" icon={FileText} isHe={isHe} titleEn="Cover Letter" titleHe="מכתב מקדים" descEn="Generate persuasive letter to Editor-in-Chief" descHe="יצירת מכתב מקדים משכנע לעורך" techs={['Claude Sonnet 5.5']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Download} isHe={isHe} titleEn="Compilation" titleHe="הידור" descEn="Assemble the final manuscript" descHe="הרכבת כתב היד הסופי" techs={['Claude Sonnet 5.5', 'DOCX']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="infra" icon={FileText} isHe={isHe} titleEn="Export DOCX" titleHe="ייצוא קבצים" descEn="Generate a formatted Word document" descHe="יצירת מסמך Word מעוצב" techs={['DOCX']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="queue" icon={Zap} isHe={isHe} titleEn="Start Debate" titleHe="הפעלת דיבייט" descEn="Event: 'submission/review-started'" descHe="אירוע: תחילת דיון הסוקרים" techs={['Inngest']} />
              </div>
            </div>
          </div>

          <VerticalFlowArrow isHe={isHe} length="h-16" label={{ en: "Runs in the background", he: "רץ ברקע" }} />

          {/* ══════════════════════════════════
               PHASE 2B: REVIEW DEBATE
             ══════════════════════════════════ */}
          <div className="w-full rounded-2xl overflow-visible shadow-lg border border-violet-200 bg-violet-50/40 mb-2">
            <div className="w-full p-4 bg-gradient-to-r from-violet-600 to-violet-800 text-white rounded-t-xl">
              <h2 className="text-xl font-bold">{isHe ? 'שלב 2B: דיון סוקרים רב-מודלי' : 'Phase 2B: Multi-Model Review Debate'}</h2>
            </div>
            <div className="p-6 md:p-10 flex flex-col items-center w-full relative">
              <div className="flex flex-col lg:flex-row justify-between items-center w-full">
                <NodeCard type="agent" icon={MessageSquare} isHe={isHe} titleEn="Critical Reviewer" titleHe="סוקר ביקורתי" descEn="Round 1: independent review" descHe="סבב 1: ביקורת עצמאית" techs={['GPT-4o']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Brain} isHe={isHe} titleEn="Novelty Expert" titleHe="מומחה חדשנות" descEn="Round 1: independent review" descHe="סבב 1: ביקורת עצמאית" techs={['Claude Sonnet 5.5']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Search} isHe={isHe} titleEn="Optimistic Reviewer" titleHe="סוקר אופטימי" descEn="Round 1: independent review" descHe="סבב 1: ביקורת עצמאית" techs={['Gemini Pro']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} label={{ en: 'Reviews', he: 'ביקורות' }} />
                <NodeCard type="agent" icon={RefreshCw} isHe={isHe} titleEn="Cross-Review" titleHe="תגובה הדדית" descEn="Round 2: each reviewer answers the others" descHe="סבב 2: כל סוקר מגיב לעמדות האחרים" techs={['Vercel AI SDK']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="success" icon={Layers} isHe={isHe} titleEn="Area Chair" titleHe="יו״ר הוועדה" descEn="Consolidated decision & revision plan" descHe="החלטה מאוחדת ותוכנית תיקונים" techs={['Claude Opus 5.5', 'Neon Postgres']} />
              </div>
            </div>
          </div>

          <VerticalFlowArrow isHe={isHe} length="h-16" label={{ en: "Update DB → Awaiting user approval", he: "עדכון מסד ← המתנה לאישור משתמש" }} />

          {/* ══════════════════════════════════
               PHASE 3
             ══════════════════════════════════ */}
          <div className="w-full rounded-2xl overflow-visible shadow-lg border border-rose-200 bg-rose-50/40 mb-2 relative">
            <div className="w-full p-4 bg-gradient-to-r from-rose-500 to-rose-700 text-white rounded-t-xl">
              <h2 className="text-xl font-bold">{isHe ? 'שלב 3: אישור, הרשאות ושער הגשה' : 'Phase 3: Approval, Permissions & Submission Gateway'}</h2>
            </div>
            <div className="p-6 md:p-10 flex flex-col items-center w-full relative z-10">
              
              <NodeCard type="user" icon={User} isHe={isHe} titleEn="Approve" titleHe="אישור והגשה" descEn="User reviews final paper and clicks 'Approve & Submit'" descHe="המשתמש סוקר את המאמר ולוחץ 'אשר והגש'" techs={['Next.js 16', 'Tiptap', 'NextAuth.js']} />
              
              <VerticalFlowArrow isHe={isHe} length="h-8" />
              
              <NodeCard type="logic" icon={ShieldCheck} isHe={isHe} titleEn="Security Gateway" titleHe="שער אבטחה" descEn="Site PIN, session, ownership & CSRF checks" descHe="קוד PIN, סשן, בדיקת בעלות ואימות CSRF" techs={['Site PIN', 'NextAuth.js']} />
              
              <VerticalFlowArrow isHe={isHe} length="h-8" />
              
              <NodeCard type="logic" icon={Key} isDiamond isHe={isHe} titleEn="Auth Given?" titleHe="הרשאות הוענקו?" descEn="Has user linked API / Email creds?" descHe="האם המשתמש העניק הרשאות API/Email?" />
              
              <SplitFork isHe={isHe} yesLabel={isHe ? 'כן (פענוח)' : 'Yes (Decrypt)'} noLabel={isHe ? 'לא (דילוג)' : 'No (Skip)'} />
              
              <div className="flex w-full max-w-[380px] justify-between gap-4 relative z-10">
                <div className="flex-1 flex justify-center">
                  <NodeCard type="rpa" icon={Lock} isHe={isHe} titleEn="AES Decrypt" titleHe="פענוח הרשאות" descEn="Decrypt API tokens / Email passwords safely" descHe="פענוח מאובטח של סיסמאות וטוקנים" techs={['AES-256-GCM', 'Neon Postgres']} />
                </div>
                <div className="flex-1 flex justify-center">
                  <NodeCard type="queue" icon={ArrowRight} isHe={isHe} titleEn="Skip Decrypt" titleHe="דילוג על פענוח" descEn="Proceed directly to fallback route" descHe="המשך לנתיב חלופי ללא הרשאות מיוחדות" techs={['NextAuth.js']} />
                </div>
              </div>

              <MergeFork />
              
              <NodeCard type="logic" icon={Settings} isDiamond isHe={isHe} titleEn="Route Platform" titleHe="ניתוב פלטפורמה" descEn="Route by: WordPress / Editorial Mgr / Email" descHe="ניתוב פנימי לממשק המתאים" />
            
            </div>
          </div>
          <VerticalFlowArrow isHe={isHe} length="h-16" label={{ en: "Split to 4 Lanes", he: "פיצול ל-4 נתיבים" }} />

          {/* ══════════════════════════════════
               PHASES 4A & 4B
             ══════════════════════════════════ */}
          <div className="w-full flex flex-col lg:flex-row gap-6 relative z-10">
            
            {/* 4A: Fast Lanes */}
            <div className="flex-[4] rounded-2xl overflow-visible shadow-lg border border-teal-200 bg-teal-50/40">
              <div className="w-full p-4 bg-gradient-to-r from-teal-500 to-teal-700 text-white rounded-t-xl">
                <h2 className="text-xl font-bold">{isHe ? 'שלב 4A: נתיבי הגשה מהירים' : 'Phase 4A: API & Email (Fast Lanes)'}</h2>
                <p className="text-sm opacity-90">{isHe ? 'מצריך הרשאות מלאות מראש' : 'Requires explicit prior authorization'}</p>
              </div>
              <div className="p-6 md:p-8 flex flex-col items-center justify-between h-[85%]">
                <div className="flex flex-col lg:flex-row items-center justify-between w-full mb-2">
                  <NodeCard type="rpa" icon={Globe} isHe={isHe} titleEn="WordPress/OJS API" titleHe="WordPress / OJS" descEn="Execute direct POST to REST APIs" descHe="ביצוע קריאות REST API ישירות" techs={['Next.js 16', 'NextAuth.js', 'Rate Limiter']} />
                  <VerticalFlowArrow isHe={isHe} length="h-8 lg:hidden" />
                  <FlowArrow isHe={isHe} />
                  <NodeCard type="success" icon={CheckCircle2} isHe={isHe} titleEn="Success ✓" titleHe="הצלחה ✓" descEn="Submission complete" descHe="ההגשה הושלמה" techs={['Neon Postgres']} />
                </div>
                
                <OrDivider isHe={isHe} />
                
                <div className="flex flex-col lg:flex-row items-center justify-between w-full mb-2 mt-2">
                  <NodeCard type="rpa" icon={Globe} isHe={isHe} titleEn="EditorialManager API" titleHe="EditorialManager API" descEn="API stub; most instances fall back to the RPA bot" descHe="ממשק API חלקי; ברוב המקרים עובר לבוט ה-RPA" techs={['Next.js 16', 'NextAuth.js', 'Rate Limiter']} />
                  <VerticalFlowArrow isHe={isHe} length="h-8 lg:hidden" />
                  <FlowArrow isHe={isHe} />
                  <NodeCard type="success" icon={CheckCircle2} isHe={isHe} titleEn="Success ✓" titleHe="הצלחה ✓" descEn="Submission complete" descHe="ההגשה הושלמה" techs={['Neon Postgres']} />
                </div>
                
                <OrDivider isHe={isHe} />
                
                <div className="flex flex-col lg:flex-row items-center justify-between w-full mt-2">
                  <NodeCard type="rpa" icon={Mail} isHe={isHe} titleEn="EmailAdapter" titleHe="מתאם אימייל" descEn="Multipart MIME → SMTP → Editor" descHe="שליחת מייל עם חבילת הגשה ישירות לעורך" techs={['Nodemailer', 'Rate Limiter']} />
                  <VerticalFlowArrow isHe={isHe} length="h-8 lg:hidden" />
                  <FlowArrow isHe={isHe} />
                  <NodeCard type="success" icon={CheckCircle2} isHe={isHe} titleEn="Success ✓" titleHe="הצלחה ✓" descEn="Submission complete" descHe="ההגשה הושלמה" techs={['Neon Postgres']} />
                </div>
              </div>
            </div>

            {/* 4B: Complex Lane */}
            <div className="flex-[5] rounded-2xl overflow-visible shadow-lg border border-purple-300 bg-purple-50/40 mt-6 lg:mt-0">
              <div className="w-full p-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-t-xl relative">
                <h2 className="text-xl font-bold">{isHe ? 'שלב 4B: נתיב RPA אוטונומי' : 'Phase 4B: Autonomous RPA Bot'}</h2>
                <p className="text-sm opacity-90">{isHe ? 'מופעל כגיבוי או כשאין API זמין. דורש סביבת דפדפן, ולכן אינו זמין בפריסה ב-Vercel' : 'Fallback when no API is available. Needs a browser runtime, so it is unavailable on the Vercel deployment'}</p>

              </div>
              <div className="p-6 md:p-8 flex flex-col items-center">
                <NodeCard type="rpa" icon={Bot} isHe={isHe} titleEn="GenericNavigator" titleHe="נווט גנרי" descEn="Launch headless Chromium & load portal" descHe="הפעלת דפדפן ללא ראש וטעינת הפורטל" techs={['Playwright']} />
                
                <VerticalFlowArrow isHe={isHe} length="h-8" />
                <NodeCard type="logic" icon={Search} isDiamond isHe={isHe} titleEn="DOM Found?" titleHe="אלמנטים נמצאו?" descEn="Are CSS selectors visible?" descHe="האם סלקטורים קיימים?" />
                
                <SplitFork isHe={isHe} yesLabel={isHe ? 'כן' : 'Yes'} noLabel={isHe ? 'לא (ראייה)' : 'No (Vision)'} />
                
                <div className="flex w-full max-w-[380px] justify-between gap-4 relative z-10">
                  <div className="flex-1 flex justify-center">
                    <NodeCard type="rpa" icon={Edit3} isHe={isHe} titleEn="Fill & Upload" titleHe="מילוי והעלאה" descEn="fillForm() & uploadFiles()" descHe="מילוי טפסים והעלאת קבצי מאמר" techs={['Playwright']} />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <NodeCard type="rpa" icon={Eye} isHe={isHe} titleEn="Vision AI" titleHe="ראייה ממוחשבת" descEn="Claude → JSON {X,Y} → Click" descHe="גיבוי - קואורדינטות ראייה ולחיצה" techs={['Vision AI']} />
                  </div>
                </div>

                <MergeFork />

                <NodeCard type="logic" icon={Lock} isDiamond isHe={isHe} titleEn="CAPTCHA / 2FA?" titleHe="אימות דו-שלבי?" descEn="Is human intervention needed?" descHe="האם נדרשת התערבות אנושית?" />
                
                <SplitFork isHe={isHe} yesLabel={isHe ? 'כן' : 'Yes'} noLabel={isHe ? 'לא' : 'No'} />
                
                <div className="flex w-full max-w-[380px] justify-between gap-4 relative z-10">
                  <div className="flex-1 flex justify-center">
                    <NodeCard type="queue" icon={User} isHe={isHe} titleEn="User Solves" titleHe="פתרון על ידי המשתמש" descEn="Job pauses; user enters the code in the app" descHe="התהליך נעצר; המשתמש מזין את הקוד באפליקציה" techs={['Inngest']} />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <NodeCard type="rpa" icon={CheckCircle2} isHe={isHe} titleEn="Final Submit" titleHe="הגשה סופית" descEn="Click Submit → Scrape Tracking ID" descHe="לחיצה על שליחה ← חילוץ מזהה מעקב" techs={['Playwright']} />
                  </div>
                </div>

                <MergeFork />
                
                <NodeCard type="db" icon={Database} isHe={isHe} titleEn="Update DB" titleHe="עדכון מסד" descEn="Set status: 'submitted'. Save tracking ID." descHe="עדכון סטטוס 'הוגש' ושמירת מזהה." techs={['Neon Postgres', 'Drizzle ORM']} />
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════
               PHASE 5
             ══════════════════════════════════ */}
          <VerticalFlowArrow isHe={isHe} length="h-16" label={{ en: "Reviewers feedback received", he: "התקבלה ביקורת עמיתים" }} />

          <div className="w-full rounded-2xl overflow-visible shadow-lg border border-amber-200 bg-amber-50/40 mb-2">
            <div className="w-full p-4 bg-gradient-to-r from-amber-500 to-amber-700 text-white rounded-t-xl">
              <h2 className="text-xl font-bold">{isHe ? 'שלב 5: פינג-פונג ביקורת עמיתים (Resubmission)' : 'Phase 5: Peer Review Ping-Pong (Resubmission)'}</h2>
            </div>
            <div className="p-6 md:p-10 flex flex-col items-center w-full relative z-10">
              <div className="flex flex-col lg:flex-row justify-between items-center w-full relative">
                <NodeCard type="user" icon={User} isHe={isHe} titleEn="Rebuttal UI" titleHe="ממשק משתמש" descEn="User pastes Reviewer Comments" descHe="המשתמש מדביק את הערות הסוקרים" techs={['Next.js 16', 'RebuttalPanel']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Brain} isHe={isHe} titleEn="Rebuttal Agent" titleHe="סוכן מענה" descEn="Read critique → Generate strategy & letter" descHe="ניתוח הביקורת ← יצירת אסטרטגיה ומכתב" techs={['GPT-4o', 'Claude Sonnet 5.5']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="user" icon={User} isHe={isHe} titleEn="User Approve" titleHe="אישור משתמש" descEn="Approve Rebuttal Strategy in UI" descHe="אישור אסטרטגיית המענה בממשק" techs={['Next.js 16', 'NextAuth.js']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={RefreshCw} isHe={isHe} titleEn="Re-run Pipeline" titleHe="הרצה חוזרת" descEn="Apply requested edits via Agent Pipeline" descHe="החלת השינויים דרך צינור הסוכנים" techs={['Inngest']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="infra" icon={CheckCircle2} isHe={isHe} titleEn="Submit Response" titleHe="הגשת מענה" descEn="Back to Submission Gateway (Phase 3)" descHe="חזרה לשער ההגשה (שלב 3)" />
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════
               PHASE 6
             ══════════════════════════════════ */}
          <VerticalFlowArrow isHe={isHe} length="h-16" label={{ en: "If rejected", he: "במקרה של דחייה" }} />

          <div className="w-full rounded-2xl overflow-visible shadow-lg border border-emerald-200 bg-emerald-50/40 mb-2">
            <div className="w-full p-4 bg-gradient-to-r from-emerald-600 to-emerald-800 text-white rounded-t-xl">
              <h2 className="text-xl font-bold">{isHe ? 'שלב 6: מפל כתבי עת (טיפול בדחייה)' : 'Phase 6: Journal Cascade'}</h2>
            </div>
            <div className="p-6 md:p-10 flex flex-col items-center w-full relative z-10">
              <div className="flex flex-col lg:flex-row justify-between items-center w-full relative">
                <NodeCard type="queue" icon={Zap} isHe={isHe} titleEn="Queue" titleHe="תור" descEn="Event: 'paperRejected'" descHe="אירוע: 'מאמר נדחה'" techs={['Inngest']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Layers} isHe={isHe} titleEn="Cascade Agent" titleHe="סוכן מפל" descEn="Re-run journal matching, excluding journals already tried" descHe="הרצה חוזרת של התאמת כתבי העת, ללא כתבי עת שכבר נוסו" techs={['OpenAlex', 'Claude Opus 5.5']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Scissors} isHe={isHe} titleEn="Reformat" titleHe="עיצוב מחדש" descEn="Auto-reformat to fit new journal guidelines" descHe="עיצוב מחדש אוטומטי להנחיות החדשות" techs={['Claude Sonnet 5.5']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="infra" icon={RefreshCw} isHe={isHe} titleEn="Fresh Submit" titleHe="הגשה חדשה" descEn="Back to Phase 3 for new journal" descHe="חזרה לשלב 3 עבור כתב העת החדש" />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="success" icon={CheckCircle2} isHe={isHe} titleEn="Published!" titleHe="פורסם!" descEn="Success! Target Journal Published" descHe="הצלחה! פורסם בכתב העת" techs={['Neon Postgres']} />
              </div>
            </div>
          </div>
          

          {/* ══════════════════════════════════
               PHASE 7
             ══════════════════════════════════ */}
          <VerticalFlowArrow isHe={isHe} length="h-16" label={{ en: "Post-Publication", he: "לאחר הפרסום" }} />

          <div className="w-full rounded-2xl overflow-visible shadow-lg border border-pink-200 bg-pink-50/40 mb-2">
            <div className="w-full p-4 bg-gradient-to-r from-pink-500 to-pink-700 text-white rounded-t-xl">
              <h2 className="text-xl font-bold">{isHe ? 'שלב 7: הפצה ולמידת חיזוק (RLHF & CMS)' : 'Phase 7: Dissemination & RLHF Analytics'}</h2>
            </div>
            <div className="p-6 md:p-10 flex flex-col items-center w-full relative z-10">
              <div className="flex flex-col lg:flex-row justify-between items-center w-full relative">
                <NodeCard type="infra" icon={Globe} isHe={isHe} titleEn="CMS Publish" titleHe="פרסום באתר" descEn="Optional post to a WordPress site via its connector" descHe="פרסום אופציונלי באתר WordPress דרך המחבר שלו" techs={['WordPress API', 'MCP']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Activity} isHe={isHe} titleEn="Performance Tracking" titleHe="מעקב ביצועים" descEn="Track citations and journal metrics" descHe="מעקב אחר ציטוטים ומדדי כתב עת" techs={['Semantic Scholar', 'Inngest']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="user" icon={User} isHe={isHe} titleEn="Human Feedback" titleHe="משוב אנושי" descEn="Rate agent decisions via RLHF Dashboard" descHe="דירוג החלטות הסוכנים בממשק RLHF" techs={['RLHF']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="db" icon={Brain} isHe={isHe} titleEn="Telemetry & Learning" titleHe="טלמטריה ולמידה" descEn="Process outcomes & export RLHF dataset" descHe="למידה מתוצאות וייצוא נתוני RLHF למודל" techs={['Inngest', 'Langfuse', 'RLHF', 'Neon Postgres']} />
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════
               SCHEDULED TASKS (CRON)
             ══════════════════════════════════ */}
          <VerticalFlowArrow isHe={isHe} length="h-16" label={{ en: "Scheduled Background Jobs", he: "עבודות רקע מתוזמנות" }} />

          <div className="w-full rounded-2xl overflow-visible shadow-lg border border-slate-300 bg-slate-50/40 mb-2">
            <div className="w-full p-4 bg-gradient-to-r from-slate-600 to-slate-800 text-white rounded-t-xl">
              <h2 className="text-xl font-bold">{isHe ? 'משימות רקע תקופתיות (Cron)' : 'Scheduled Background Tasks (Cron)'}</h2>
            </div>
            <div className="p-6 md:p-10 flex flex-col items-center w-full relative z-10">
              <div className="flex flex-col lg:flex-row justify-center items-center w-full relative gap-8 lg:gap-16">
                <NodeCard type="queue" icon={Zap} isHe={isHe} titleEn="Citation Sync" titleHe="סנכרון ציטוטים" descEn="cron: '0 0 * * *' (Midnight) — Isolated Error Boundaries & Retries" descHe="עדכון מ-Semantic Scholar (חצות) — גבולות שגיאה מבודדים וניסיונות חוזרים (Isolated Error Boundaries & Retries)" techs={['Inngest', 'Semantic Scholar']} />
                
                <NodeCard type="queue" icon={Zap} isHe={isHe} titleEn="RLHF Dataset" titleHe="איסוף נתוני RLHF" descEn="cron: '0 0 * * 0' (Sundays) — Isolated Error Boundaries & Retries" descHe="איסוף נתוני אימון (ראשון) — גבולות שגיאה מבודדים וניסיונות חוזרים (Isolated Error Boundaries & Retries)" techs={['Inngest', 'Neon Postgres']} />
                
                <NodeCard type="queue" icon={Zap} isHe={isHe} titleEn="Digest Email" titleHe="סיכום שבועי" descEn="cron: '0 9 * * 1' (Mondays) — Isolated Error Boundaries & Retries" descHe="שליחת עדכונים שבועית (שני) — גבולות שגיאה מבודדים וניסיונות חוזרים (Isolated Error Boundaries & Retries)" techs={['Inngest', 'Nodemailer']} />
              </div>
            </div>
          </div>

          <div className="mt-10 h-10 w-full" />
        </div>
      </div>
    </DashboardLayout>
  );
}
