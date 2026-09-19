"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "next-intl";
import { 
  Upload, Search, FileText, BarChart2, Eye, MessageSquare, 
  CheckCircle, Edit3, Save, ShieldCheck, Download, 
  Cpu, Database, Layers, X, Info, ArrowRight
} from "lucide-react";

// Tools Dictionary
const TOOLS_INFO: Record<string, { en: string, he: string }> = {
  "Next.js 16 UI": {
    en: "Modern React framework providing Server Components, API Routes, and optimized rendering for a fast, responsive user interface.",
    he: "פריימוורק React מתקדם המספק רינדור צד-שרת, נתיבי API וביצועים מהירים במיוחד עבור ממשק המשתמש."
  },
  "Vercel Blob": {
    en: "Serverless file storage solution used for securely uploading and retrieving raw manuscript files (PDF/Word).",
    he: "פתרון אחסון קבצים בענן המשמש להעלאה ושמירה מאובטחת של קבצי המאמרים הגולמיים (PDF/Word)."
  },
  "Inngest": {
    en: "Event-driven background job orchestration engine. Handles the long-running, multi-step agent workflows without timeouts.",
    he: "מנוע ניהול תהליכי רקע מבוסס אירועים. מנהל את זרימת העבודה הארוכה והמורכבת של הסוכנים ללא חשש מפסקי זמן (Timeouts)."
  },
  "Claude 3.5": {
    en: "Anthropic's LLM known for exceptional academic writing, nuanced editing, and maintaining a human-like scientific tone.",
    he: "מודל השפה של Anthropic המצטיין בכתיבה אקדמית, עריכה עדינה ושמירה על טון מדעי ואנושי."
  },
  "OpenAI o1": {
    en: "OpenAI's reasoning model used for deep logical evaluation, finding novel flaws, and synthesizing complex meta-decisions.",
    he: "מודל ההסקה (Reasoning) של OpenAI, משמש להערכה לוגית עמוקה, איתור כשלי מחקר, וקבלת החלטות מורכבות כ-Area Chair."
  },
  "Gemini 1.5": {
    en: "Google's LLM with a massive context window, serving as the Optimist Reviewer to find hidden strengths and synergies in the paper.",
    he: "מודל השפה של Google בעל חלון ההקשר העצום. משמש כסוקר האופטימי לאיתור חוזקות ורעיונות חיוביים נסתרים במאמר."
  },
  "pgvector": {
    en: "PostgreSQL extension for vector similarity search, enabling RAG (Retrieval-Augmented Generation) across the scientific literature database.",
    he: "הרחבה ל-PostgreSQL המאפשרת חיפוש וקטורי מבוסס דמיון. משמשת לאחזור מידע (RAG) מתוך מאגר הספרות המדעית."
  },
  "GraphRAG": {
    en: "Advanced retrieval technique using knowledge graphs to map conceptual relationships, finding cross-domain analogies for novel ideas.",
    he: "טכנולוגיית אחזור מתקדמת המשתמשת בגרף ידע למיפוי קשרים מושגיים. מסייעת במציאת אנלוגיות ורעיונות חוצי-תחומים."
  },
  "MCP": {
    en: "Model Context Protocol. Standardizes how AI agents securely access external tools like PubMed and ArXiv databases.",
    he: "פרוטוקול גישה למודלים. מספק תקן מאובטח שדרכו סוכני ה-AI מתקשרים עם כלים חיצונים כמו מאגרי PubMed ו-ArXiv."
  },
  "Vision AI": {
    en: "Multimodal AI capability used to extract data points, trends, and axes from charts, graphs, and visual figures in the paper.",
    he: "יכולת ראייה ממוחשבת (Multimodal) לחילוץ נתונים, מגמות וצירים מתוך תרשימים, גרפים וטבלאות במאמר."
  },
  "E2B Sandbox": {
    en: "Secure cloud environment for AI to write and execute Python code. Used to run SciPy for verifying statistical claims in the paper.",
    he: "סביבת ענן מאובטחת המאפשרת ל-AI להריץ קוד Python. משמשת להרצת ספריות מדעיות כמו SciPy לאימות סטטיסטי של תוצאות המחקר."
  },
  "RLHF Logs": {
    en: "Reinforcement Learning from Human Feedback. Tracks user corrections to continually align the agents' output with the author's preferences.",
    he: "מערכת למידת חיזוק ממשוב אנושי. מתעדת את התיקונים של המשתמש כדי לשפר ולהתאים את פעולת הסוכנים להעדפות הכותב."
  },
  "Tiptap & Monaco": {
    en: "Advanced rich-text and code editors embedded in the UI to allow human-in-the-loop review of the AI's exact text diffs.",
    he: "עורכי טקסט וקוד מתקדמים המשולבים בממשק המשתמש, המאפשרים למחבר לעבור על התיקונים של ה-AI בצורה נוחה (Diff)."
  },
  "Neon Postgres": {
    en: "Serverless Postgres database that scales instantly. Stores users, papers, reviews, and vector embeddings reliably.",
    he: "מסד נתונים Serverless מבוסס Postgres. שומר את נתוני המשתמשים, המאמרים, הביקורות והוקטורים בצורה אמינה ומהירה."
  },
  "react-force-graph-2d": {
    en: "Visualization library rendering the final citation map, showing how the revised paper connects to existing literature.",
    he: "ספריית תצוגה חזותית המשמשת לציור מפת הציטוטים הסופית, הממחישה כיצד המאמר המעודכן משתלב בספרות הקיימת."
  },
  "Next.js API": {
    en: "Backend API routes handling secure server-side logic, PDF generation, and external webhooks.",
    he: "נתיבי שרת מובנים המספקים טיפול בטוח בלוגיקת צד-שרת, ייצור קבצי PDF סופיים וניהול התראות."
  },
  "Nodemailer": {
    en: "Node.js module used to automatically dispatch the finalized manuscript and cover letter directly to the user's email.",
    he: "רכיב שרת האחראי על שליחת מיילים אוטומטית. שולח את המאמר הסופי ומכתב המקדים ישירות לתיבת המייל של המשתמש."
  }
};

const ARCHITECTURE_STEPS = [
  {
    id: 1,
    title: { en: "1. Document Upload", he: "1. העלאת מסמך" },
    description: { 
      en: "User uploads manuscript (PDF/Word). Next.js API Routes stream it to Vercel Blob and trigger the Inngest background engine.",
      he: "המשתמש מעלה את המאמר (PDF/Word). נתיבי ה-API מעבירים את הקובץ לאחסון מאובטח ומזנקים את תהליכי הרקע במנוע של Inngest."
    },
    icon: Upload,
    tools: ["Next.js 16 UI", "Vercel Blob", "Inngest"],
    color: "bg-cyan-50 text-cyan-700 border-cyan-200"
  },
  {
    id: 2,
    title: { en: "2. Clarification Agent", he: "2. סוכן בירור והגדרות" },
    description: { 
      en: "Interviews the user and extracts target journal constraints, word counts, and required formatting styles.",
      he: "מראיין את המשתמש ומחלץ את דרישות המגזין הרצוי, ספירת המילים המותרת וסגנונות העיצוב הנדרשים."
    },
    icon: Search,
    tools: ["Claude 3.5"],
    color: "bg-green-50 text-green-700 border-green-200"
  },
  {
    id: 3,
    title: { en: "3. Planning Agent", he: "3. סוכן תכנון" },
    description: { 
      en: "Drafts a high-level revision strategy, identifying logical flaws and planning structural improvements.",
      he: "מגבש אסטרטגיית שכתוב ברמת-על, מזהה כשלי לוגיקה ומתכנן שיפורים מבניים במסמך."
    },
    icon: FileText,
    tools: ["Claude 3.5"],
    color: "bg-green-50 text-green-700 border-green-200"
  },
  {
    id: 4,
    title: { en: "4. Knowledge Agent", he: "4. סוכן ידע וספרות" },
    description: { 
      en: "Connects to PubMed/ArXiv via Model Context Protocol (MCP) to retrieve external literature and cross-domain analogies using GraphRAG.",
      he: "מתחבר למאגרי מידע חיצוניים (PubMed/ArXiv) בעזרת פרוטוקול MCP, ושולף ספרות מקצועית ואנלוגיות חוצי-תחומים באמצעות GraphRAG."
    },
    icon: Database,
    tools: ["pgvector", "GraphRAG", "MCP"],
    color: "bg-green-50 text-green-700 border-green-200"
  },
  {
    id: 5,
    title: { en: "5. Visual & Data Verification", he: "5. אימות נתונים ותרשימים" },
    description: { 
      en: "Parses charts from the PDF using Vision AI. Pipes raw numerical data into an E2B Python Sandbox to run SciPy statistical verifications.",
      he: "מחלץ נתונים מתוך הגרפים שבמאמר באמצעות Vision AI, ומזין אותם לסביבת E2B Python כדי להריץ בדיקות סטטיסטיות לאימות הטענות במאמר."
    },
    icon: BarChart2,
    tools: ["Vision AI", "E2B Sandbox"],
    color: "bg-orange-50 text-orange-700 border-orange-200"
  },
  {
    id: 6,
    title: { en: "6. Scientific Review Debate", he: "6. עימות סוקרים מדעי (Debate)" },
    description: { 
      en: "A parallel multi-agent debate (Vercel AI SDK). Harsh Reviewer (Claude), Novelty Reviewer (o1), and Optimist Reviewer (Gemini) debate the paper's merits.",
      he: "דיון סוקרים מקביל המדמה ועידה מדעית. סוקר קשוח (Claude), סוקר חדשנות (o1), וסוקר אופטימי (Gemini) מבקרים את המאמר מזוויות שונות."
    },
    icon: MessageSquare,
    tools: ["Claude 3.5", "OpenAI o1", "Gemini 1.5"],
    color: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    id: 7,
    title: { en: "7. Area Chair Meta-Agent", he: "7. סוכן-על (Area Chair)" },
    description: { 
      en: "Synthesizes the parallel reviews into a final concrete rebuttal and action plan using deep logical reasoning.",
      he: "מסכם את ביקורות הסוקרים לתוכנית פעולה אחידה (Action Plan) וקובע אילו תיקונים יתבצעו בפועל תוך שימוש בהסקה לוגית עמוקה."
    },
    icon: Layers,
    tools: ["OpenAI o1", "RLHF Logs"],
    color: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    id: 8,
    title: { en: "8. Academic Writing Agent", he: "8. סוכן כתיבה ועריכה" },
    description: { 
      en: "Rewrites and edits the text based on the Area Chair's decisions, ensuring a standard academic tone and removing 'AI-style' language.",
      he: "משכתב ועורך את הטקסט בהתבסס על החלטות סוכן העל. מוודא שהטון אקדמי ותקני, ומסיר ביטויים רובוטיים אופייניים ל-AI."
    },
    icon: Edit3,
    tools: ["Claude 3.5"],
    color: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: 9,
    title: { en: "9. Execution Agent", he: "9. סוכן ביצוע והטמעה" },
    description: { 
      en: "Applies the line-by-line Diff changes to the manuscript. Populates the Tiptap/Monaco UI so the user can see exact modifications.",
      he: "מיישם את השינויים סעיף-אחר-סעיף על המסמך, ומזין את הממשק החזותי כך שהמשתמש יוכל לראות במדויק מה נמחק ומה התווסף."
    },
    icon: Save,
    tools: ["Tiptap & Monaco", "Neon Postgres"],
    color: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: 10,
    title: { en: "10. QA Agent", he: "10. סוכן בקרת איכות (QA)" },
    description: { 
      en: "Final consistency checks. Scans for plagiarism, reference formatting, and generates the final citation visual map.",
      he: "בדיקת עקביות סופית. סורק פלגיאט, מוודא תקינות ציטוטים ומייצר את מפת הקשרים החזותית של הספרות המקצועית."
    },
    icon: ShieldCheck,
    tools: ["react-force-graph-2d", "Claude 3.5"],
    color: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: 11,
    title: { en: "11. Compilation & Export", he: "11. הפקה וייצוא סופי" },
    description: { 
      en: "Packages the final approved version into Word/PDF, generates a Cover Letter, and emails the user.",
      he: "אורז את הגרסה הסופית לקובץ Word/PDF, מייצר מכתב פנייה למגזין (Cover Letter), ושולח הכל למשתמש."
    },
    icon: Download,
    tools: ["Next.js API", "Nodemailer"],
    color: "bg-cyan-50 text-cyan-700 border-cyan-200"
  }
];

export default function ArchitectureInteractivePage() {
  const [activeStep, setActiveStep] = useState(1);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const locale = useLocale() as 'en' | 'he';
  const isHe = locale === 'he';

  const stepData = ARCHITECTURE_STEPS.find(s => s.id === activeStep) || ARCHITECTURE_STEPS[0];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-8 text-start">
        <h1 className="text-3xl font-bold text-slate-800">
          {isHe ? 'ארכיטקטורת מערכת' : 'System Architecture'}
        </h1>
        <p className="text-slate-500 mt-2">
          {isHe 
            ? 'סייר בצורה אינטראקטיבית ב-11 שלבי האלגוריתם והתשתית של PublishAI. לחץ על הכלים והסוכנים למידע נוסף.' 
            : 'Interactive exploration of the PublishAI 11-Step Algorithm & Infrastructure. Click on tools and agents for more info.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Sidebar: Stepper */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 max-h-[85vh] overflow-y-auto">
          <h2 className="font-semibold text-slate-700 mb-4 px-2 uppercase text-sm tracking-wider text-start">
            {isHe ? '11 שלבי הצינור (Pipeline)' : 'The 11-Step Pipeline'}
          </h2>
          <div className="space-y-2">
            {ARCHITECTURE_STEPS.map((step) => {
              const isActive = step.id === activeStep;
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    setActiveStep(step.id);
                    setSelectedTool(null);
                  }}
                  className={`w-full text-start flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? "bg-slate-800 text-white shadow-md transform scale-[1.02]" 
                      : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <div className={`p-2 rounded-lg shrink-0 ${isActive ? "bg-white/20" : step.color.split(' ')[0]}`}>
                    <step.icon className={`w-5 h-5 ${isActive ? "text-white" : step.color.split(' ')[1]}`} />
                  </div>
                  <span className="font-medium text-sm leading-tight flex-1">{step.title[locale]}</span>
                  {isActive && <ArrowRight className={`w-4 h-4 shrink-0 opacity-70 ${isHe ? 'rotate-180' : ''}`} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content: Details */}
        <div className="lg:col-span-2 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: isHe ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isHe ? 20 : -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 md:p-10 min-h-[500px] flex flex-col"
            >
              <div className="flex items-start gap-6 mb-8 text-start">
                <div className={`p-4 rounded-2xl shrink-0 ${stepData.color.split(' ')[0]}`}>
                  <stepData.icon className={`w-12 h-12 ${stepData.color.split(' ')[1]}`} />
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-800 mb-3">{stepData.title[locale]}</h2>
                  <p className="text-slate-600 leading-relaxed text-lg">{stepData.description[locale]}</p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-5 text-start">
                  {isHe ? 'טכנולוגיות וסוכנים (לחץ למידע)' : 'Technologies & Agents (Click for info)'}
                </h3>
                <div className="flex flex-wrap gap-3">
                  {stepData.tools.map((tool, idx) => {
                    const isSelected = selectedTool === tool;
                    return (
                      <button 
                        key={idx} 
                        onClick={() => setSelectedTool(isSelected ? null : tool)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full border bg-opacity-10 text-sm font-bold transition-all
                          ${tool.includes("Claude") || tool.includes("OpenAI") || tool.includes("Gemini") ? "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200" : ""}
                          ${tool.includes("Neon") || tool.includes("pgvector") || tool.includes("Blob") ? "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200" : ""}
                          ${tool.includes("Next") || tool.includes("Inngest") ? "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200" : ""}
                          ${!tool.includes("Claude") && !tool.includes("OpenAI") && !tool.includes("Gemini") && !tool.includes("Neon") && !tool.includes("pgvector") && !tool.includes("Blob") && !tool.includes("Next") && !tool.includes("Inngest") ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200" : ""}
                          ${isSelected ? "ring-2 ring-offset-2 ring-slate-400 scale-105 shadow-sm" : ""}
                        `}
                      >
                        <Cpu className="w-4 h-4 opacity-80" />
                        <span dir="ltr">{tool}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tool Explanation Panel */}
              <AnimatePresence>
                {selectedTool && TOOLS_INFO[selectedTool] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 32 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 relative">
                      <button 
                        onClick={() => setSelectedTool(null)}
                        className={`absolute top-3 ${isHe ? 'left-3' : 'right-3'} p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                          <Info className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-slate-800 text-lg" dir="ltr">{selectedTool}</h4>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-start pe-6">
                        {TOOLS_INFO[selectedTool][locale]}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
