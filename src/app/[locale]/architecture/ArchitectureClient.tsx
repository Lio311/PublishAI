"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocale } from "next-intl";
import { 
  Upload, Search, FileText, BarChart2, Eye, MessageSquare, 
  CheckCircle, Edit3, Save, ShieldCheck, Download, 
  Cpu, Database, Layers, X, Info, ArrowRight, BookOpen, Scissors, ListChecks, RefreshCw, GitMerge, FileCheck, Code
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
  "Claude 3.7": {
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
  "LangGraph": {
    en: "A library for building stateful, multi-actor applications with LLMs. Orchestrates the Multi-Agent team and enables Human-in-the-Loop workflows.",
    he: "ספרייה לבניית אפליקציות מרובות-סוכנים מבוססות מצב (State). מנהלת את נחיל הסוכנים ומאפשרת התערבות אנושית (Human-in-the-Loop) באמצע התהליך."
  },
  "Mem0": {
    en: "A long-term memory layer for AI agents. Remembers user preferences, writing styles, and feedback across all sessions.",
    he: "שכבת זיכרון לטווח ארוך עבור סוכני AI. זוכרת את ההעדפות של המשתמש, סגנון הכתיבה וההערות הקודמות שלו לאורך זמן."
  },
  "Langfuse": {
    en: "An open-source LLMOps platform for tracing, evals, and prompt management. Monitors token usage, latency, and agent reasoning.",
    he: "פלטפורמת LLMOps למעקב (Tracing) ואנליזה. מנטרת את כמות הטוקנים, זמני התגובה, ומאפשרת לנתח את הליך ההסקה של הסוכנים בזמן אמת."
  },
  "Guardrails AI": {
    en: "An open-source framework ensuring AI safety. Validates outputs to prevent hallucinations, generic AI apologies, and malicious code generation.",
    he: "מסגרת לאבטחת AI. בודקת ומוודאת את התוצרים כדי למנוע הזיות (Hallucinations), תשובות 'רובוטיות', או יצירת קוד זדוני."
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
  },
  "WebSockets": {
    en: "Real-time bi-directional communication protocol used to stream live screenshots and receive instant user interventions during RPA roadblocks.",
    he: "פרוטוקול תקשורת דו-כיווני בזמן אמת המשמש להזרמת צילומי מסך חיים וקבלת התערבות מיידית מהמשתמש בעת חסימות בתהליך ה-RPA."
  },
  "Editorial Manager RPA": {
    en: "Vision AI and Playwright-based browser automation adapter for Editorial Manager.",
    he: "אדפטר מבוסס Vision AI ו-Playwright לאוטומציית דפדפן מלאה במערכת Editorial Manager."
  },
  "ScholarOne RPA": {
    en: "Playwright-based automation adapter targeting Clarivate's ScholarOne portal.",
    he: "אדפטר מבוסס Playwright המכוון לאוטומציה בפורטל ScholarOne של Clarivate."
  },
  "eJournalPress RPA": {
    en: "Playwright-based automation adapter targeting the eJournalPress platform.",
    he: "אדפטר מבוסס Playwright המכוון לאוטומציה בפלטפורמת eJournalPress."
  },
  "Claude 3.5 Haiku": {
    en: "Anthropic's fastest model, used for quick text manipulations, figure legend improvement, and low-latency background tasks.",
    he: "המודל המהיר ביותר של Anthropic, משמש למניפולציות טקסט קצרות, שיפור כיתובי איורים, ומשימות רקע שדורשות זמן תגובה מיידי."
  },
  "GPT-4o-mini": {
    en: "Cost-efficient OpenAI model used for fast telemetry, extracting user feedback, and learning rules for the RLHF system.",
    he: "מודל חסכוני ומהיר של OpenAI המשמש לטלמטריה, חילוץ משוב מהמשתמש, וגזירת חוקים למערכת הלמידה (RLHF)."
  },
  "Hugging Face Spaces": {
    en: "Cloud platform used to deploy reproducible research agents as isolated MCP servers.",
    he: "פלטפורמת ענן המשמשת לפריסת סוכני מחקר עצמאיים (כשרתי MCP) המאפשרים שחזור מדויק של תוצאות."
  },
  "next-intl": {
    en: "Internationalization (i18n) library used to support both English and Hebrew interfaces seamlessly.",
    he: "ספריית תרגום ושפות (i18n) המאפשרת תמיכה חלקה בממשק משתמש באנגלית ובעברית."
  },
  "Tailwind CSS": {
    en: "Utility-first CSS framework for rapidly building custom, responsive user interfaces.",
    he: "פריימוורק עיצוב (CSS) מבוסס-מחלקות לבנייה מהירה של ממשקי משתמש מודרניים ורספונסיביים."
  },
  "Framer Motion": {
    en: "Production-ready animation library for React, powering the smooth transitions in the system flowchart and UI.",
    he: "ספריית אנימציות מתקדמת ל-React, האחראית על מעברים חלקים בממשק המשתמש ותרשים הזרימה."
  },
  "Sonner": {
    en: "An opinionated toast component for React used for real-time success/error notifications.",
    he: "ספריית התראות (Toasts) אלגנטית המציגה הודעות הצלחה ושגיאה למשתמש בזמן אמת."
  },
  "Zod": {
    en: "TypeScript-first schema declaration and validation library, ensuring AI outputs exactly match expected JSON structures.",
    he: "ספריית ולידציה המבטיחה שהתשובות שחוזרות ממודלי ה-AI (בפורמט JSON) תואמות בדיוק למבנה הנתונים המצופה."
  },
  "Jest": {
    en: "Delightful JavaScript Testing Framework with a focus on simplicity, used for unit testing core agent logic.",
    he: "סביבת בדיקות (טסטים) ל-JavaScript המשמשת לווידוא הלוגיקה והאמינות של סוכני ה-AI והמערכת."
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
    icon: Upload, tools: ["Next.js 16 UI", "Vercel Blob", "Inngest", "Mammoth & Docx", "PDF Parser", "Upstash Redis", "LangChain & LangGraph", "next-intl", "Tailwind CSS", "Framer Motion", "Sonner"],
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
      en: "SYSTEM: You are a distinguished Academic Editor-in-Chief.\nTASK: Perform a deep-dive diagnostic analysis of the uploaded manuscript.\n1. Extract the core scientific thesis, research gaps addressed, and methodological approach.\n2. Identify structural deficiencies (e.g., inadequate literature review, missing limitations, weak statistical grounding).\n3. Formulate 5 probing questions for the author to clarify ambiguities before the revision pipeline begins.\nOUTPUT: Strict JSON matching the 'ClarificationReport' schema.", 
      he: "מערכת: אתה עורך אקדמי ראשי בעל שם עולמי.\nמשימה: בצע ניתוח דיאגנוסטי מעמיק של כתב היד.\n1. חלץ את התזה המדעית המרכזית, פערי המחקר, והגישה המתודולוגית.\n2. זהה כשלים מבניים (למשל: סקירת ספרות חסרה, היעדר מגבלות מחקר, ביסוס סטטיסטי חלש).\n3. נסח 5 שאלות חקר מחודדות למחבר לצורך הבהרת עמימויות לפני תחילת השכתוב.\nפלט: JSON קפדני התואם לסכמת ClarificationReport." 
    },
    icon: Search, tools: ["Claude 3.7", "Vercel AI SDK", "GPT-4o-mini", "Zod"],
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
      en: "SYSTEM: You are a Strategic Academic Planner.\nINPUTS: Original manuscript, Author's clarification responses, Target journal guidelines.\nTASK: Construct a comprehensive, phase-by-phase Revision Masterplan.\n1. Map sections requiring total rewrites vs. minor edits.\n2. Pinpoint exact paragraphs needing stronger empirical backing or modern citations.\n3. Define the narrative arc and logical flow improvements.\nOUTPUT: A Directed Acyclic Graph (DAG) of editing tasks to be distributed to specialized sub-agents.", 
      he: "מערכת: אתה אסטרטג תכנון אקדמי.\nקלטים: כתב היד המקורי, תשובות המחבר לבירור, והנחיות כתב העת.\nמשימה: בנה תוכנית-אב מקיפה לשכתוב.\n1. מפה אילו חלקים דורשים שכתוב מלא ואילו רק עריכה קלה.\n2. סמן פסקאות ספציפיות הדורשות ביסוס אמפירי חזק יותר או ציטוטים עדכניים.\n3. תכנן מחדש את הזרימה הלוגית וקשת הנרטיב של המאמר.\nפלט: גרף משימות מכוון (DAG) שיחולק לסוכני-המשנה השונים." 
    },
    icon: FileText, tools: ["Claude 3.7"],
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
      en: "SYSTEM: You are an Expert Literature Researcher equipped with Semantic Scholar & PubMed MCP tools.\nTASK:\n1. Generate optimized Boolean search queries combining core concepts from the manuscript.\n2. Retrieve the top 50 most relevant papers published in the last 3 years.\n3. Use GraphRAG to extract key findings and methodologies.\n4. Identify missing foundational citations in the current draft.\nOUTPUT: A synthesized Literature Matrix (JSON) mapping claims in the text to retrieved DOIs.", 
      he: "מערכת: אתה חוקר ספרות מומחה המצויד בכלי גישה ל-Semantic Scholar ול-PubMed.\nמשימה:\n1. נסח שאילתות חיפוש בוליאניות אופטימליות המשלבות את מושגי הליבה של המאמר.\n2. שלוף את 50 המאמרים הרלוונטיים ביותר מה-3 שנים האחרונות.\n3. השתמש ב-GraphRAG כדי לחלץ מתודולוגיות וממצאים.\n4. זהה ציטוטי חובה שחסרים בטיוטה הנוכחית.\nפלט: מטריצת ספרות מסונתזת הממפה טענות בטקסט ל-DOIs מתאימים." 
    },
    icon: Database, tools: ["Claude 3.7", "pgvector", "GraphRAG", "MCP", "LangChain & LangGraph", "Hugging Face Spaces"],
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
      en: "SYSTEM: You are a Data Scientist & Visual Analytics Reviewer.\nTASK: Analyze all charts, tables, and statistical claims within the manuscript.\n1. Use Vision AI to evaluate the clarity, accessibility (e.g., colorblind-safe palettes), and correctness of figures.\n2. Extract statistical reporting (p-values, CI, sample sizes) and run consistency checks via the E2B Sandbox.\n3. Flag any discrepancies between the data visualized and the text conclusions.\nOUTPUT: A rigorous Statistical & Visual Audit Report.", 
      he: "מערכת: אתה מדען נתונים ומבקר אנליזה חזותית.\nמשימה: נתח את כל התרשימים, הטבלאות והטענות הסטטיסטיות במאמר.\n1. השתמש ב-Vision AI כדי להעריך את הבהירות, הנגישות, והנכונות של האיורים.\n2. חלץ דיווחים סטטיסטיים וודא עקביות באמצעות הפעלת קוד ב-E2B Sandbox.\n3. התרע על כל פער בין הנתונים המוצגים לבין המסקנות בטקסט.\nפלט: דוח ביקורת סטטיסטית וחזותית קפדני." 
    },
    icon: BarChart2, tools: ["Claude 3.7", "Claude 3.5 Haiku", "Vision AI", "E2B Sandbox"],
    color: "bg-orange-50 text-orange-700 border-orange-200"
  },
  {
    id: 6, phase: 1,
    title: { en: "6. Scientific Review Debate", he: "6. עימות סוקרים מדעי (Debate)" },
    description: { 
      en: "A parallel multi-agent debate (Vercel AI SDK). Harsh Reviewer (Claude), Analytical Reviewer (GPT-4o), and Optimist Reviewer (Gemini) debate the paper's merits.",
      he: "דיון סוקרים מקביל המדמה ועידה מדעית. סוקר קשוח (Claude), סוקר אנליטי (GPT-4o), וסוקר אופטימי (Gemini) מבקרים את המאמר מזוויות שונות."
    },
    icon: MessageSquare, tools: ["Claude 3.7", "GPT-4o", "Gemini 1.5", "Vercel AI SDK"],
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
      en: "Rewrites the text in an iterative LangGraph loop. Fetches user preferences via Mem0, validates output with Guardrails AI, and halts for Human-in-the-Loop review. All monitored by Langfuse.",
      he: "משכתב את הטקסט בלולאה איטרטיבית של LangGraph. שואב העדפות אישיות דרך Mem0, מוודא את בטיחות התוצר עם Guardrails AI, ועוצר לביקורת אנושית (Human-in-the-Loop). מפוקח בזמן אמת ע\"י Langfuse."
    },
    prompt: { 
      en: "SYSTEM: You are an Elite Academic Ghostwriter.\nTASK: Execute the rewriting phase based on the Area Chair's directives.\n1. Elevate the prose to match the linguistic standards of Nature/Science.\n2. Eliminate all AI-generated clichés (e.g., 'delve into', 'a tapestry of').\n3. Ensure logical transitions between paragraphs and active, concise phrasing.\n4. Seamlessly integrate the newly retrieved citations into the narrative flow.\nOUTPUT: The revised manuscript section in Markdown.", 
      he: "מערכת: אתה עורך וכותב צללים אקדמי עילית.\nמשימה: בצע את שלב השכתוב בהתאם להנחיות סוכן-העל (Area Chair).\n1. שפר את משלב הכתיבה לרמה של כתבי העת המובילים (Nature/Science).\n2. השמד לחלוטין קלישאות AI (כגון 'חשוב לציין', 'מארג של').\n3. ודא מעברים לוגיים חלקים בין פסקאות, ושימוש בשפה פעילה ותמציתית.\n4. שלב בטבעיות את הציטוטים החדשים שנשלפו לתוך זרימת הטקסט.\nפלט: הטקסט המשוכתב בפורמט Markdown." 
    },
    icon: Edit3, tools: ["Claude 3.7", "LangGraph", "Mem0", "Guardrails AI", "Langfuse"],
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
      en: "SYSTEM: You are the Source Control & Execution Agent.\nTASK:\n1. Compare the original text and the revised text.\n2. Generate a precise Operational Diff (JSON patch).\n3. Inject the changes directly into the Collaborative Tiptap Editor Database.\n4. Compile a concise Changelog for the human author summarizing the exact semantic shifts.",
      he: "מערכת: אתה סוכן ביצוע ובקרת גרסאות.\nמשימה:\n1. השווה בין הטקסט המקורי לטקסט המשוכתב.\n2. צור Diff תפעולי מדויק (בתצורת JSON patch).\n3. הזרק את השינויים ישירות למסד הנתונים של העורך השיתופי (Tiptap).\n4. הפק יומן שינויים (Changelog) תמציתי עבור המחבר המסכם את התמורות הסמנטיות."
    },
    icon: Save, tools: ["Claude 3.7", "Tiptap & Monaco", "Neon Postgres", "Drizzle ORM"],
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
      en: "SYSTEM: You are the Final Quality Assurance (QA) Inspector.\nTASK: Perform a rigorous, multi-pass validation on the finalized manuscript.\n1. Execute plagiarism & similarity detection against major academic databases.\n2. Verify cross-referencing integrity (all figures, tables, and citations mentioned in text exist in the bibliography and vice-versa).\n3. Perform a final grammar, syntax, and typesetting check.\nOUTPUT: A QA Clearance Certificate or a list of critical blocking errors.", 
      he: "מערכת: אתה פקח בקרת האיכות הסופית (QA).\nמשימה: בצע ולידציה רב-שלבית קפדנית על כתב היד המוגמר.\n1. הפעל זיהוי פלגיאט ודמיון אל מול מאגרי מידע אקדמיים מרכזיים.\n2. ודא שלמות של הפניות צולבות (כל התרשימים והציטוטים המוזכרים בטקסט אכן קיימים, והפוך).\n3. בצע בדיקת דקדוק, תחביר ועיצוב טיפוגרפי סופית.\nפלט: תעודת אישור QA או רשימה של שגיאות חוסמות קריטיות." 
    },
    icon: ShieldCheck, tools: ["react-force-graph-2d", "Claude 3.7", "Jest"],
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
      en: "SYSTEM: You are the Publishing Executive.\nTASK: Prepare the submission package.\n1. Draft a highly persuasive Cover Letter addressing the specific Editor-in-Chief of the target journal, highlighting the novelty and broad impact of the research.\n2. Ensure all compliance declarations (conflict of interest, funding, data availability) are present.\n3. Format the final output cleanly.\nOUTPUT: Cover Letter text and metadata payload for export.", 
      he: "מערכת: אתה מנהל ההוצאה לאור.\nמשימה: הכן את חבילת ההגשה.\n1. נסח מכתב מקדים (Cover Letter) משכנע הממוען ספציפית לעורך הראשי של כתב העת, תוך הדגשת החדשנות וההשפעה של המחקר.\n2. ודא כי כל הצהרות החובה (ניגוד עניינים, מימון, זמינות נתונים) קיימות.\n3. עצב את התוצר הסופי בצורה נקייה.\nפלט: טקסט המכתב ומטען (Payload) נתונים לייצוא." 
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
      en: "SYSTEM: You are a strict Journal Requirements Parsing Engine.\nTASK: Deeply analyze the scraped HTML/text of the target journal's Author Guidelines.\n1. Extract explicit constraints: abstract word limit, main text word limit, reference formatting style (e.g., APA, IEEE), figure resolution rules, and mandatory section order.\n2. Identify implicit requirements (e.g., blind title page, specific declarations).\nOUTPUT: A rigid JournalRules JSON schema mapping every constraint.",
      he: "מערכת: אתה מנוע פענוח קפדני לדרישות כתבי עת.\nמשימה: נתח לעומק את ה-HTML/טקסט שנשאב מעמוד הנחיות המחברים של העיתון.\n1. חלץ אילוצים מפורשים: מגבלת מילים בתקציר ובגוף הטקסט, סגנון ציטוט (APA, IEEE), דרישות רזולוציה לאיורים, וסדר פרקים חובה.\n2. זהה דרישות סמויות (למשל: עמוד כותרת נפרד לביקורת עיוורת, הצהרות ספציפיות).\nפלט: סכמת JSON קשיחה הממפה כל אילוץ."
    },
    icon: Search, tools: ["Claude 3.7", "Neon Postgres", "Drizzle ORM"],
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
      en: "SYSTEM: You are a precision Formatting & Typesetting Agent.\nINPUTS: Final manuscript, JournalRules JSON.\nTASK: Structurally transform the manuscript without altering scientific claims.\n1. Restructure headers to match the journal's hierarchy.\n2. Automatically trim or expand the abstract to fit the exact word boundaries.\n3. Reformat all in-text citations and the bibliography to match the required standard perfectly.\nOUTPUT: The completely reformatted manuscript.",
      he: "מערכת: אתה סוכן עיצוב וטיפוגרפיה מדויק.\nקלטים: כתב היד הסופי, קובץ JSON של הנחיות העיתון.\nמשימה: התמר את כתב היד מבחינה מבנית מבלי לשנות טענות מדעיות.\n1. סדר מחדש את הכותרות כך שיתאימו להיררכיה של העיתון.\n2. קצץ או הרחב אוטומטית את התקציר כך שיעמוד בדיוק במגבלת המילים.\n3. עצב מחדש את כל הציטוטים בגוף הטקסט והביבליוגרפיה לסגנון הנדרש.\nפלט: כתב היד המעוצב במלואו."
    },
    icon: Scissors, tools: ["Claude 3.7", "Tiptap & Monaco"],
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
      en: "SYSTEM: You are the Pre-Flight Compliance Auditor (Powered by OpenAI o1).\nTASK: Perform zero-tolerance Boolean logic validation on the manuscript against the Journal Rules.\n1. Count abstract words. Does it exceed X? (Fail/Pass)\n2. Check section order. Does Methods come before Results? (Fail/Pass)\n3. Verify blinded manuscript constraints (e.g., no author names in the main PDF).\nOUTPUT: A Submission Readiness Report. If any check fails, trigger a rollback.",
      he: "מערכת: אתה מבקר תאימות לפני-הגשה (מופעל ע\"י OpenAI o1).\nמשימה: בצע אימות לוגי בוליאני באפס-סובלנות לכתב היד מול חוקי העיתון.\n1. ספור מילים בתקציר. האם חורג מ-X? (עובר/נכשל)\n2. בדוק סדר פרקים. האם שיטות מופיעות לפני תוצאות? (עובר/נכשל)\n3. ודא אילוצי סקירה עיוורת (למשל, אין שמות מחברים ב-PDF המרכזי).\nפלט: דוח מוכנות להגשה. אם בדיקה נכשלת, הפעל חזרה לאחור (Rollback)."
    },
    icon: ListChecks, tools: ["OpenAI o1"],
    color: "bg-pink-50 text-pink-700 border-pink-200"
  },

  {
    id: 16, phase: 2,
    title: { en: "16. RPA Login & Navigation", he: "16. ניווט והתחברות אוטומטית (RPA)" },
    description: { 
      en: "A real RPA bot powered by Playwright navigates the target journal's portal, executing automated logins using encrypted credentials. When DOM selectors fail, a Vision AI fallback layer analyzes screenshots and identifies page elements visually.",
      he: "בוט אוטומציה (RPA) אמיתי המופעל על ידי Playwright מנווט אל מערכת ההגשות ומתחבר עצמאית בעזרת פרטי הזדהות מוצפנים. כאשר סלקטורי DOM נכשלים, שכבת Vision AI מנתחת צילומי מסך ומזהה אלמנטים באופן חזותי."
    },
    prompt: { 
      en: "SYSTEM: You are a secure Web Automation Navigation Agent.\nTASK: Access the target journal submission platform.\n1. Safely retrieve encrypted user credentials from the database.\n2. Navigate the headless browser to the journal's login endpoint.\n3. Identify DOM elements for username, password, and submit button.\n4. Execute login, handle cookies, and navigate to the 'New Submission' dashboard.\nOUTPUT: Navigation success state or explicit error for invalid credentials.", 
      he: "מערכת: אתה סוכן אוטומציית ניווט מאובטח.\nמשימה: גש למערכת ההגשות של העיתון.\n1. שלוף בבטחה את פרטי ההזדהות המוצפנים של המשתמש מהמסד.\n2. נווט בדפדפן הנסתר לעמוד ההתחברות של העיתון.\n3. זהה אלמנטים ב-DOM להזנת שם משתמש, סיסמה ולחיצה על התחברות.\n4. בצע התחברות, שמור עוגיות (Cookies) ונווט למסך 'הגשה חדשה'.\nפלט: סטטוס הצלחת ניווט או שגיאה מפורשת על פרטים שגויים." 
    },
    icon: Globe, tools: ["Playwright", "Node.js", "Vision AI", "Editorial Manager RPA", "ScholarOne RPA", "eJournalPress RPA"],
    color: "bg-pink-50 text-pink-700 border-pink-200"
  },
  {
    id: 17, phase: 2,
    title: { en: "17. Form Filling & Metadata", he: "17. מילוי טפסים ופרטי מחברים" },
    description: { 
      en: "Agent reads the journal's dynamic HTML forms and maps the paper's metadata into the respective fields. For journals that accept email submissions, a dedicated Email adapter sends the manuscript package directly to the editor via SMTP.",
      he: "הסוכן סורק את טופסי ה-HTML הדינמיים ומזריק פרטי מאמר אוטומטית לשדות המתאימים. עבור כתבי עת שמקבלים הגשה במייל, אדפטר Email ייעודי שולח את חבילת המאמר ישירות לתיבת המייל של העורך."
    },
    prompt: { 
      en: "SYSTEM: You are a DOM-parsing and Data-Entry Agent.\nTASK: Fill out the journal's complex multi-page submission form.\n1. Scan the current page for input fields, textareas, and select dropdowns.\n2. Cross-reference the required fields with the manuscript's JSON metadata.\n3. Map and type out all fields automatically (e.g., matching 'Corresponding Author' to the user's profile).\n4. Upload the required files (Manuscript, Cover Letter, Figures) into the correct dropzones.\nOUTPUT: State verification that all mandatory fields are satisfied.", 
      he: "מערכת: אתה סוכן ניתוח DOM והזנת נתונים.\nמשימה: מלא את טופס ההגשה מרובה-הדפים של העיתון.\n1. סרוק את העמוד הנוכחי לאיתור שדות טקסט, תפריטי בחירה ואזורי גרירה.\n2. הצלב את השדות הנדרשים עם המטא-דאטה של המאמר (JSON).\n3. הזן את כל הנתונים הרלוונטיים (לדוגמה, חיבור 'המחבר המייצג' לפרופיל המשתמש).\n4. העלה את הקבצים הנדרשים (קובץ המאמר, מכתב מלווה, איורים) לאזורים הנכונים.\nפלט: אישור סטטוס שכל השדות החובה מולאו כהלכה." 
    },
    icon: Edit3, tools: ["Playwright", "Claude 3.7", "Vision AI", "Nodemailer"],
    color: "bg-pink-50 text-pink-700 border-pink-200"
  },
  {
    id: 18, phase: 2,
    title: { en: "18. Human-in-the-Loop Alert", he: "18. התראת משתמש ואימות אנושי" },
    description: { 
      en: "If the bot hits a CAPTCHA, 2FA, or an unknown required field, it halts the headless browser, takes a live screenshot, and pings the user's device to intervene manually.",
      he: "אם הבוט נתקל ב-CAPTCHA, אימות דו-שלבי (2FA) או שדה חובה לא מוכר, הוא עוצר את התהליך, מצלם מסך בלייב ושולח התראה למכשיר של המשתמש להתערבות ידנית."
    },
    prompt: { 
      en: "SYSTEM: You are an Exception Handling & Alert Agent.\nTASK: Monitor the RPA pipeline for roadblocks.\n1. Detect presence of Cloudflare turnstiles, reCAPTCHA, or unexpected modal dialogs.\n2. If detected, pause the Playwright script indefinitely.\n3. Capture the HTML state and a screenshot. Send a WebSocket ping to the frontend Dashboard.\n4. Serve a secure iframe or remote-desktop link so the user can solve the challenge.\nOUTPUT: Resumes the script only when the user clicks 'Verification Complete'.", 
      he: "מערכת: אתה סוכן טיפול בחריגים והתראות.\nמשימה: נטר את תהליך ה-RPA לאיתור חסימות.\n1. מצא נוכחות של חסמי אבטחה (Cloudflare, reCAPTCHA) או חלונות קופצים בלתי צפויים.\n2. אם זוהתה חסימה, הקפא את הסקריפט באופן מלא.\n3. צלם מסך של המצב הנוכחי ושלח פולס (Ping) ב-WebSocket לדשבורד של המשתמש.\n4. פתח חלון מאובטח (iframe) שמאפשר למשתמש לפתור את האתגר מתוך המערכת שלנו.\nפלט: חידוש הסקריפט יתבצע אך ורק כשהמשתמש מאשר שסיים את ההתערבות הידנית." 
    },
    icon: ShieldCheck, tools: ["WebSockets", "Vercel AI SDK", "Puppeteer"],
    color: "bg-pink-50 text-pink-700 border-pink-200"
  },
  {
    id: 19, phase: 2,
    title: { en: "19. Final Submit & Confirmation", he: "19. הגשה סופית ווידוא קליטה" },
    description: { 
      en: "Displays a final preview of the entire submission summary generated by the journal. Once the user approves, the bot clicks 'Submit' and extracts the Tracking ID.",
      he: "הצגת טיוטת סיכום ההגשה הסופית כפי שהופקה על ידי העיתון. רק לאחר אישור המשתמש, הבוט לוחץ 'Submit' ושואב את מספר המעקב (Tracking ID)."
    },
    prompt: { 
      en: "SYSTEM: You are the Final Submission Gatekeeper.\nTASK: Execute the finalization of the journal submission.\n1. Navigate to the final review page of the journal's portal.\n2. Extract the summary PDF or HTML and push it to the user's dashboard.\n3. Wait for the explicit 'Approve & Submit' API call from the user.\n4. Click the final Submit button, intercept the success screen, and parse the Manuscript ID/Tracking Number.\nOUTPUT: The confirmed Manuscript ID written to the Neon database.", 
      he: "מערכת: אתה סוכן אישור ההגשה הסופית.\nמשימה: בצע את השלמת ההגשה מול מערכת העיתון.\n1. נווט לעמוד הסיכום הסופי בפורטל העיתון.\n2. חלץ את סיכום ההגשה (PDF/HTML) והצג אותו בדשבורד המשתמש לאישור.\n3. המתן לקריאת ה-API 'Approve & Submit' מאת המשתמש.\n4. לחץ על כפתור השליחה הסופי, תעד את מסך ההצלחה וחלץ את מספר המעקב (Manuscript ID).\nפלט: עדכון מספר המעקב במסד הנתונים של PublishAI." 
    },
    icon: CheckCircle, tools: ["Playwright", "Neon Postgres"],
    color: "bg-pink-50 text-pink-700 border-pink-200"
  },
  
  // PHASE 3: Peer Review Iteration
  {
    id: 20, phase: 3,
    title: { en: "20. Feedback Ingestion", he: "20. קליטת ביקורת (R&R)" },
    description: { 
      en: "User uploads the rejection/revision letter from the human peer reviewers at the journal.",
      he: "המשתמש מעלה את מכתב הביקורת והדחייה (Revise and Resubmit) שקיבל מהסוקרים האנושיים בעיתון היעד."
    },
    prompt: { 
      en: "SYSTEM: You are a Document Extractor.\nTASK: Parse an uploaded PDF/Docx containing peer review feedback.\n1. Strip out headers, journal branding, and boilerplate text.\n2. Isolate the core feedback section where Reviewer 1, Reviewer 2, and the Editor leave their detailed comments.\n3. Normalize the text into a clean Markdown format for the next agent.\nOUTPUT: Raw but cleaned text of peer review feedback.", 
      he: "מערכת: אתה מחלץ מסמכים מתקדם.\nמשימה: נתח קובץ PDF/Docx שהועלה המכיל ביקורת סוקרים.\n1. סנן כותרות, לוגואים של העיתון וטקסטים גנריים.\n2. בודד את חלקי הביקורת המרכזיים שבהם סוקר 1, סוקר 2 והעורך השאירו את הערותיהם המפורטות.\n3. נרמל את הטקסט לפורמט Markdown נקי עבור הסוכן הבא.\nפלט: טקסט נקי המכיל את נטו ביקורת הסוקרים." 
    },
    icon: Upload, tools: ["PDF Parser", "Mammoth & Docx", "Vercel Blob"],
    color: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: 21, phase: 3,
    title: { en: "21. Comment Breakdown", he: "21. פירוק והבנת הערות" },
    description: { 
      en: "Agent parses the unstructured letter into individual, actionable critiques categorized by severity.",
      he: "הסוכן מנתח את המכתב (שלרוב אינו מובנה), ומפרק אותו להערות בודדות ברות-פעולה, המחולקות לפי רמת קריטיות."
    },
    prompt: { 
      en: "SYSTEM: You are a Peer Review Analyst.\nTASK: Deconstruct the peer review text into an array of isolated, distinct comments.\n1. Identify when a new point is being raised by a reviewer.\n2. Extract the exact text of the comment.\n3. Classify it as Major Revision (methodological flaws, requires new data) or Minor Revision (typos, clarifications, formatting).\nOUTPUT: A JSON array of 'ReviewComment' objects.", 
      he: "מערכת: אתה מנתח ביקורות עמיתים.\nמשימה: פרק את מכתב הביקורת למערך של הערות בודדות ונפרדות.\n1. זהה מתי הסוקר עובר לנקודה או להערה חדשה.\n2. חלץ את הטקסט המדויק של ההערה.\n3. סווג אותה כ'תיקון מהותי' (כשלים מתודולוגיים, צורך בנתונים חדשים) או 'תיקון משני' (שגיאות כתיב, הבהרות, עיצוב).\nפלט: מערך JSON של אובייקטים מסוג 'ReviewComment'." 
    },
    icon: GitMerge, tools: ["Claude 3.7", "Vercel AI SDK", "GPT-4o-mini", "Zod"],
    color: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: 22, phase: 3,
    title: { en: "22. Rebuttal Strategy", he: "22. אסטרטגיית מענה" },
    description: { 
      en: "Area Chair formulates a strategy for addressing each comment, identifying which require text changes vs. which just need a solid counter-argument.",
      he: "הסוכן-הראשי (Area Chair) מגבש אסטרטגיה לטיפול בכל הערה - האם היא דורשת שינוי בטקסט, הוספת ציטוט, או שניתן להסתפק בנימוק-נגד חזק."
    },
    prompt: { 
      en: "SYSTEM: You are an Area Chair directing a revision.\nTASK: Formulate an action plan for every ReviewComment.\n1. For each comment, determine: Does this require altering the manuscript, or just a polite refutation?\n2. If altering the manuscript, pinpoint the exact section (e.g., 'Methods: Data Collection').\n3. Generate a draft response to the reviewer thanking them and explaining how it was addressed.\nOUTPUT: Strategic action items appended to each ReviewComment.", 
      he: "מערכת: אתה סוכן-על (Area Chair) המנחה תהליך R&R.\nמשימה: גבש תוכנית פעולה אסטרטגית עבור כל ReviewComment.\n1. עבור כל הערה, קבע: האם נדרש שינוי בכתב היד, או שניתן להפריך אותה בנימוס מבוסס ספרות?\n2. אם נדרש שינוי, סמן את הפסקה המדויקת במאמר (למשל 'פרק שיטות').\n3. נסח טיוטת תגובה לסוקר המודה לו ומסבירה כיצד ההערה טופלה.\nפלט: סעיפי פעולה אסטרטגיים המוצמדים לכל הערת סוקר." 
    },
    icon: Search, tools: ["OpenAI o1"],
    color: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: 23, phase: 3,
    title: { en: "23. Directed Revision", he: "23. שכתוב ממוקד" },
    description: { 
      en: "Execution Agent selectively edits only the relevant paragraphs in the manuscript to address the critiques.",
      he: "סוכן הביצוע ניגש ישירות לפסקאות הרלוונטיות בלבד ומשכתב אותן תוך יישום ההערות (הוספת נתונים, הבהרת מתודולוגיה וכד')."
    },
    prompt: { 
      en: "SYSTEM: You are the Targeted Execution Agent.\nTASK: Modify the manuscript exactly according to the Rebuttal Strategy.\n1. Locate the specific paragraphs identified by the Area Chair.\n2. Execute the required rewriting, preserving the surrounding context perfectly.\n3. Output a diff (Track Changes) showing only the newly modified areas so the human author can review them easily.\nOUTPUT: Updated manuscript with localized diffs.", 
      he: "מערכת: אתה סוכן ביצוע ממוקד-מטרה.\nמשימה: שנה את כתב היד בדיוק לפי אסטרטגיית המענה.\n1. אתר את הפסקאות הספציפיות שסומנו על ידי סוכן-העל.\n2. בצע את השכתוב הנדרש, תוך שמירה מושלמת על ההקשר הסובב.\n3. הפק מסמך עם סימוני שינויים (Track Changes) שיציג אך ורק את החלקים שעודכנו כדי שהמחבר יוכל לבחון אותם.\nפלט: כתב היד המעודכן עם סימוני Diff." 
    },
    icon: Code, tools: ["Claude 3.7"],
    color: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    id: 24, phase: 3,
    title: { en: "24. Rebuttal Letter Generation", he: "24. הפקת מכתב תגובה" },
    description: { 
      en: "Generates a formal point-by-point rebuttal letter demonstrating to the editors exactly how their comments were addressed.",
      he: "מפיק מכתב תגובה רשמי (Point-by-point Rebuttal) שמדגים לעורכי העיתון בדיוק כיצד המאמר תוקן בהתאם לכל אחת מהערותיהם."
    },
    prompt: { 
      en: "SYSTEM: You are an Academic Letter Generator.\nTASK: Compile the final 'Response to Reviewers' letter.\n1. Use a highly formal, respectful, and appreciative academic tone.\n2. Format the letter as: [Reviewer Comment] followed by [Author Response] and [Action Taken in Manuscript].\n3. Include page/line numbers showing where the changes were made.\nOUTPUT: A perfectly formatted PDF/Docx rebuttal letter ready for submission.", 
      he: "מערכת: אתה מפיק מסמכים אקדמיים.\nמשימה: חבר את המכתב הסופי 'מענה לסוקרים'.\n1. השתמש בטון אקדמי רשמי, מכבד ומלא הוקרה.\n2. ערוך את המכתב במבנה של: [הערת הסוקר] מלווה ב-[תגובת המחברים] ו-[פעולה שבוצעה במאמר].\n3. ציין מספרי עמודים/שורות המראים היכן בוצעו השינויים בפועל.\nפלט: מכתב תגובה מעוצב בפורמט PDF/Docx מוכן להגשה." 
    },
    icon: FileCheck, tools: ["Next.js API", "Claude 3.7", "Mammoth & Docx"],
    color: "bg-amber-50 text-amber-700 border-amber-200"
  },
  
  // GLOBAL INFRASTRUCTURE
  {
    id: 25, phase: 4,
    title: { en: "Security & Authentication", he: "אבטחה והזדהות" },
    description: { 
      en: "Global security layers ensuring protected access to manuscripts and user accounts.",
      he: "שכבות אבטחה גלובליות המבטיחות גישה מוגנת למאמרים ולחשבונות המשתמשים."
    },
    icon: ShieldCheck, tools: ["NextAuth.js", "Upstash Redis", "Neon Postgres"],
    color: "bg-slate-100 text-slate-700 border-slate-200"
  },
  {
    id: 26, phase: 4,
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
      <div className="p-4 md:p-8 w-full max-w-[95%] mx-auto min-h-screen">
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
