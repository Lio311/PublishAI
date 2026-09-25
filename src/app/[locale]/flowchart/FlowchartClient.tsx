"use client";

import React from 'react';
import { useLocale } from 'next-intl';
import {
  Upload, Code, FileText, Database, Zap, Brain, Search, Edit3, MessageSquare, 
  ShieldCheck, CheckCircle, Download, Globe, Lock, Eye, Settings, Mail, User, 
  Bot, Scissors, ListChecks, GitMerge, RefreshCw, ArrowRight, ArrowDown, 
  AlertTriangle, CheckCircle2, Box, HelpCircle
} from 'lucide-react';

// --- Type Definitions ---
type NodeType = 'user' | 'agent' | 'queue' | 'rpa' | 'db' | 'logic' | 'success' | 'error' | 'default';

interface NodeProps {
  id: string;
  titleEn: string;
  titleHe: string;
  descEn: string;
  descHe: string;
  icon: React.ElementType;
  type: NodeType;
  isHe: boolean;
  isDiamond?: boolean;
}

// --- Constants & Styles ---
const nodeStyles: Record<NodeType, { bg: string, border: string, text: string, iconBg: string, iconColor: string }> = {
  user: { bg: 'bg-blue-50', border: 'border-blue-300', text: 'text-blue-900', iconBg: 'bg-blue-200', iconColor: 'text-blue-700' },
  agent: { bg: 'bg-purple-50', border: 'border-purple-300', text: 'text-purple-900', iconBg: 'bg-purple-200', iconColor: 'text-purple-700' },
  queue: { bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-900', iconBg: 'bg-orange-200', iconColor: 'text-orange-700' },
  rpa: { bg: 'bg-teal-50', border: 'border-teal-300', text: 'text-teal-900', iconBg: 'bg-teal-200', iconColor: 'text-teal-700' },
  db: { bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-900', iconBg: 'bg-green-200', iconColor: 'text-green-700' },
  logic: { bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-900', iconBg: 'bg-yellow-200', iconColor: 'text-yellow-700' },
  success: { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-900', iconBg: 'bg-emerald-200', iconColor: 'text-emerald-700' },
  error: { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-900', iconBg: 'bg-red-200', iconColor: 'text-red-700' },
  default: { bg: 'bg-gray-50', border: 'border-gray-300', text: 'text-gray-900', iconBg: 'bg-gray-200', iconColor: 'text-gray-700' }
};

// --- Components ---

const FlowArrow = ({ isHe, vertical = false, className = "" }: { isHe: boolean, vertical?: boolean, className?: string }) => {
  if (vertical) {
    return <ArrowDown className={`w-6 h-6 text-slate-400 mx-auto my-2 shrink-0 ${className}`} />;
  }
  return <ArrowRight className={`w-6 h-6 text-slate-400 shrink-0 mx-2 ${isHe ? 'rotate-180' : ''} ${className}`} />;
};

const NodeCard = ({ titleEn, titleHe, descEn, descHe, icon: Icon, type, isHe, isDiamond = false }: NodeProps) => {
  const styles = nodeStyles[type];
  
  if (isDiamond) {
    return (
      <div className="relative flex flex-col items-center justify-center group shrink-0 mx-4 my-2">
        <div className={`w-28 h-28 ${styles.bg} border-2 ${styles.border} shadow-sm rotate-45 flex items-center justify-center transition-transform group-hover:scale-105`}>
          <div className="-rotate-45 flex flex-col items-center text-center p-2">
            <Icon className={`w-6 h-6 ${styles.iconColor} mb-1`} />
            <span className={`text-[10px] font-bold leading-tight ${styles.text}`}>
              {isHe ? titleHe : titleEn}
            </span>
          </div>
        </div>
        {/* Tooltip for diamond */}
        <div className="absolute top-full mt-2 w-48 bg-gray-800 text-white text-[11px] p-2 rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10 text-center transition-opacity">
          {isHe ? descHe : descEn}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-[170px] min-h-[140px] flex flex-col rounded-xl border-2 ${styles.border} ${styles.bg} p-3 shadow-sm transition-all hover:shadow-md hover:scale-[102%] group shrink-0 relative m-2`}>
      <div className={`w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center mb-3 shadow-inner`}>
        <Icon className={`w-5 h-5 ${styles.iconColor}`} />
      </div>
      <h3 className={`text-[13px] font-bold mb-1 leading-snug ${styles.text}`}>
        {isHe ? titleHe : titleEn}
      </h3>
      <p className={`text-[11px] opacity-80 leading-snug ${styles.text}`}>
        {isHe ? descHe : descEn}
      </p>
    </div>
  );
};

const PhaseSection = ({ 
  titleEn, titleHe, number, gradient, bg, children, isHe 
}: { 
  titleEn: string, titleHe: string, number: number, gradient: string, bg: string, children: React.ReactNode, isHe: boolean 
}) => (
  <div className="w-full flex flex-col items-center mb-4 mt-8">
    <div className={`w-full max-w-7xl rounded-2xl overflow-hidden shadow-sm border border-gray-200 ${bg}`}>
      <div className={`w-full p-4 bg-gradient-to-r ${gradient} text-white`}>
        <h2 className="text-xl font-bold">
          {isHe ? `שלב ${number}: ${titleHe}` : `Phase ${number}: ${titleEn}`}
        </h2>
      </div>
      <div className="p-6 md:p-8 flex flex-col w-full">
        {children}
      </div>
    </div>
    <div className="mt-6 mb-2">
      <div className="w-12 h-12 rounded-full bg-white border-4 border-gray-200 flex items-center justify-center shadow-sm">
        <ArrowDown className="w-6 h-6 text-gray-400" />
      </div>
    </div>
  </div>
);

// --- Main Page Component ---

export default function FlowchartClient() {
  const locale = useLocale();
  const isHe = locale === 'he';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans" dir={isHe ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="w-full bg-white border-b border-gray-200 shadow-sm print:shadow-none">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
                <Box className="w-8 h-8 text-blue-600" />
                PublishAI Flow
              </h1>
              <p className="text-lg text-gray-600 mt-2 font-medium">
                {isHe ? 'ארכיטקטורה מקצה לקצה ותהליך ביצוע' : 'End-to-End Architecture & Execution Flow'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {isHe ? 'מטיוטה לפרסום — סוכני בינה מלאכותית, אוטומציה ואדם-בלולאה' : 'From manuscript to publication — AI Agents, automation and human-in-the-loop'}
              </p>
            </div>
            
            {/* Legend */}
            <div className="mt-6 md:mt-0 bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-400 border border-blue-600"></div>{isHe ? 'משתמש / ממשק' : 'User / UI'}</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-400 border border-purple-600"></div>{isHe ? 'סוכן חכם (Agent)' : 'AI Agent'}</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-400 border border-orange-600"></div>{isHe ? 'תור / אירוע' : 'Queue / Event'}</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-teal-400 border border-teal-600 transform rotate-45"></div>{isHe ? 'אוטומציה / RPA' : 'RPA / Playwright'}</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-md bg-green-400 border border-green-600"></div>{isHe ? 'מסד נתונים' : 'Database / State'}</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm bg-yellow-400 border border-yellow-600 transform rotate-45"></div>{isHe ? 'לוגיקה / תנאי' : 'Logic / Condition'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 md:px-8 mt-8 flex flex-col items-center">

        {/* PHASE 1 */}
        <PhaseSection 
          number={1} 
          titleEn="User Initiation & Data Ingestion" 
          titleHe="קליטת המסמך והנתונים" 
          gradient="from-blue-600 to-blue-800" 
          bg="bg-blue-50/50"
          isHe={isHe}
        >
          <div className="flex flex-wrap justify-center md:justify-start items-center relative">
            <NodeCard id="p1-1" type="user" icon={User} isHe={isHe}
              titleEn="User UI" titleHe="ממשק משתמש"
              descEn="Upload Draft Manuscript (Word/PDF) & select Target Journal" descHe="העלאת טיוטת מאמר ובחירת כתב עת יעד" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p1-2" type="user" icon={Code} isHe={isHe}
              titleEn="Frontend Parser" titleHe="מנתח פרונטאנד"
              descEn="Next.js App Router parses document to raw text" descHe="פירוק המסמך לטקסט גולמי על ידי Next.js" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p1-3" type="user" icon={FileText} isHe={isHe}
              titleEn="Metadata Extraction" titleHe="חילוץ מטא-דאטה"
              descEn="Extract metadata (Authors, Affiliations, Keywords)" descHe="חילוץ מחברים, שיוך מוסדי ומילות מפתח" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p1-4" type="db" icon={Database} isHe={isHe}
              titleEn="Neon PostgreSQL" titleHe="מסד נתונים"
              descEn="Save initial record to 'papers' table. Record ID." descHe="שמירת רשומה ראשונית בטבלת המאמרים" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p1-5" type="queue" icon={Zap} isHe={isHe}
              titleEn="Inngest Queue" titleHe="תור משימות"
              descEn="Fire webhook: 'paper/uploaded'" descHe="הפעלת אירוע 'מאמר הועלה'" />
          </div>
        </PhaseSection>

        {/* PHASE 2 */}
        <PhaseSection 
          number={2} 
          titleEn="The 10-Agent Rewriting Pipeline (AgentOrchestrator)" 
          titleHe="צינור 10 הסוכנים (AgentOrchestrator)" 
          gradient="from-green-600 to-green-800" 
          bg="bg-green-50/50"
          isHe={isHe}
        >
          {/* Row 1 */}
          <div className="flex flex-wrap justify-center md:justify-start items-center mb-8 relative">
            <NodeCard id="p2-1" type="agent" icon={Bot} isHe={isHe}
              titleEn="AgentOrchestrator" titleHe="מנצח סוכנים"
              descEn="Event: 'paper/uploaded'. Passes AgentContext sequentially" descHe="קבלת אירוע והעברת הקשר הסוכן ברצף" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p2-2" type="default" icon={Box} isHe={isHe}
              titleEn="AgentContext" titleHe="הקשר משותף"
              descEn="Shared state object" descHe="אובייקט מצב משותף בין סוכנים" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p2-3" type="agent" icon={Search} isHe={isHe}
              titleEn="6. ClarificationAgent" titleHe="סוכן הבהרה"
              descEn="Analyzes user prompt and sets editorial goals" descHe="מנתח את בקשת המשתמש וקובע יעדי עריכה" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p2-4" type="agent" icon={FileText} isHe={isHe}
              titleEn="7. PlanningAgent" titleHe="סוכן תכנון"
              descEn="Generates step-by-step editorial plan" descHe="בונה תוכנית עריכה שלב אחר שלב" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p2-5" type="agent" icon={Search} isHe={isHe}
              titleEn="8. KnowledgeAgent" titleHe="סוכן ידע"
              descEn="Web search / literature for missing context" descHe="חיפוש ספרות ומידע חסר ברשת" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p2-6" type="agent" icon={MessageSquare} isHe={isHe}
              titleEn="9. SciReviewAgent" titleHe="סוכן סקירה מדעית"
              descEn="Simulates severe peer review critiques" descHe="הדמיית ביקורת עמיתים נוקשה" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p2-7" type="agent" icon={Edit3} isHe={isHe}
              titleEn="10. AcademicWriting" titleHe="סוכן כתיבה אקדמית"
              descEn="Generates high-level academic prose" descHe="כתיבת פרוזה אקדמית ברמה גבוהה" />
          </div>
          
          <div className="w-full flex justify-end md:pe-24 mb-4 hidden md:flex">
             <FlowArrow isHe={isHe} vertical />
          </div>

          {/* Row 2 */}
          <div className={`flex flex-wrap justify-center md:justify-end items-center mb-8 relative ${isHe ? 'flex-row' : 'flex-row-reverse'}`}>
            <NodeCard id="p2-8" type="agent" icon={Code} isHe={isHe}
              titleEn="11. ExecutionAgent" titleHe="סוכן ביצוע"
              descEn="Applies structural edits to manuscript text" descHe="החלת עריכות מבניות על טקסט המסמך" />
            <FlowArrow isHe={isHe} className="rotate-180" />
            <NodeCard id="p2-9" type="logic" icon={ShieldCheck} isHe={isHe}
              titleEn="IntegrityScanner" titleHe="סורק תקינות"
              descEn="Checks plagiarism score & AI-generation score" descHe="בדיקת העתקות וזיהוי יצירת AI" />
            <FlowArrow isHe={isHe} className="rotate-180" />
            <NodeCard id="p2-10" type="logic" icon={HelpCircle} isDiamond={true} isHe={isHe}
              titleEn="13. Pass Integrity?" titleHe="האם תקין?"
              descEn="Pass threshold check?" descHe="האם עבר בדיקת סף?" />
            <div className="flex flex-col items-center">
              <FlowArrow isHe={isHe} className="rotate-180" />
              <span className="text-[10px] text-red-500 font-bold bg-white px-1 rounded absolute -top-4">{isHe ? 'נכשל' : 'Fail'}</span>
            </div>
            <NodeCard id="p2-11" type="error" icon={AlertTriangle} isHe={isHe}
              titleEn="Throw Error" titleHe="זריקת שגיאה"
              descEn="Halt pipeline due to integrity fail" descHe="עצירת התהליך עקב כשל תקינות" />
          </div>

          <div className="w-full flex justify-center md:pe-24 mb-4 hidden md:flex">
             <FlowArrow isHe={isHe} vertical />
          </div>

          {/* Row 3 */}
          <div className="flex flex-wrap justify-center md:justify-start items-center relative">
            <NodeCard id="p2-12" type="agent" icon={CheckCircle} isHe={isHe}
              titleEn="14. QaAgent" titleHe="סוכן הבטחת איכות"
              descEn="Quality assurance on formatting and tone" descHe="בקרת איכות על עיצוב וטון הכתיבה" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p2-13" type="agent" icon={ListChecks} isHe={isHe}
              titleEn="15. VerificationAgent" titleHe="סוכן אימות"
              descEn="Verifies journal guidelines are met" descHe="אימות עמידה בהנחיות כתב העת" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p2-14" type="agent" icon={FileText} isHe={isHe}
              titleEn="16. CoverLetterAgent" titleHe="סוכן מכתב מקדים"
              descEn="Generates customized cover letter" descHe="יצירת מכתב מקדים מותאם אישית" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p2-15" type="agent" icon={Download} isHe={isHe}
              titleEn="17. CompilationAgent" titleHe="סוכן הידור"
              descEn="Compiles final text and metadata" descHe="הידור הטקסט הסופי והמטא-דאטה" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p2-16" type="db" icon={Database} isHe={isHe}
              titleEn="18. Update Database" titleHe="עדכון מסד נתונים"
              descEn="Set status: 'awaiting_approval'" descHe="עדכון סטטוס: 'ממתין לאישור'" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p2-17" type="rpa" icon={Mail} isHe={isHe}
              titleEn="19. Nodemailer" titleHe="שליחת מייל"
              descEn="Send 'Paper Ready for Review' email to user" descHe="שליחת התראה שהמאמר מוכן לביקורת" />
          </div>
        </PhaseSection>

        {/* PHASE 3 */}
        <PhaseSection 
          number={3} 
          titleEn="Credential Decryption & Gateway" 
          titleHe="פענוח הרשאות ושער הגשה" 
          gradient="from-rose-500 to-rose-700" 
          bg="bg-rose-50/50"
          isHe={isHe}
        >
          <div className="flex flex-wrap justify-center md:justify-start items-center relative">
            <NodeCard id="p3-1" type="user" icon={User} isHe={isHe}
              titleEn="20. User UI" titleHe="אישור משתמש"
              descEn="Review completed paper and click 'Approve & Submit'" descHe="סקירת המאמר ולחיצה על 'אשר והגש'" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p3-2" type="queue" icon={Zap} isHe={isHe}
              titleEn="21. Inngest Queue" titleHe="תור הגשות"
              descEn="Trigger event: 'submission/process'" descHe="טריגר לאירוע תהליך הגשה" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p3-3" type="rpa" icon={Lock} isHe={isHe}
              titleEn="22. AES-256-GCM" titleHe="פענוח נתונים"
              descEn="Decrypt user credentials from journalConnections table" descHe="פענוח הרשאות מול כתב העת" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p3-4" type="logic" icon={Settings} isDiamond={true} isHe={isHe}
              titleEn="23. Enum Routing" titleHe="ניתוב מערכת"
              descEn="Route by platform type" descHe="ניתוב לפי סוג הפלטפורמה" />
            <FlowArrow isHe={isHe} />
            <div className="w-[200px] border-2 border-dashed border-rose-300 bg-white p-4 rounded-xl text-center">
              <h4 className="font-bold text-rose-800 text-sm mb-2">{isHe ? '4 נתיבי הגשה' : '4 Submission Pathways'}</h4>
              <ul className="text-xs text-rose-600 space-y-1 text-left" dir={isHe ? 'rtl' : 'ltr'}>
                <li>• API (Fast Lane)</li>
                <li>• Email (Fast Lane)</li>
                <li>• RPA Bot (Complex Lane)</li>
              </ul>
            </div>
          </div>
        </PhaseSection>

        {/* PARALLEL PHASES CONTAINER */}
        <div className="w-full flex flex-col md:flex-row gap-6 w-full max-w-7xl relative">
          
          {/* PHASE 4A */}
          <div className="flex-1">
            <PhaseSection 
              number={4} 
              titleEn="API & Email (Fast Lanes)" 
              titleHe="נתיבי הגשה מהירים (API/Mail)" 
              gradient="from-teal-500 to-teal-700" 
              bg="bg-teal-50/50"
              isHe={isHe}
            >
              <div className="flex flex-col space-y-6">
                <div className="flex items-center">
                  <NodeCard id="p4a-1" type="rpa" icon={Globe} isHe={isHe}
                    titleEn="WordPress/OJS" titleHe="וורדפרס/OJS"
                    descEn="Execute POST requests to REST APIs" descHe="ביצוע קריאות API למערכת" />
                  <FlowArrow isHe={isHe} />
                  <NodeCard id="p4a-s1" type="success" icon={CheckCircle2} isHe={isHe}
                    titleEn="Success" titleHe="הצלחה"
                    descEn="Submission complete" descHe="ההגשה הושלמה" />
                </div>
                <div className="flex items-center">
                  <NodeCard id="p4a-2" type="rpa" icon={Globe} isHe={isHe}
                    titleEn="EditorialManager" titleHe="EditorialManager"
                    descEn="Execute API stub requests" descHe="ביצוע קריאות API" />
                  <FlowArrow isHe={isHe} />
                  <NodeCard id="p4a-s2" type="success" icon={CheckCircle2} isHe={isHe}
                    titleEn="Success" titleHe="הצלחה"
                    descEn="Submission complete" descHe="ההגשה הושלמה" />
                </div>
                <div className="flex items-center">
                  <NodeCard id="p4a-3" type="rpa" icon={Mail} isHe={isHe}
                    titleEn="EmailAdapter" titleHe="מתאם אימייל"
                    descEn="Multipart MIME → SMTP → Editor Email" descHe="שליחת מייל ישירות לעורך" />
                  <FlowArrow isHe={isHe} />
                  <NodeCard id="p4a-s3" type="success" icon={CheckCircle2} isHe={isHe}
                    titleEn="Success" titleHe="הצלחה"
                    descEn="Submission complete" descHe="ההגשה הושלמה" />
                </div>
              </div>
            </PhaseSection>
          </div>

          {/* PHASE 4B */}
          <div className="flex-1">
            <PhaseSection 
              number={4} 
              titleEn="RPA Bot (Complex Lane)" 
              titleHe="נתיב RPA אוטונומי" 
              gradient="from-purple-600 to-purple-800" 
              bg="bg-purple-50/50"
              isHe={isHe}
            >
              <div className="flex flex-col items-center">
                <NodeCard id="p4b-1" type="rpa" icon={Bot} isHe={isHe}
                  titleEn="GenericNavigator" titleHe="נווט גנרי"
                  descEn="(Playwright) Launch headless Chromium" descHe="הפעלת דפדפן אוטומטי" />
                <FlowArrow isHe={isHe} vertical />
                <NodeCard id="p4b-2" type="logic" icon={Search} isDiamond={true} isHe={isHe}
                  titleEn="DOM Found?" titleHe="אלמנטים נמצאו?"
                  descEn="Are selectors visible?" descHe="האם אלמנטים קיימים בדף?" />
                
                <div className="flex justify-center w-full relative h-32 my-2">
                   {/* Branch NO */}
                   <div className="absolute left-0 top-0 flex flex-col items-center w-1/2">
                     <span className="text-xs text-red-500 font-bold mb-1">{isHe ? 'לא' : 'No'}</span>
                     <NodeCard id="p4b-3" type="rpa" icon={Eye} isHe={isHe}
                        titleEn="Vision AI Fallback" titleHe="גיבוי ראייה ממוחשבת"
                        descEn="Claude 3.5 Sonnet → JSON {X,Y} → Click" descHe="שימוש במודל ראייה למציאת מיקום לחיצה" />
                   </div>
                   {/* Branch YES */}
                   <div className="absolute right-0 top-0 flex flex-col items-center w-1/2">
                     <span className="text-xs text-green-600 font-bold mb-1">{isHe ? 'כן' : 'Yes'}</span>
                     <NodeCard id="p4b-4" type="rpa" icon={Edit3} isHe={isHe}
                        titleEn="Fill & Upload" titleHe="הזנה והעלאה"
                        descEn="fillForm() & uploadFiles()" descHe="מילוי טפסים והעלאת קבצים" />
                   </div>
                </div>

                <FlowArrow isHe={isHe} vertical />
                
                <NodeCard id="p4b-5" type="logic" icon={Lock} isDiamond={true} isHe={isHe}
                  titleEn="Captcha/2FA?" titleHe="אימות דו-שלבי?"
                  descEn="Is human intervention needed?" descHe="האם נדרשת התערבות אנושית?" />

                <div className="flex w-full mt-4 justify-between">
                  <div className="flex flex-col items-center w-1/2">
                    <span className="text-xs text-orange-500 font-bold mb-1">{isHe ? 'כן' : 'Yes'}</span>
                    <NodeCard id="p4b-6" type="queue" icon={User} isHe={isHe}
                        titleEn="Pause & Notify" titleHe="השהיה והתראה"
                        descEn="User solves via UI → Resume" descHe="המשתמש פותר אימות בממשק" />
                  </div>
                  <div className="flex flex-col items-center w-1/2">
                    <span className="text-xs text-green-600 font-bold mb-1">{isHe ? 'לא' : 'No'}</span>
                    <NodeCard id="p4b-7" type="rpa" icon={CheckCircle2} isHe={isHe}
                        titleEn="Final Submit" titleHe="הגשה סופית"
                        descEn="Click Submit. Scrape Tracking ID." descHe="לחיצה על אישור וחילוץ מזהה מעקב" />
                  </div>
                </div>

                <FlowArrow isHe={isHe} vertical />
                <NodeCard id="p4b-8" type="db" icon={Database} isHe={isHe}
                  titleEn="Update Submissions" titleHe="עדכון סטטוס"
                  descEn="Set status: 'submitted'" descHe="עדכון סטטוס 'הוגש' במסד נתונים" />
              </div>
            </PhaseSection>
          </div>
        </div>

        {/* PHASE 5 */}
        <PhaseSection 
          number={5} 
          titleEn="Peer Review Ping-Pong (Resubmission)" 
          titleHe="פינג-פונג ביקורת עמיתים" 
          gradient="from-amber-500 to-amber-700" 
          bg="bg-amber-50/50"
          isHe={isHe}
        >
          <div className="flex flex-wrap justify-center md:justify-start items-center mb-8 relative">
            <NodeCard id="p5-1" type="queue" icon={Zap} isHe={isHe}
              titleEn="36. Webhook" titleHe="אירוע"
              descEn="Event: 'reviewer-comments-received'" descHe="קבלת הערות סוקרים" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p5-2" type="db" icon={FileText} isHe={isHe}
              titleEn="37. Fetch Manuscript" titleHe="שליפת מאמר"
              descEn="From 'paperStages' table" descHe="משיכת הטקסט ממסד הנתונים" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p5-3" type="agent" icon={Brain} isHe={isHe}
              titleEn="38. RebuttalAgent" titleHe="סוכן תגובה"
              descEn="Read critique → Generate rebuttalStrategy" descHe="ניתוח הביקורת ויצירת אסטרטגיית תגובה" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p5-4" type="db" icon={Database} isHe={isHe}
              titleEn="39. Save Strategy" titleHe="שמירת אסטרטגיה"
              descEn="To 'paperVersions' table" descHe="שמירת התכנון לגרסה הבאה" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p5-5" type="user" icon={User} isHe={isHe}
              titleEn="40. User UI" titleHe="אישור משתמש"
              descEn="Approve Rebuttal Strategy" descHe="אישור האסטרטגיה על ידי המשתמש" />
          </div>

          <div className="w-full flex justify-end md:pe-24 mb-4 hidden md:flex">
             <FlowArrow isHe={isHe} vertical />
          </div>

          <div className={`flex flex-wrap justify-center md:justify-end items-center relative ${isHe ? 'flex-row' : 'flex-row-reverse'}`}>
            <div className="border-2 border-purple-300 rounded-xl p-4 bg-purple-50 flex items-center gap-2 relative">
              <span className="absolute -top-3 left-4 bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold">41. Loop / לולאה</span>
              <div className="flex items-center">
                <Search className="w-8 h-8 text-purple-700 bg-purple-200 p-1.5 rounded-full mx-1" />
                <Code className="w-8 h-8 text-purple-700 bg-purple-200 p-1.5 rounded-full mx-1" />
                <CheckCircle className="w-8 h-8 text-purple-700 bg-purple-200 p-1.5 rounded-full mx-1" />
              </div>
              <div className="text-xs text-purple-900 font-semibold px-2">
                {isHe ? 'החלת התיקונים המבוקשים' : 'Apply requested edits'}
              </div>
            </div>
            <FlowArrow isHe={isHe} className="rotate-180" />
            <NodeCard id="p5-7" type="agent" icon={Edit3} isHe={isHe}
              titleEn="42. Generate Document" titleHe="יצירת מסמך"
              descEn="Response to Reviewers" descHe="הכנת מסמך תשובה לסוקרים" />
            <FlowArrow isHe={isHe} className="rotate-180" />
            <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 flex flex-col items-center shadow-sm">
               <RefreshCw className="w-6 h-6 text-gray-600 mb-2" />
               <span className="text-xs font-bold text-gray-700 text-center">
                 {isHe ? 'חזרה לשלב 3 (שער הגשה)' : 'Back to Phase 3 (Gateway)'}
               </span>
            </div>
          </div>
        </PhaseSection>

        {/* PHASE 6 */}
        <PhaseSection 
          number={6} 
          titleEn="Journal Cascade (Rejection Handling)" 
          titleHe="מפל כתבי עת (טיפול בדחייה)" 
          gradient="from-emerald-600 to-emerald-800" 
          bg="bg-emerald-50/50"
          isHe={isHe}
        >
          <div className="flex flex-wrap justify-center md:justify-start items-center relative">
            <NodeCard id="p6-1" type="queue" icon={Zap} isHe={isHe}
              titleEn="44. Queue Event" titleHe="אירוע דחייה"
              descEn="'processPaperRejected'" descHe="תהליך טיפול במאמר שנדחה" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p6-2" type="agent" icon={Brain} isHe={isHe}
              titleEn="45. Cascade Agent" titleHe="סוכן מפל"
              descEn="Read 'JournalCascadeMap', find next tier" descHe="מציאת כתב העת הבא ברשימת היעדים" />
            <FlowArrow isHe={isHe} />
            <NodeCard id="p6-3" type="agent" icon={Scissors} isHe={isHe}
              titleEn="46. Reformat Metadata" titleHe="עיצוב מחדש"
              descEn="Fit new journal guidelines" descHe="התאמה להנחיות כתב העת החדש" />
            <FlowArrow isHe={isHe} />
            <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 flex flex-col items-center shadow-sm mx-4">
               <RefreshCw className="w-6 h-6 text-gray-600 mb-2" />
               <span className="text-xs font-bold text-gray-700 text-center">
                 {isHe ? 'חזרה לשער ההגשה' : 'Back to Gateway'}
               </span>
            </div>
            <FlowArrow isHe={isHe} />
            <NodeCard id="p6-5" type="success" icon={CheckCircle2} isHe={isHe}
              titleEn="48. Published!" titleHe="פורסם!"
              descEn="Success! Target Journal Published" descHe="הצלחה! המאמר התקבל ופורסם" />
          </div>
        </PhaseSection>

      </div>
    </div>
  );
}
