"use client";

import React from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/app/i18n/routing';
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Code, FileText, Database, Zap, Brain, Search, Edit3, MessageSquare,
  ShieldCheck, CheckCircle, Download, Globe, Lock, Eye, Settings, Mail, User,
  Bot, Scissors, ListChecks, RefreshCw, AlertTriangle, CheckCircle2, Box, HelpCircle, Workflow, BarChart2,
  Shield, Cpu, Fingerprint, Activity, Key, Layers
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
  'Claude 3.7': 'bg-amber-100 text-amber-800 border-amber-300',
  'Claude 3.5 Haiku': 'bg-amber-50 text-amber-700 border-amber-200',
  'GPT-4o': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'GPT-4o-mini': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'OpenAI o1': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Gemini 1.5': 'bg-blue-100 text-blue-800 border-blue-300',
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
  'WebSockets': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'RLHF': 'bg-pink-100 text-pink-800 border-pink-300',
  'Jest': 'bg-red-50 text-red-700 border-red-200',
  'DOCX': 'bg-blue-50 text-blue-700 border-blue-200',
  'Tiptap': 'bg-violet-50 text-violet-700 border-violet-200',
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
    <div className="absolute top-0 -translate-y-[60%] left-1/2 -translate-x-1/2 text-[9.5px] font-mono bg-white text-slate-600 px-1.5 py-0.5 rounded border border-slate-300 whitespace-nowrap shadow-sm z-20">
      {isHe ? label.he : label.en}
    </div>
  );
}

// Solid line horizontal arrow
function FlowArrow({ isHe, reverse = false, label }: { isHe: boolean; reverse?: boolean; label?: { en: string; he: string } }) {
  const pointsLeft = (isHe && !reverse) || (!isHe && reverse);
  
  return (
    <div className="hidden lg:flex flex-1 items-center justify-center min-w-[30px] relative z-0">
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
        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 ml-3 bg-white px-1.5 py-0.5 border border-slate-300 rounded text-[9.5px] font-mono text-slate-600 shadow-sm z-20 whitespace-nowrap">
          {isHe ? label.he : label.en}
        </div>
      )}
    </div>
  );
}

// U-Turn Arrow for connecting rows in a snake layout (Desktop only)
function TurnArrow({ isHe, direction }: { isHe: boolean, direction: 'right-to-left' | 'left-to-right' }) {
  const isRightSide = (isHe && direction === 'left-to-right') || (!isHe && direction === 'right-to-left');
  
  return (
    <div className={`hidden lg:block absolute top-1/2 w-8 h-full border-slate-400 z-0 ${isRightSide ? 'right-0 border-r-[3px] border-y-[3px] rounded-r-xl translate-x-[90%]' : 'left-0 border-l-[3px] border-y-[3px] rounded-l-xl -translate-x-[90%]'}`}>
      <div className={`absolute bottom-[-1px] ${isRightSide ? 'left-[-4px]' : 'right-[-4px]'} border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ${isRightSide ? 'border-r-[10px] border-r-slate-400' : 'border-l-[10px] border-l-slate-400'}`}></div>
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
    <div className={`w-[175px] min-h-[110px] flex flex-col rounded-xl border-[3px] ${s.border} ${s.bg} p-2.5 shadow-md transition-all hover:shadow-lg hover:-translate-y-1 group shrink-0 relative z-10 bg-opacity-95`}>
      <div className={`w-10 h-10 rounded-lg ${s.iconBg} flex items-center justify-center mb-2 shadow-sm shrink-0`}>
        <Icon className={`w-5 h-5 ${s.iconColor}`} />
      </div>
      <h3 className={`text-[12.5px] font-bold mb-1 leading-snug ${s.text}`}>{isHe ? titleHe : titleEn}</h3>
      <p className={`text-[10.5px] opacity-80 leading-snug ${s.text} mb-2 flex-grow`}>{isHe ? descHe : descEn}</p>
      {techs && techs.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-auto pt-1.5 border-t border-black/10">
          {techs.map(t => <TechBadge key={t} name={t} />)}
        </div>
      )}
    </div>
  );
}

function BranchLabel({ text, color = 'text-green-600' }: { text: string; color?: string }) {
  return <span className={`text-[10.5px] font-extrabold ${color} bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm relative z-20 mb-1`}>{text}</span>;
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

        <div className="max-w-[1300px] mx-auto px-4 md:px-8 flex flex-col items-center">

          {/* ══════════════════════════════════
               PHASE 1
             ══════════════════════════════════ */}
          <div className="w-full rounded-2xl overflow-visible shadow-lg border border-blue-200 bg-blue-50/40 mb-2 relative">
            <div className="w-full p-4 bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-xl">
              <h2 className="text-xl font-bold">{isHe ? 'שלב 1: קליטת המסמך והנתונים' : 'Phase 1: User Initiation & Data Ingestion'}</h2>
            </div>
            <div className="p-6 md:p-10 flex flex-col items-center w-full relative">
              <div className="flex flex-col lg:flex-row justify-between items-center w-full">
                <NodeCard type="user" icon={User} isHe={isHe} titleEn="1. User UI" titleHe="1. ממשק משתמש" descEn="Upload Draft Manuscript & Target Journal" descHe="העלאת טיוטת מאמר וכתב עת יעד" techs={['Next.js 16', 'Tiptap']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} label={{ en: 'File', he: 'קובץ' }} />
                <NodeCard type="infra" icon={Code} isHe={isHe} titleEn="2. Parser" titleHe="2. מנתח מסמכים" descEn="Extract raw text from PDF/DOCX" descHe="חילוץ טקסט גולמי מהמסמך" techs={['Mammoth', 'PDF Parser']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} label={{ en: 'Raw text', he: 'טקסט' }} />
                <NodeCard type="infra" icon={FileText} isHe={isHe} titleEn="3. Metadata" titleHe="3. מטא-דאטה" descEn="Extract Authors, Keywords, Abstract" descHe="חילוץ מחברים, מילות מפתח, תקציר" techs={['Claude 3.5 Haiku', 'Zod']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} label={{ en: 'JSON', he: 'JSON' }} />
                <NodeCard type="db" icon={Database} isHe={isHe} titleEn="4. Database" titleHe="4. מסד נתונים" descEn="Save initial record. Return ID." descHe="שמירת רשומה. החזרת מזהה." techs={['Neon Postgres']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="queue" icon={Zap} isHe={isHe} titleEn="5. Queue" titleHe="5. תור משימות" descEn="Fire event: 'paper/uploaded'" descHe="הפעלת אירוע 'מאמר הועלה'" techs={['Inngest']} />
              </div>
            </div>
          </div>
          
          <VerticalFlowArrow isHe={isHe} length="h-16" label={{ en: "Event triggered", he: "אירוע הופעל" }} />

          {/* ══════════════════════════════════
               PHASE 2
             ══════════════════════════════════ */}
          <div className="w-full rounded-2xl overflow-visible shadow-lg border border-green-200 bg-green-50/40 mb-2">
            <div className="w-full p-4 bg-gradient-to-r from-green-600 to-green-800 text-white rounded-t-xl">
              <h2 className="text-xl font-bold">{isHe ? 'שלב 2: צינור 10 הסוכנים (AgentOrchestrator)' : 'Phase 2: The 10-Agent Rewriting Pipeline'}</h2>
            </div>
            
            <div className="p-6 md:p-10 flex flex-col items-center w-full relative">
              {/* Row 1 */}
              <div className="flex flex-col lg:flex-row justify-between items-center w-full relative z-10">
                <NodeCard type="agent" icon={Bot} isHe={isHe} titleEn="Orchestrator" titleHe="מנצח הסוכנים" descEn="Instantiates Context. Routes through 10 agents." descHe="מנווט ברצף דרך סוכנים מומחים." techs={['LangGraph', 'Langfuse']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Search} isHe={isHe} titleEn="6. Clarification" titleHe="6. סוכן הבהרה" descEn="Extracts editorial goals & constraints" descHe="מחלץ יעדי עריכה ואילוצי כתב עת" techs={['Claude 3.7']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={FileText} isHe={isHe} titleEn="7. Planning" titleHe="7. סוכן תכנון" descEn="Builds step-by-step revision DAG" descHe="בונה גרף משימות מכוון (DAG)" techs={['Claude 3.7']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Search} isHe={isHe} titleEn="8. Knowledge" titleHe="8. סוכן ידע" descEn="MCP → PubMed. GraphRAG for citations." descHe="GraphRAG למציאת ציטוטים חסרים." techs={['MCP', 'pgvector']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={MessageSquare} isHe={isHe} titleEn="9. SciReview" titleHe="9. עימות סוקרים" descEn="Harsh (Claude) + Analyst (GPT-4o) + Optimist" descHe="ביקורת רב-מודלית (Claude, GPT-4o, Gemini)" techs={['GPT-4o', 'Gemini 1.5']} />
                
                <TurnArrow isHe={isHe} direction="right-to-left" />
                <VerticalFlowArrow isHe={isHe} length="h-16 lg:hidden" />
              </div>

              {/* Row 2 - RTL mapped logically via flex-row-reverse on desktop */}
              <div className={`mt-0 lg:mt-12 flex flex-col lg:flex-row items-center w-full relative justify-between z-10 ${isHe ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                <NodeCard type="agent" icon={Layers} isHe={isHe} titleEn="Area Chair (o1)" titleHe="סוכן-על (o1)" descEn="Synthesizes debate into concrete action plan" descHe="מסנתז דיבייט לתוכנית פעולה עמוקה" techs={['OpenAI o1']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} reverse={true} label={{en: 'Plan', he: 'תוכנית'}} />
                <NodeCard type="agent" icon={Brain} isHe={isHe} titleEn="Mem0 Context" titleHe="הקשר Mem0" descEn="Fetch user style preferences from memory" descHe="שליפת העדפות סגנון כתיבה מהזיכרון" techs={['Mem0', 'Upstash Redis']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} reverse={true} />
                <NodeCard type="agent" icon={Edit3} isHe={isHe} titleEn="10. Writer" titleHe="10. סוכן כתיבה" descEn="Rewrites prose to Nature/Science standards." descHe="שכתוב איטרטיבי לרמה של Nature/Science." techs={['Claude 3.7', 'Langfuse']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} reverse={true} />
                <NodeCard type="logic" icon={ShieldCheck} isHe={isHe} titleEn="Guardrails AI" titleHe="בדיקת בטיחות" descEn="Validate: no PII leakage, no hallucinations" descHe="ולידציה: ללא PII, טון אקדמי, ללא הזיות" techs={['Guardrails AI']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} reverse={true} />
                <NodeCard type="agent" icon={Code} isHe={isHe} titleEn="11. Execution" titleHe="11. סוכן ביצוע" descEn="Applies line-by-line diff. Generates JSON patch." descHe="מחיל שינויים סעיף-אחר-סעיף ומייצר Diff." techs={['Claude 3.7', 'Tiptap']} />
                
                <TurnArrow isHe={isHe} direction="left-to-right" />
                <VerticalFlowArrow isHe={isHe} length="h-16 lg:hidden" />
              </div>

              {/* Row 3 - LTR */}
              <div className="mt-0 lg:mt-12 flex flex-col lg:flex-row justify-between items-center w-full relative z-10">
                <NodeCard type="logic" icon={Shield} isHe={isHe} titleEn="IntegrityScanner" titleHe="סורק תקינות" descEn="Plagiarism score + AI-generation detection" descHe="בדיקת ציון פלגיאט + זיהוי כתיבת AI" techs={['Claude 3.7']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={CheckCircle} isHe={isHe} titleEn="14. QaAgent" titleHe="14. סוכן QA" descEn="Final consistency, formatting, grammar check" descHe="בדיקת עקביות סופית, עיצוב ודקדוק" techs={['Claude 3.7', 'Jest']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={ListChecks} isHe={isHe} titleEn="15. Verification" titleHe="15. סוכן אימות" descEn="Verify journal guidelines compliance" descHe="אימות עמידה מלאה בהנחיות כתב העת" techs={['OpenAI o1']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={FileText} isHe={isHe} titleEn="16. Cover Letter" titleHe="16. מכתב מקדים" descEn="Generate persuasive letter to Editor-in-Chief" descHe="יצירת מכתב מקדים משכנע לעורך" techs={['Claude 3.7']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Download} isHe={isHe} titleEn="17. Compile" titleHe="17. סוכן הידור" descEn="Compile final manuscript + metadata payload" descHe="הידור מאמר סופי + מטען נתונים להגשה" techs={['DOCX']} />
              </div>
            </div>
          </div>

          <VerticalFlowArrow isHe={isHe} length="h-16" label={{ en: "Update DB → Awaiting user approval", he: "עדכון מסד → המתנה לאישור משתמש" }} />

          {/* ══════════════════════════════════
               PHASE 3
             ══════════════════════════════════ */}
          <div className="w-full rounded-2xl overflow-visible shadow-lg border border-rose-200 bg-rose-50/40 mb-2 relative">
            <div className="w-full p-4 bg-gradient-to-r from-rose-500 to-rose-700 text-white rounded-t-xl">
              <h2 className="text-xl font-bold">{isHe ? 'שלב 3: אישור, הרשאות ושער הגשה' : 'Phase 3: Approval, Permissions & Submission Gateway'}</h2>
            </div>
            <div className="p-6 md:p-10 flex flex-col items-center w-full relative z-10">
              <div className="flex flex-col lg:flex-row justify-center items-center w-full relative">
                <NodeCard type="user" icon={User} isHe={isHe} titleEn="20. Approve" titleHe="20. אישור והגשה" descEn="User reviews final paper and clicks 'Approve & Submit'" descHe="המשתמש סוקר את המאמר ולוחץ 'אשר והגש'" techs={['Next.js 16']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                
                <NodeCard type="logic" icon={Key} isDiamond isHe={isHe} titleEn="Auth Given?" titleHe="הרשאות הוענקו?" descEn="Has user linked OAuth / Email creds?" descHe="האם המשתמש העניק הרשאות API/Email?" />
                
                {/* Branching from Auth */}
                <div className="hidden lg:flex flex-col mx-2 items-center justify-center min-w-[120px]">
                  <div className="flex items-center w-full">
                     <BranchLabel text={isHe ? 'כן (נתיב מהיר)' : 'Yes (Fast)'} />
                     <FlowArrow isHe={isHe} />
                  </div>
                  <div className="w-full mt-2 mb-1"><OrDivider isHe={isHe} labelEn="OR" labelHe="או" /></div>
                  <div className="flex items-center w-full mt-2 relative">
                     <BranchLabel text={isHe ? 'לא (נתיב מורכב)' : 'No (Complex)'} color="text-purple-600" />
                     {/* Draw line routing down and across */}
                     <div className="absolute top-[50%] left-[50%] w-[100%] h-12 border-b-[3px] border-l-[3px] border-slate-400 rounded-bl-xl -z-10 translate-x-[20px] translate-y-[-38px]"></div>
                  </div>
                </div>

                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" label={{en: "Yes (Fast)", he: "כן (מהיר)"}} />

                <NodeCard type="rpa" icon={Lock} isHe={isHe} titleEn="22. AES Decrypt" titleHe="22. פענוח הרשאות" descEn="Decrypt API tokens / Email passwords safely" descHe="פענוח מאובטח של סיסמאות וטוקנים" techs={['AES-256-GCM', 'Neon Postgres']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                
                <NodeCard type="logic" icon={Settings} isDiamond isHe={isHe} titleEn="23. Route Platform" titleHe="23. ניתוב פלטפורמה" descEn="Route by: WordPress / Editorial Mgr / Email" descHe="ניתוב פנימי לממשק המתאים" />
              </div>
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
                  <NodeCard type="rpa" icon={Globe} isHe={isHe} titleEn="WordPress/OJS API" titleHe="WordPress / OJS" descEn="Execute direct POST to REST APIs" descHe="ביצוע קריאות REST API ישירות" techs={['Next.js 16']} />
                  <VerticalFlowArrow isHe={isHe} length="h-8 lg:hidden" />
                  <FlowArrow isHe={isHe} />
                  <NodeCard type="success" icon={CheckCircle2} isHe={isHe} titleEn="Success ✓" titleHe="הצלחה ✓" descEn="Submission complete" descHe="ההגשה הושלמה" techs={['Neon Postgres']} />
                </div>
                
                <OrDivider isHe={isHe} />
                
                <div className="flex flex-col lg:flex-row items-center justify-between w-full mb-2 mt-2">
                  <NodeCard type="rpa" icon={Globe} isHe={isHe} titleEn="EditorialManager API" titleHe="EditorialManager API" descEn="Execute API stub requests securely" descHe="ביצוע קריאות API מאובטחות" techs={['Next.js 16']} />
                  <VerticalFlowArrow isHe={isHe} length="h-8 lg:hidden" />
                  <FlowArrow isHe={isHe} />
                  <NodeCard type="success" icon={CheckCircle2} isHe={isHe} titleEn="Success ✓" titleHe="הצלחה ✓" descEn="Submission complete" descHe="ההגשה הושלמה" techs={['Neon Postgres']} />
                </div>
                
                <OrDivider isHe={isHe} />
                
                <div className="flex flex-col lg:flex-row items-center justify-between w-full mt-2">
                  <NodeCard type="rpa" icon={Mail} isHe={isHe} titleEn="EmailAdapter" titleHe="מתאם אימייל" descEn="Multipart MIME → SMTP → Editor" descHe="שליחת מייל עם חבילת הגשה ישירות לעורך" techs={['Nodemailer']} />
                  <VerticalFlowArrow isHe={isHe} length="h-8 lg:hidden" />
                  <FlowArrow isHe={isHe} />
                  <NodeCard type="success" icon={CheckCircle2} isHe={isHe} titleEn="Success ✓" titleHe="הצלחה ✓" descEn="Submission complete" descHe="ההגשה הושלמה" techs={['Neon Postgres']} />
                </div>
              </div>
            </div>

            {/* 4B: Complex Lane */}
            <div className="flex-[5] rounded-2xl overflow-visible shadow-lg border border-purple-300 bg-purple-50/40">
              <div className="w-full p-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-t-xl relative">
                <h2 className="text-xl font-bold">{isHe ? 'שלב 4B: נתיב RPA אוטונומי' : 'Phase 4B: Autonomous RPA Bot'}</h2>
                <p className="text-sm opacity-90">{isHe ? 'מופעל כגיבוי או כשאין API זמין' : 'Fallback when no API / no credentials'}</p>
                {/* Arrow coming from missing creds */}
                <div className="hidden lg:block absolute -left-[14px] top-1/2 w-4 border-b-[3px] border-slate-400"></div>
                <div className="hidden lg:block absolute -left-[12px] top-[calc(50%-4px)] border-l-[8px] border-l-slate-400 border-y-[5px] border-y-transparent z-20"></div>
              </div>
              <div className="p-6 md:p-8 flex flex-col items-center">
                <div className="flex flex-col lg:flex-row items-center w-full justify-center">
                  <NodeCard type="rpa" icon={Bot} isHe={isHe} titleEn="GenericNavigator" titleHe="נווט גנרי" descEn="Launch headless Chromium & load portal" descHe="הפעלת דפדפן ללא ראש וטעינת הפורטל" techs={['Playwright']} />
                  <VerticalFlowArrow isHe={isHe} length="h-8 lg:hidden" />
                  <FlowArrow isHe={isHe} />
                  <NodeCard type="logic" icon={Search} isDiamond isHe={isHe} titleEn="DOM Found?" titleHe="אלמנטים נמצאו?" descEn="Are CSS selectors visible?" descHe="האם סלקטורים קיימים?" />
                  
                  {/* Branch logic explicitly using grid/flex to connect */}
                  <div className="flex flex-col items-center justify-center gap-2 lg:ml-2">
                     <div className="flex items-center rounded-lg pr-2 w-full">
                       <FlowArrow isHe={isHe} />
                       <NodeCard type="rpa" icon={Eye} isHe={isHe} titleEn="Vision AI" titleHe="ראייה ממוחשבת" descEn="Claude → JSON {X,Y} → Click" descHe="גיבוי - קואורדינטות ראייה ולחיצה" techs={['Vision AI']} />
                     </div>
                     <div className="w-1/2 ml-auto"><OrDivider isHe={isHe} labelEn="OR" labelHe="או" /></div>
                     <div className="flex items-center rounded-lg pr-2 w-full">
                       <FlowArrow isHe={isHe} />
                       <NodeCard type="rpa" icon={Edit3} isHe={isHe} titleEn="Fill & Upload" titleHe="מילוי והעלאה" descEn="fillForm() & uploadFiles()" descHe="מילוי טפסים והעלאת קבצי מאמר" techs={['Playwright']} />
                     </div>
                  </div>
                </div>

                <VerticalFlowArrow isHe={isHe} length="h-12" label={{ en: 'Proceed', he: 'המשך' }} />

                <div className="flex flex-col lg:flex-row items-center w-full justify-center">
                  <NodeCard type="logic" icon={Lock} isDiamond isHe={isHe} titleEn="CAPTCHA / 2FA?" titleHe="אימות דו-שלבי?" descEn="Is human intervention needed?" descHe="האם נדרשת התערבות אנושית?" />
                  
                  <div className="flex flex-col items-center justify-center gap-2 lg:ml-2">
                     <div className="flex items-center rounded-lg pr-2 w-full">
                       <FlowArrow isHe={isHe} />
                       <NodeCard type="queue" icon={User} isHe={isHe} titleEn="Pause & Notify" titleHe="השהיה והתראה" descEn="WebSocket → User solves → Resume" descHe="התראה → המשתמש פותר בממשק → חידוש" techs={['WebSockets', 'Inngest']} />
                     </div>
                     <div className="w-1/2 ml-auto"><OrDivider isHe={isHe} labelEn="OR" labelHe="או" /></div>
                     <div className="flex items-center rounded-lg pr-2 w-full">
                       <FlowArrow isHe={isHe} />
                       <NodeCard type="rpa" icon={CheckCircle2} isHe={isHe} titleEn="Final Submit" titleHe="הגשה סופית" descEn="Click Submit → Scrape Tracking ID" descHe="לחיצה על שליחה → חילוץ מזהה מעקב" techs={['Playwright']} />
                     </div>
                  </div>
                </div>
                
                <VerticalFlowArrow isHe={isHe} length="h-12" />
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
                <NodeCard type="queue" icon={Zap} isHe={isHe} titleEn="36. Queue" titleHe="36. תור" descEn="Event: 'comments-received'" descHe="אירוע: 'התקבלו הערות סוקרים'" techs={['Inngest']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Brain} isHe={isHe} titleEn="37. Rebuttal Agent" titleHe="37. סוכן מענה" descEn="Read critique → Generate rebuttalStrategy" descHe="ניתוח הביקורת → יצירת אסטרטגיית מענה" techs={['OpenAI o1', 'Mem0']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="user" icon={User} isHe={isHe} titleEn="38. User Approve" titleHe="38. אישור משתמש" descEn="Approve Rebuttal Strategy in UI" descHe="אישור אסטרטגיית המענה בממשק" techs={['Next.js 16']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={RefreshCw} isHe={isHe} titleEn="39. Re-run Pipeline" titleHe="39. הרצה חוזרת" descEn="Apply requested edits via Agent Pipeline" descHe="החלת השינויים דרך צינור הסוכנים" techs={['LangGraph']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="infra" icon={CheckCircle2} isHe={isHe} titleEn="40. Submit Response" titleHe="40. הגשת מענה" descEn="Back to Submission Gateway (Phase 3)" descHe="חזרה לשער ההגשה (שלב 3)" />
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
                <NodeCard type="queue" icon={Zap} isHe={isHe} titleEn="44. Queue" titleHe="44. תור" descEn="Event: 'paperRejected'" descHe="אירוע: 'מאמר נדחה'" techs={['Inngest']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Layers} isHe={isHe} titleEn="45. Cascade Agent" titleHe="45. סוכן מפל" descEn="Find next tier journal in JournalCascadeMap" descHe="מציאת כתב העת הבא במפל היעדים" techs={['pgvector']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Scissors} isHe={isHe} titleEn="46. Reformat" titleHe="46. עיצוב מחדש" descEn="Auto-reformat to fit new journal guidelines" descHe="עיצוב מחדש אוטומטי להנחיות החדשות" techs={['Claude 3.7']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="infra" icon={RefreshCw} isHe={isHe} titleEn="47. Fresh Submit" titleHe="47. הגשה חדשה" descEn="Back to Phase 3 for new journal" descHe="חזרה לשלב 3 עבור כתב העת החדש" />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="success" icon={CheckCircle2} isHe={isHe} titleEn="48. Published!" titleHe="48. פורסם!" descEn="Success! Target Journal Published" descHe="הצלחה! פורסם בכתב העת" techs={['Neon Postgres']} />
              </div>
            </div>
          </div>
          
          <div className="mt-10 h-10 w-full" />
        </div>
      </div>
    </DashboardLayout>
  );
}
