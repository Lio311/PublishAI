import React from 'react';
import { ArrowRight, ArrowDown } from 'lucide-react';

interface VisualFlowchartProps {
  locale: 'en' | 'he';
}

export default function VisualFlowchart({ locale }: VisualFlowchartProps) {
  const isHe = locale === 'he';
  
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 md:p-8 mb-8 overflow-x-auto" dir={isHe ? "rtl" : "ltr"}>
      <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">
        {isHe ? "תרשים זרימת מערכת (System Flow)" : "System Flowchart"}
      </h3>
      
      <div className="flex flex-col items-center gap-6 min-w-[800px]">
        
        
        {/* Phase 0 */}
        <div className="w-full bg-white border border-indigo-200 rounded-xl p-6 shadow-sm">
          <h4 className="font-bold text-indigo-800 mb-4 border-b border-indigo-100 pb-2">
            {isHe ? "שלב 0: מחקר, נתונים וניתוח חזותי" : "Phase 0: Data Science & Vision"}
          </h4>
          <div className="flex items-center justify-center gap-6">
            <Node title={isHe ? "העלאת נתונים" : "Data Upload"} color="bg-indigo-100 text-indigo-800" />
            <Arrow isHe={isHe} />
            <Node title={isHe ? "ארגז חול (פייתון)" : "Data Science Sandbox"} color="bg-indigo-100 text-indigo-800" />
            <Arrow isHe={isHe} />
            <Node title={isHe ? "ניתוח איורים (Vision)" : "Vision Analysis"} color="bg-indigo-100 text-indigo-800" />
          </div>
        </div>

        <ArrowDown className="text-slate-400 w-6 h-6" />

        {/* Phase 1 */}
        <div className="w-full bg-white border border-cyan-200 rounded-xl p-6 shadow-sm">
          <h4 className="font-bold text-cyan-800 mb-4 border-b border-cyan-100 pb-2">
            {isHe ? "שלב 1: ליבת השכתוב (Core Revision)" : "Phase 1: Core Revision"}
          </h4>
          <div className="flex items-center justify-between gap-2">
            <Node title={isHe ? "העלאת מסמך" : "Document Upload"} color="bg-cyan-100 text-cyan-800" />
            <Arrow isHe={isHe} />
            <Node title={isHe ? "בירור והגדרות" : "Clarification"} color="bg-green-100 text-green-800" />
            <Arrow isHe={isHe} />
            <Node title={isHe ? "תכנון וידע" : "Planning & Knowledge"} color="bg-green-100 text-green-800" />
            <Arrow isHe={isHe} />
            <Node title={isHe ? "עימות סוקרים" : "Debate Panel"} color="bg-indigo-100 text-indigo-800" />
            <Arrow isHe={isHe} />
            <Node title={isHe ? "יו\"ר (Area Chair)" : "Area Chair"} color="bg-indigo-100 text-indigo-800" />
            <Arrow isHe={isHe} />
            <div className="flex flex-col items-center p-3 border-2 border-dashed border-purple-300 rounded-xl bg-purple-50/50">
              <span className="text-xs font-bold text-purple-500 mb-2">{isHe ? 'לולאת שכתוב (Langfuse)' : 'LangGraph Loop (Langfuse)'}</span>
              <div className="flex items-center gap-2">
                <Node title={isHe ? "העדפות (Mem0)" : "Mem0 Context"} color="bg-purple-100 text-purple-800" />
                <Arrow isHe={isHe} />
                <Node title={isHe ? "כתיבה" : "Writing"} color="bg-purple-200 text-purple-900 shadow-md" />
                <Arrow isHe={isHe} />
                <Node title={isHe ? "אבטחה (Guardrails)" : "Guardrails AI"} color="bg-purple-100 text-purple-800" />
              </div>
            </div>
            <Arrow isHe={isHe} />
            <Node title={isHe ? "QA והפקה" : "QA & Export"} color="bg-cyan-100 text-cyan-800" />
          </div>
        </div>

        <ArrowDown className="text-slate-400 w-6 h-6" />

        {/* Phase 2 */}
        <div className="w-full bg-white border border-pink-200 rounded-xl p-6 shadow-sm">
          <h4 className="font-bold text-pink-800 mb-4 border-b border-pink-100 pb-2">
            {isHe ? "שלב 2: התחברות לעיתון (Journal Connection)" : "Phase 2: Journal Connection"}
          </h4>
          <div className="flex items-center justify-center gap-6">
            <Node title={isHe ? "בחירת עיתון" : "Journal Selection"} color="bg-pink-100 text-pink-800" />
            <Arrow isHe={isHe} />
            <Node title={isHe ? "גירוד הנחיות (Scraping)" : "Guidelines Scraping"} color="bg-pink-100 text-pink-800" />
            <Arrow isHe={isHe} />
            <Node title={isHe ? "התאמת פורמט" : "Formatting"} color="bg-pink-100 text-pink-800" />
            <Arrow isHe={isHe} />
            <Node title={isHe ? "אימות עמידה ביעדים" : "Compliance Validation"} color="bg-pink-100 text-pink-800" />
          </div>
        </div>

        <ArrowDown className="text-slate-400 w-6 h-6" />

        {/* Phase 3 */}
        <div className="w-full bg-white border border-amber-200 rounded-xl p-6 shadow-sm">
          <h4 className="font-bold text-amber-800 mb-4 border-b border-amber-100 pb-2">
            {isHe ? "שלב 3: פינג-פונג תיקונים (Peer Review Iteration)" : "Phase 3: Peer Review Iteration"}
          </h4>
          <div className="flex items-center justify-center gap-6">
            <Node title={isHe ? "קליטת R&R" : "Ingest Feedback"} color="bg-amber-100 text-amber-800" />
            <Arrow isHe={isHe} />
            <Node title={isHe ? "מיפוי הערות סוקרים" : "Reviewer Mapping"} color="bg-amber-100 text-amber-800" />
            <Arrow isHe={isHe} />
            <Node title={isHe ? "אסטרטגיית מענה" : "Rebuttal Strategy"} color="bg-amber-100 text-amber-800" />
            <Arrow isHe={isHe} />
            <Node title={isHe ? "שכתוב ממוקד" : "Directed Revision"} color="bg-amber-100 text-amber-800" />
            <Arrow isHe={isHe} />
            <Node title={isHe ? "מכתב תגובה רשמי" : "Formal Rebuttal Letter"} color="bg-amber-100 text-amber-800" />
          </div>
        </div>

        <ArrowDown className="text-slate-400 w-6 h-6" />

        {/* Phase 4 */}
        <div className="w-full bg-white border border-emerald-200 rounded-xl p-6 shadow-sm">
          <h4 className="font-bold text-emerald-800 mb-4 border-b border-emerald-100 pb-2">
            {isHe ? "שלב 4: הפצה ולמידת חיזוק (RLHF)" : "Phase 4: Dissemination & RLHF"}
          </h4>
          <div className="flex items-center justify-center gap-6">
            <Node title={isHe ? "פרסום באתר (CMS)" : "CMS Publish"} color="bg-emerald-100 text-emerald-800" />
            <Arrow isHe={isHe} />
            <Node title={isHe ? "מעקב ביצועים" : "Performance Tracking"} color="bg-emerald-100 text-emerald-800" />
            <Arrow isHe={isHe} />
            <Node title={isHe ? "משוב אנושי (RLHF)" : "Human Feedback"} color="bg-emerald-100 text-emerald-800" />
            <Arrow isHe={isHe} />
            <Node title={isHe ? "עדכון מודלים" : "Model Fine-Tuning"} color="bg-emerald-100 text-emerald-800" />
          </div>
        </div>

      </div>
    </div>
  );
}

function Node({ title, color }: { title: string, color: string }) {
  return (
    <div className={`px-4 py-3 rounded-lg font-bold text-sm text-center shadow-sm whitespace-nowrap min-w-[120px] ${color}`}>
      {title}
    </div>
  );
}

function Arrow({ isHe }: { isHe: boolean }) {
  return (
    <div className="text-slate-300">
      <ArrowRight className={`w-5 h-5 ${isHe ? 'rotate-180' : ''}`} />
    </div>
  );
}
