"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "next-intl";
import { 
  Upload, Search, FileText, BarChart2, Eye, MessageSquare, 
  CheckCircle, Edit3, Save, ShieldCheck, Download, 
  Cpu, Database, Layers, X, Info, ArrowRight, BookOpen, Scissors, ListChecks, RefreshCw, GitMerge, FileCheck
, Terminal, Share2, Globe} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

// Tools Dictionary
const TOOLS_INFO: Record<string, { en: string, he: string, prompt?: { en: string, he: string } }> = {
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
    en: "Anthropic's language model, excelling in academic writing, nuanced editing, and maintaining a scientific yet human tone.",
    he: "מודל השפה של Anthropic המצטיין בכתיבה אקדמית, עריכה עדינה ושמירה על טון מדעי ואנושי."
  },
  "GPT-4o": {
    en: "OpenAI's flagship fast multimodal model, serving as a dynamic and deeply analytical reviewer in the multi-agent debate.",
    he: "מודל מהיר של OpenAI המשמש כסוקר דינמי ומעמיק בפאנל הדיבייט (עימות הסוקרים) המרובה-סוכנים."
  },
  "OpenAI o1": {
    en: "OpenAI's advanced reasoning model, taking the role of 'Area Chair' to synthesize complex debate and make final editorial calls.",
    he: "מודל ההסקה הלוגית של OpenAI, מתפקד כ'סוקר-על' המסנתז את הדיבייט ומקבל את החלטות העריכה הסופיות."
  },
  "Gemini 1.5": {
    en: "Google's LLM with a massive context window, serving as the Optimist Reviewer to find hidden strengths and synergies in the paper.",
    he: "מודל השפה של Google בעל חלון ההקשר העצום. משמש כסוקר האופטימי לאיתור חוזקות ורעיונות חיוביים נסתרים במאמר.",
    prompt: {
      en: "You are a visionary research scientist synthesizing prior literature and exploring novel connections. With your vast context window, analyze the entire manuscript to identify consensus, methodological synergies, hidden strengths, and open research gaps. Find the 'silver lining' in complex data and suggest ways to amplify the paper's novelty and broader impact.",
      he: "אתה חוקר בעל חזון שמסנתז ספרות קודמת וחוקר קשרים חדשניים. בעזרת חלון ההקשר העצום שלך, נתח את המאמר בשלמותו לזיהוי סינרגיות, חוזקות נסתרות ופערים מחקריים. מצא את נקודות האור בנתונים מורכבים והצע דרכים להעצים את החדשנות וההשפעה הרחבה של המאמר כדי שיבלוט בפני העורכים."
    }
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
  },
  "Puppeteer": {
    en: "A Node library which provides a high-level API to control Chrome or Chromium over the DevTools Protocol. Used here as an alternative automation driver.",
    he: "ספריית Node לשליטה בדפדפן Chrome דרך פרוטוקול DevTools. משמשת כאן כמנוע אוטומציה חלופי."
  },
  "Node.js": {
    en: "JavaScript runtime built on Chrome's V8 JavaScript engine. Executes the RPA bot scripts on the server.",
    he: "סביבת ריצה ל-JavaScript המאפשרת הרצת סקריפטים של סוכני ה-RPA בשרת."
  },
  "Playwright": {
    en: "End-to-end testing and browser automation library used to scrape journal submission websites.",
    he: "הספריה שמחליפה את ה-API הרגיל בשלב של גירוד (Scraping) חוקי ההגשה מאתרי המגזינים."
  },
  "PDF Parser": {
    en: "Utility for reliably extracting structured text and reviewer comments from uploaded decision letters (R&R) via pdf-parse.",
    he: "כלי לשליפה ופיענוח טקסט מובנה והערות סוקרים מתוך קבצי PDF (באמצעות pdf-parse)."
  },
  "Drizzle ORM": {
    en: "Lightweight and highly performant TypeScript ORM used to interact safely with Neon Postgres.",
    he: "כלי גישה למסד הנתונים ששומר את הביקורות והמשתמשים בצורה בטוחה."
  },
  "Stripe Billing": {
    en: "Payment processing infrastructure handling subscriptions and one-off payments for document generation.",
    he: "מערכת הסליקה לחיוב על הפקת מאמרים / מנויים בסוף שלב 1."
  },
  "Vercel AI SDK": {
    en: "AI SDK used to handle real-time streaming of text from the AI providers.",
    he: "אחראי על ניהול הזרמת הטקסט בזמן אמת (Streaming) בשלבי הבירור ועימות הסוקרים."
  },
  "LangChain & LangGraph": {
    en: "Infrastructure for AI agents that handles text chunking and memory chains.",
    he: "תשתית סוכני ה-AI שדואגת לפיצול הטקסט ולבניית שרשרת זיכרון לסוכנים."
  },
  "NextAuth.js": {
    en: "Authentication solution that manages user logins and account security.",
    he: "פתרון ההזדהות שמנהל את כניסת המשתמשים ואבטחת החשבונות."
  },
  "Upstash Redis": {
    en: "System cache, also used to prevent server overload (Rate Limiting) during file uploads.",
    he: "מערכת ה-Cache של המערכת, משמשת גם כדי למנוע עומס (Rate Limiting) על השרתים בזמן העלאת קבצים."
  },
  "Mammoth & Docx": {
    en: "Tools that parse word files initially and generate styled word files at the end.",
    he: "הכלים שמפענחים את קבצי הוורד (.docx) בהתחלה ובסוף התהליך בונים קובץ וורד מעוצב מאפס."
  },
  "Recharts": {
    en: "Charting library that generates the statistics and dashboards.",
    he: "ספריית התרשימים שמייצרת את הסטטיסטיקות והדשבורדים בתשתיות המערכת."
  }
};

const PHASES = [
  { id: 1, title: { en: "Phase 1: Core Revision", he: "שלב 1: ליבת השכתוב" } },
  { id: 2, title: { en: "Phase 2: Journal Connection", he: "שלב 2: התחברות לעיתון" } },
  { id: 3, title: { en: "Phase 3: Peer Review Iteration", he: "שלב 3: פינג-פונג תיקונים" } },
  { id: 4, title: { en: "Global: Infra & UI", he: "תשתיות רוחביות" } }
];

const ARCHITECTURE_STEPS = [
  // PHASE 1
  {
    id: 1, phase: 1,
    title: { en: "1. Document Upload", he: "1. העלאת מסמך" },
    description: { 
      en: "User uploads manuscript (PDF/Word). Next.js API Routes stream it to Vercel Blob and trigger the Inngest background engine.",
      he: "המשתמש מעלה את המאמר (PDF/Word). נתיבי ה-API מעבירים את הקובץ לאחסון מאובטח ומזנקים את תהליכי הרקע במנוע של Inngest."
    },
    icon: Upload, tools: ["Next.js 16 UI", "Vercel Blob", "Inngest", "Mammoth & Docx", "PDF Parser", "Upstash Redis", "LangChain & LangGraph"],
    color: "bg-cyan-50 text-cyan-700 border-cyan-200"
  },
  {
    id: 2, phase: 1,
    title: { en: "2. Clarification Agent", he: "2. סוכן בירור והגדרות" },
    description: { 
      en: "Interviews the user and extracts target journal constraints, word counts, and required formatting styles.",
      he: "מראיין את המשתמש ומחלץ את דרישות המגזין הרצוי, ספירת המילים המותרת וסגנונות העיצוב הנדרשים."
    },
    prompt: { 
      en: "You are an expert academic editor. Analyze the academic text provided and extract: 1. The main thesis / objective. 2. The primary field of study. 3. Any obvious missing sections (e.g., no Conclusion).", 
      he: "אתה עורך אקדמי מומחה. עליך לנתח את הטקסט האקדמי ולחלץ מתוכו: 1. את התזה המרכזית / המטרה. 2. את תחום המחקר העיקרי. 3. כל חסר בולט של חלקים במאמר (כגון היעדר מסקנות)." 
    },
    icon: Search, tools: ["Claude 3.5", "Vercel AI SDK"],
    color: "bg-green-50 text-green-700 border-green-200"
  },
  {
    id: 3, phase: 1,
    title: { en: "3. Planning Agent", he: "3. סוכן תכנון" },
    description: { 
      en: "Drafts a high-level revision strategy, identifying logical flaws and planning structural improvements.",
      he: "מגבש אסטרטגיית שכתוב ברמת-על, מזהה כשלי לוגיקה ומתכנן שיפורים מבניים במסמך."
    },
    prompt: { 
      en: "You are an expert academic planner. Based on the clarification analysis and the manuscript, create a structural revision plan for this paper. Identify weaknesses, required citations, and sections to rewrite.", 
      he: "אתה מתכנן אקדמי מומחה. בהתבסס על ניתוח הבירור והמאמר שהוזן, צור תוכנית שכתוב מבנית עבור מאמר זה. עליך לזהות חולשות, ציטוטים חסרים נדרשים ופסקאות שדורשות שכתוב." 
    },
    icon: FileText, tools: ["Claude 3.5"],
    color: "bg-green-50 text-green-700 border-green-200"
  },
  {
    id: 4, phase: 1,
    title: { en: "4. Knowledge Agent", he: "4. סוכן ידע וספרות" },
    description: { 
      en: "Connects to PubMed/ArXiv via Model Context Protocol (MCP) to retrieve external literature and cross-domain analogies using GraphRAG.",
      he: "מתחבר למאגרי מידע חיצוניים (PubMed/ArXiv) בעזרת פרוטוקול MCP, ושולף ספרות מקצועית ואנלוגיות חוצי-תחומים באמצעות GraphRAG."
    },
    prompt: { 
      en: "Extract 3 main search queries for academic literature based on this text. Output ONLY the 3 queries, separated by commas, with no additional text, numbering, or formatting.", 
      he: "חלץ 3 שורות חיפוש עיקריות לספרות אקדמית בהתבסס על הטקסט. פלוט *אך ורק* את 3 שורות החיפוש, מופרדות בפסיקים, ללא טקסט נוסף, מספור או עיצוב כלשהו." 
    },
    icon: Database, tools: ["Claude 3.7", "pgvector", "GraphRAG", "MCP", "LangChain & LangGraph"],
    color: "bg-green-50 text-green-700 border-green-200"
  },
  {
    id: 5, phase: 1,
    title: { en: "5. Visual & Data Verification", he: "5. אימות נתונים ותרשימים" },
    description: { 
      en: "Parses charts from the PDF using Vision AI. Pipes raw numerical data into an E2B Python Sandbox to run SciPy statistical verifications.",
      he: "מחלץ נתונים מתוך הגרפים שבמאמר באמצעות Vision AI, ומזין אותם לסביבת E2B Python כדי להריץ בדיקות סטטיסטיות לאימות הטענות במאמר."
    },
    prompt: { 
      en: "Generate a simulated peer-review report for this final manuscript provided.", 
      he: "צור דוח הדמיה של ביקורת עמיתים (Peer Review) עבור גרסת המאמר הסופית שהוזנה." 
    },
    icon: BarChart2, tools: ["Claude 3.7", "Vision AI", "E2B Sandbox"],
    color: "bg-orange-50 text-orange-700 border-orange-200"
  },
  {
    id: 6, phase: 1,
    title: { en: "6. Scientific Review Debate", he: "6. עימות סוקרים מדעי (Debate)" },
    description: { 
      en: "A parallel multi-agent debate (Vercel AI SDK). Harsh Reviewer (Claude), Analytical Reviewer (GPT-4o), and Optimist Reviewer (Gemini) debate the paper's merits.",
      he: "דיון סוקרים מקביל המדמה ועידה מדעית. סוקר קשוח (Claude), סוקר אנליטי (GPT-4o), וסוקר אופטימי (Gemini) מבקרים את המאמר מזוויות שונות."
    },
    icon: MessageSquare, tools: ["Claude 3.5", "GPT-4o", "Gemini 1.5", "Vercel AI SDK"],
    color: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    id: 7, phase: 1,
    title: { en: "7. Area Chair Meta-Agent", he: "7. סוכן-על (Area Chair)" },
    description: { 
      en: "Synthesizes the parallel reviews into a final concrete rebuttal and action plan using deep logical reasoning (OpenAI o1).",
      he: "מסכם את ביקורות מועצת הסוקרים לתוכנית פעולה אחידה (Action Plan) וקובע אילו תיקונים יתבצעו בפועל תוך שימוש בהסקה לוגית עמוקה של OpenAI o1."
    },
    icon: Layers, tools: ["OpenAI o1", "RLHF Logs", "Drizzle ORM"],
    color: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    id: 8, phase: 1,
    title: { en: "8. Academic Writing Agent", he: "8. סוכן כתיבה ועריכה" },
    description: { 
      en: "Rewrites and edits the text based on the Area Chair's decisions, ensuring a standard academic tone and removing 'AI-style' language.",
      he: "משכתב ועורך את הטקסט בהתבסס על החלטות סוכן העל. מוודא שהטון אקדמי ותקני, ומסיר ביטויים רובוטיים אופייניים ל-AI."
    },
    prompt: { 
      en: "Rewrite the text to elevate the academic tone, address the following review feedback, and remove any generic AI-sounding phrases.", 
      he: "שכתב את הטקסט כדי להעלות את המשלב האקדמי שלו, לטפל במשוב מהביקורת, ולהסיר כל ביטוי גנרי שנשמע כאילו נכתב על ידי AI." 
    },
    icon: Edit3, tools: ["Claude 3.5"],
    color: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
id: 9, phase: 1,
    title: { en: "9. Execution Agent", he: "9. סוכן ביצוע והטמעה" },
    description: { 
      en: "Applies the line-by-line Diff changes to the manuscript. Populates the Tiptap/Monaco UI so the user can see exact modifications.",
      he: "מיישם את השינויים סעיף-אחר-סעיף על המסמך, ומזין את הממשק החזותי כך שהמשתמש יוכל לראות במדויק מה נמחק ומה התווסף."
    },
    prompt: { 
      en: "Create a structured summary of the changes made between the original manuscript and the rewritten version.",
      he: "צור סיכום מובנה של השינויים שבוצעו בין כתב היד המקורי לגרסה המשוכתבת."
    },
    icon: Save, tools: ["Claude 3 Opus", "Tiptap & Monaco", "Neon Postgres", "Drizzle ORM"],
    color: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: 10, phase: 1,
    title: { en: "10. QA Agent", he: "10. סוכן בקרת איכות (QA)" },
    description: { 
      en: "Final consistency checks. Scans for plagiarism, reference formatting, and generates the final citation visual map.",
      he: "בדיקת עקביות סופית. סורק פלגיאט, מוודא תקינות ציטוטים ומייצר את מפת הקשרים החזותית של הספרות המקצועית."
    },
    prompt: { 
      en: "Check the academic text provided for spelling errors, inconsistency, and unreferenced figures/tables.", 
      he: "בדוק את הטקסט האקדמי שהוזן וחפש שגיאות כתיב, חוסר עקביות ותרשימים/טבלאות שאינם מצוטטים בגוף הטקסט." 
    },
    icon: ShieldCheck, tools: ["react-force-graph-2d", "Claude 3.5"],
    color: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: 11, phase: 1,
    title: { en: "11. Compilation & Export", he: "11. הפקה וייצוא סופי" },
    description: { 
      en: "Packages the final approved version into Word/PDF, generates a Cover Letter, and emails the user.",
      he: "אורז את הגרסה הסופית לקובץ Word/PDF, מייצר מכתב פנייה למגזין (Cover Letter), ושולח הכל למשתמש."
    },
    prompt: { 
      en: "You are an academic editor. Write a professional cover letter for the following manuscript being submitted to the journal. Ensure it follows this structure: 1. Address the Editor in Chief. 2. State the title of the manuscript and intent to submit. 3. Briefly highlight the main findings and significance. 4. Confirm it has not been published elsewhere. 5. Provide contact info.", 
      he: "אתה עורך אקדמי. כתוב מכתב מקדים (Cover Letter) מקצועי עבור המאמר המוגש לכתב העת. עליך לוודא שהוא עוקב אחר המבנה הבא: 1. פנייה לעורך הראשי. 2. ציון כותרת המאמר. 3. הדגשה של הממצאים העיקריים והחשיבות. 4. אישור שהמאמר לא פורסם בשום מקום אחר. 5. פרטי התקשרות." 
    },
    icon: Download, tools: ["Claude 3.7", "Next.js API", "Mammoth & Docx", "Nodemailer", "Stripe Billing"],
    color: "bg-cyan-50 text-cyan-700 border-cyan-200"
  },
  
  // PHASE 2
  {
    id: 12, phase: 2,
    title: { en: "12. Journal Target Selection", he: "12. בחירת עיתון יעד" },
    description: { 
      en: "System maps the journal URL provided by the user and verifies access to scrape submission guidelines.",
      he: "המערכת ממפה את קישור העיתון שסיפק המשתמש, ומוודאת יכולת גישה לשאיבת הנחיות ההגשה הרשמיות."
    },
    icon: BookOpen, tools: ["Playwright", "Next.js API"],
    color: "bg-pink-50 text-pink-700 border-pink-200"
  },
  {
    id: 13, phase: 2,
    title: { en: "13. Guideline Extraction", he: "13. שליפת חוקים והנחיות" },
    description: { 
      en: "Agent extracts explicit formatting rules, word limits, citation styles, and mandatory sections into structured JSON.",
      he: "סוכן AI מנתח את הדף ושולף את כל חוקי העיצוב (מגבלת מילים, סגנון ציטוט, חלקי מאמר חובה) וממיר ל-JSON מובנה."
    },
    prompt: {
      en: "Extract the formatting guidelines from the provided journal webpage. Return a structured JSON containing word limits, mandatory sections, and citation style rules.",
      he: "חלץ את הנחיות העיצוב מתוך דף כתב העת שסופק. החזר JSON מובנה המכיל את מגבלות המילים, חלקי החובה וכללי סגנון הציטוט."
    },
    icon: Search, tools: ["Claude 3.5", "Neon Postgres", "Drizzle ORM"],
    color: "bg-pink-50 text-pink-700 border-pink-200"
  },
  {
    id: 14, phase: 2,
    title: { en: "14. Manuscript Formatting", he: "14. התאמת פורמט" },
    description: { 
      en: "The manuscript is refactored to perfectly match the target journal's specific structure and citation requirements.",
      he: "המאמר משוכתב ומסודר מחדש בהתאמה מושלמת למבנה, לאורך ולסגנון הציטוטים הספציפי שדורש עיתון היעד."
    },
    prompt: {
      en: "Reformat the provided manuscript to adhere strictly to the target journal guidelines (JSON). Adjust headings, references, and spacing without altering the core scientific meaning.",
      he: "עצב מחדש את כתב היד המצורף כך שיעמוד בקפדנות בהנחיות כתב העת (JSON). התאם כותרות, הפניות וריווח מבלי לשנות את המשמעות המדעית."
    },
    icon: Scissors, tools: ["Claude 3.5", "Tiptap & Monaco"],
    color: "bg-pink-50 text-pink-700 border-pink-200"
  },
  {
    id: 15, phase: 2,
    title: { en: "15. Compliance Validation", he: "15. אימות עמידה בדרישות" },
    description: { 
      en: "Automated checklist runs pre-submission logic to ensure no rule of the journal is violated.",
      he: "רשימת תיוג (Checklist) אוטומטית המאמתת לפני ההגשה שאף חוק של העיתון לא הופר (למשל חריגה במילים בתקציר)."
    },
    prompt: {
      en: "Cross-reference the formatted manuscript against the journal\'s formal guidelines. Perform a rigorous step-by-step checklist validation and report any missing compliance items.",
      he: "הצלב את כתב היד המעוצב אל מול ההנחיות הרשמיות של כתב העת. בצע אימות קפדני לפי רשימת תיוג ודווח על כל סעיף שאינו עומד בדרישות."
    },
    icon: ListChecks, tools: ["OpenAI o1"],
    color: "bg-pink-50 text-pink-700 border-pink-200"
  },

  {
    id: 16, phase: 2,
    title: { en: "16. Automated Submission (RPA)", he: "16. הגשה אוטומטית (RPA)" },
    description: { 
      en: "A Robotic Process Automation (RPA) bot powered by Playwright navigates the target journal's submission portal, fills out metadata, uploads the manuscript, and pauses for human CAPTCHA solving if required.",
      he: "סוכן אוטומציה (RPA) מבוסס Playwright מנווט אל מערכת ההגשה של כתב העת, ממלא את המטא-דאטה (Metadata), מעלה את המאמר, ועוצר ומחכה שהמשתמש יפתור CAPTCHA במידת הצורך."
    },
    prompt: {
      en: "Navigate to the Editorial Manager portal. Fill out the author details, upload manuscript.pdf, extract the CAPTCHA image and wait for user resolution.",
      he: "נווט למערכת ההגשה של כתב העת (לדוגמה: Editorial Manager). מלא את פרטי המחברים, העלה את קובץ המאמר, חלץ את תמונת ה-CAPTCHA והמתן לפתרון על ידי המשתמש האנושי."
    },
    icon: Globe, tools: ["Playwright", "Puppeteer", "Node.js"],
    color: "bg-teal-50 text-teal-700 border-teal-200"
  },
  // PHASE 3
  {
    id: 17, phase: 3,
    title: { en: "17. Feedback Ingestion", he: "17. קליטת ביקורת (R&R)" },
    description: { 
      en: "User uploads the rejection/revision letter from the human peer reviewers at the journal.",
      he: "המשתמש מעלה את מכתב הביקורת והדחייה (Revise and Resubmit) שקיבל מהסוקרים האנושיים בעיתון היעד."
    },
    icon: Upload, tools: ["PDF Parser", "Mammoth & Docx", "Vercel Blob"],
    color: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: 18, phase: 3,
    title: { en: "18. Comment Breakdown", he: "18. פירוק והבנת הערות" },
    description: { 
      en: "Agent parses the unstructured letter into individual, actionable critiques categorized by severity.",
      he: "הסוכן מנתח את המכתב (שלרוב אינו מובנה), ומפרק אותו להערות בודדות ברות-פעולה, המחולקות לפי רמת קריטיות."
    },
    icon: GitMerge, tools: ["Claude 3.5", "Vercel AI SDK"],
    color: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: 19, phase: 3,
    title: { en: "19. Rebuttal Strategy", he: "19. אסטרטגיית מענה" },
    description: { 
      en: "Area Chair formulates a strategy for addressing each comment, identifying which require text changes vs. which just need a solid counter-argument.",
      he: "סוכן-העל מנסח אסטרטגיית תגובה לכל הערה: מחליט אילו הערות דורשות שינוי ממשי במאמר ואילו דורשות רק נימוק-נגד משכנע."
    },
    prompt: { 
      en: "You are a senior academic editor. The author has received reviewer comments. To enhance the creativity and robustness of the rebuttal, consider cross-domain analogies. Generate a \'Response to Reviewers\' strategy document proposing clear, actionable changes. Format as: 1. Reviewer\'s Point 2. Proposed Change 3. Draft Rebuttal Text.", 
      he: "אתה עורך אקדמי בכיר. המחבר קיבל הערות מסוקרים. כדי לשפר את היצירתיות והחוסן של מכתב התגובה, היעזר באנלוגיות חוצות-תחומים. צור מסמך אסטרטגיה של \'תגובה לסוקרים\' ובו שינויים ברורים ויישומים. עצב זאת כ: 1. נקודת הביקורת 2. השינוי המוצע למאמר 3. טיוטת טקסט התגובה (מה להגיד לסוקר)." 
    },
    icon: RefreshCw, tools: ["OpenAI o1", "GraphRAG"],
    color: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: 20, phase: 3,
    title: { en: "20. Directed Revision", he: "20. שכתוב ממוקד" },
    description: { 
      en: "Execution Agent selectively edits only the relevant paragraphs in the manuscript to address the critiques.",
      he: "סוכן הביצוע ניגש ישירות לפסקאות הרלוונטיות במאמר ועורך אך ורק אותן כדי לספק את דרישות הסוקרים (מבלי להרוס את השאר)."
    },
    prompt: {
      en: "Implement the required changes in the manuscript according to the Rebuttal Strategy Document. Maintain the academic tone and ensure the edits directly address the reviewers\' concerns.",
      he: "יישם את השינויים הנדרשים במאמר בהתאם למסמך אסטרטגיית התגובה. שמור על המשלב האקדמי וודא שהעריכה נותנת מענה ישיר לחששות הסוקרים."
    },
    icon: Edit3, tools: ["Claude 3.5", "Tiptap & Monaco"],
    color: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: 21, phase: 3,
    title: { en: "21. Rebuttal Letter Generation", he: "21. הפקת מכתב תגובה" },
    description: { 
      en: "Generates a formal point-by-point rebuttal letter demonstrating to the editors exactly how their comments were addressed.",
      he: "מפיק מכתב תגובה רשמי (Point-by-point Rebuttal) שמדגים לעורכי העיתון בדיוק כיצד המאמר תוקן בהתאם לכל אחת מהערותיהם."
    },
    prompt: {
      en: "Draft the official \'Response to Reviewers\' letter. For each point, copy the original reviewer comment and provide our polite, detailed explanation of how the manuscript was amended.",
      he: "נסח את מכתב ה\'תגובה לסוקרים\' הרשמי. עבור כל נקודה, העתק את הערת הסוקר המקורית וספק את ההסבר המנומס והמפורט שלנו כיצד תוקן המאמר."
    },
    icon: FileCheck, tools: ["Next.js API", "Claude 3.5", "Mammoth & Docx"],
    color: "bg-amber-50 text-amber-700 border-amber-200"
  },
  
  // GLOBAL INFRASTRUCTURE
  {
    id: 21, phase: 4,
    title: { en: "Security & Authentication", he: "אבטחה והזדהות" },
    description: { 
      en: "Global security layers ensuring protected access to manuscripts and user accounts.",
      he: "שכבות אבטחה גלובליות המבטיחות גישה מוגנת למאמרים ולחשבונות המשתמשים."
    },
    icon: ShieldCheck, tools: ["NextAuth.js", "Upstash Redis", "Neon Postgres"],
    color: "bg-slate-100 text-slate-700 border-slate-200"
  },
  {
    id: 22, phase: 4,
    title: { en: "Data Analytics & UI", he: "ממשק משתמש וסטטיסטיקות" },
    description: { 
      en: "Admin and user dashboards featuring rich visualizations of agent performance and processing history.",
      he: "מסכי ניהול ומשתמש הכוללים ייצוג חזותי עשיר של ביצועי הסוכנים והיסטוריית העיבוד."
    },
    icon: BarChart2, tools: ["Next.js 16 UI", "Recharts", "Neon Postgres", "Drizzle ORM"],
    color: "bg-slate-100 text-slate-700 border-slate-200"
  }
];

export default function ArchitectureClient({ isAdmin }: { isAdmin: boolean }) {
  const [activePhase, setActivePhase] = useState(1);
  const [activeStep, setActiveStep] = useState(1);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  
  const [copied, setCopied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/${locale}/architecture`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };
  
  const locale = useLocale() as 'en' | 'he';
  const isHe = locale === 'he';

  // Filter steps by active phase
  const currentPhaseSteps = ARCHITECTURE_STEPS.filter(s => s.phase === activePhase);
  const stepData = ARCHITECTURE_STEPS.find(s => s.id === activeStep) || currentPhaseSteps[0];

  // Auto-select first step when phase changes
  const handlePhaseChange = (phaseId: number) => {
    setActivePhase(phaseId);
    const firstStepInPhase = ARCHITECTURE_STEPS.find(s => s.phase === phaseId);
    if (firstStepInPhase) setActiveStep(firstStepInPhase.id);
    setSelectedTool(null);
  };

  return (
    <DashboardLayout isAdmin={isAdmin} showSidebar={isAdmin}>
      <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-8 text-start flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            {isHe ? 'ארכיטקטורת מערכת' : 'System Architecture'}
          </h1>
          <p className="text-slate-500 mt-2">
            {isHe 
              ? 'סייר בצורה אינטראקטיבית בכל שלבי האלגוריתם והתשתית של PublishAI. לחץ על הכלים והסוכנים למידע נוסף.' 
              : 'Interactive exploration of the PublishAI Algorithm & Infrastructure. Click on tools and agents for more info.'}
          </p>
        </div>
        
        {/* Share Button */}
        <button 
          onClick={handleShare}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 shadow-sm rounded-xl text-slate-600 hover:text-sky-600 hover:border-sky-200 hover:bg-sky-50 transition-all duration-300 shrink-0"
        >
          <Share2 className="w-4 h-4" />
          <span className="font-medium text-sm">
            {copied ? (isHe ? 'הקישור הועתק!' : 'Link Copied!') : (isHe ? 'שתף מפה' : 'Share Map')}
          </span>
        </button>
      </div>

      {/* Phase Tabs */}
      <div className="flex flex-wrap w-full gap-2 mb-8 bg-slate-100/50 p-2 rounded-2xl border border-slate-200/50">
        {PHASES.map((phase) => (
          <button
            key={phase.id}
            onClick={() => handlePhaseChange(phase.id)}
            className={`flex-1 text-center px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              activePhase === phase.id
                ? "bg-white text-sky-700 shadow-sm border border-slate-200"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            {phase.title[locale]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
                {/* Sidebar: Stepper */}
        <div className="lg:col-span-1">
          {/* Mobile Step Selector (Custom Animated Dropdown) */}
          <div className="block lg:hidden mb-4 relative z-50">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              {isHe ? "בחר שלב בתהליך:" : "Select Step:"}
            </label>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-white border border-slate-300 text-slate-800 font-medium py-3 px-4 rounded-xl shadow-sm flex items-center justify-between hover:border-sky-400 hover:ring-1 hover:ring-sky-400 transition-all focus:outline-none"
              dir={isHe ? "rtl" : "ltr"}
            >
              <span className="truncate">{stepData.title[locale]}</span>
              <motion.div
                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className={`text-slate-500 shrink-0 ${isHe ? 'mr-4' : 'ml-4'}`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </motion.div>
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 divide-y divide-slate-100"
                  dir={isHe ? "rtl" : "ltr"}
                >
                  {currentPhaseSteps.map((step) => (
                    <button
                      key={step.id}
                      onClick={() => {
                        setActiveStep(step.id);
                        setSelectedTool(null);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-start px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                        activeStep === step.id ? "bg-sky-50 text-sky-700 font-bold" : "text-slate-700 font-medium"
                      }`}
                    >
                      <span>{step.title[locale]}</span>
                      {activeStep === step.id && (
                        <CheckCircle className="w-5 h-5 text-sky-500 shrink-0" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop Step Selector (Sidebar) */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-slate-100 p-4 max-h-[85vh] overflow-y-auto sticky top-6">
            <div className="flex flex-col gap-2">
              {currentPhaseSteps.map((step) => {
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
                        : "hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-transparent"
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${isActive ? "bg-white/20" : step.color.split(' ')[0]}`}>
                      <step.icon className={`w-5 h-5 ${isActive ? "text-white" : step.color.split(' ')[1]}`} />
                    </div>
                    <span className="font-medium text-sm leading-tight flex-1 whitespace-normal">{step.title[locale]}</span>
                    {isActive && <svg className={`w-4 h-4 shrink-0 opacity-70 ${isHe ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>}
                  </button>
                );
              })}
            </div>
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
                  
                  {/* Step Agent System Prompt */}
                  {stepData.prompt && (
                    <div className="mt-6 p-4 md:p-5 bg-slate-800 rounded-xl border border-slate-700 shadow-inner">
                      <div className="flex items-center gap-2 mb-3">
                        <Terminal className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                          {isHe ? 'פרומפט מערכת (System Prompt)' : 'Agent System Prompt'}
                        </h4>
                      </div>
                      <div className={`text-slate-300 font-mono text-sm leading-relaxed ${isHe ? 'font-sans' : ''} whitespace-pre-wrap`} dir={isHe ? "rtl" : "ltr"}>
                        {stepData.prompt[locale]}
                      </div>
                    </div>
                  )}
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
                      {TOOLS_INFO[selectedTool].prompt && (
                        <div className="mt-4 pt-4 border-t border-slate-200">
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-start">
                            {isHe ? 'פרומפט המערכת (System Prompt)' : 'System Prompt'}
                          </h5>
                          <div className={`bg-slate-800 text-slate-300 font-mono text-sm p-4 rounded-lg text-start leading-relaxed ${isHe ? 'font-sans' : ''}`} dir={isHe ? "rtl" : "ltr"}>
                            {TOOLS_INFO[selectedTool].prompt[locale]}
                          </div>
                        </div>
                      )}
                    </div>
      

            </motion.div>
                )}
              </AnimatePresence>


              {/* Navigation Buttons */}
              <div className="mt-auto pt-8 border-t border-slate-100 flex items-center justify-between">
                {(() => {
                  const currentIndex = currentPhaseSteps.findIndex(s => s.id === activeStep);
                  const prevStep = currentIndex > 0 ? currentPhaseSteps[currentIndex - 1] : null;
                  const nextStep = currentIndex < currentPhaseSteps.length - 1 ? currentPhaseSteps[currentIndex + 1] : null;
                  
                  return (
                    <>
                      {prevStep ? (
                        <button
                          onClick={() => {
                            setActiveStep(prevStep.id);
                            setSelectedTool(null);
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors font-medium text-sm ${isHe ? 'ml-auto' : 'mr-auto'}`}
                        >
                          <ArrowRight className={`w-4 h-4 ${isHe ? '' : 'rotate-180'}`} />
                          {isHe ? 'השלב הקודם' : 'Previous Step'}
                        </button>
                      ) : <div className={isHe ? 'ml-auto' : 'mr-auto'}></div>}
                      
                      {nextStep && (
                        <button
                          onClick={() => {
                            setActiveStep(nextStep.id);
                            setSelectedTool(null);
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors font-medium text-sm shadow-sm"
                        >
                          {isHe ? 'השלב הבא' : 'Next Step'}
                          <ArrowRight className={`w-4 h-4 ${isHe ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
    </DashboardLayout>
  );
}
