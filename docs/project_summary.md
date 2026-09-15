# סיכום פרויקט: מערכת AI לעריכת מאמרים אקדמיים (Research Agent)

## תקציר
מערכת SaaS חכמה המקבלת מאמרים אקדמיים (Word/PDF) ומעבירה אותם תהליך אוטומטי-למחצה (היברידי) להפיכתם למאמרים מוכנים לפרסום בכתבי עת מובילים, כולל יכולות הגשה אוטומטיות (Auto-Submission) והתמודדות עם הערות עורכים (Resubmission). התהליך מתבסס על סוכני AI (Claude, OpenAI) הפועלים בשרשרת, בשילוב אישורי משתמש.

## עמודי המערכת וממשק משתמש (UI/Pages)
* **עמוד התחברות (Auth):** התחברות מאובטחת באמצעות חשבון גוגל (OAuth) או אימייל/סיסמה.
* **דאשבורד ראשי ואיזור העלאה (Upload Zone):** מסך גרירה ושחרור של קבצי המקור (Word/PDF) לתחילת תהליך.
* **ראיון מקדים:** ממשק שאלות אמריקאיות לבירור דרישות מול המשתמש.
* **פאנל עריכה למעקב שינויים (DiffEditor / Track Changes):** מסך המציג את השינויים שביצע ה-AI (בדומה ל-Word Track Changes) ומאפשר אישור או דחייה ברמת הסקציה.
* **מסך מאגר חוקי כתבי עת (Journals/Rules):** ניהול וצפייה בדרישות עיצוב והגשה של כתבי עת שונים.
* **דאשבורד תוצרים (Artifact Dashboard):** ריכוז התוצרים הסופיים - המאמר הערוך, מכתב מקדים (Cover Letter), דוח ביקורת עמיתים סימולטיבי, וקובץ הסבר (Walkthrough).
* **פאנל הגשה אוטומטית (Submission Panel):** ממשק הכולל טופסי חיבור לכתבי עת (WordPress / OJS), מסך הסבר אבטחה (Security Briefing), ניהול אימות כפול (2FA), והצגת התקדמות ההגשה (Progress).
* **מודל הערות עמיתים (Reviewer Comments Modal):** מסך להזנת הערות ריוויוורס שהתקבלו לצורך יצירת גרסה מתוקנת ומכתב תגובה (Rebuttal).

## טכנולוגיות מרכזיות ומודלים (Tech Stack)
### שרת, תשתיות ומסד נתונים
* **Core Framework:** Next.js 14/16 (App Router), React 19, TypeScript
* **Database & ORM:** Neon Postgres (Serverless DB), Drizzle ORM
* **Authentication:** NextAuth.js v5 (Auth.js) עם `@auth/drizzle-adapter`
* **Storage & Caching:** Vercel Blob (אחסון קבצים), Upstash Redis (ניהול Rate Limiting ו-Cache)
* **Background Jobs & Orchestration:** Inngest (ניהול תהליכי סוכני ה-AI והגשות ברקע)
* **Hosting:** Vercel Pro

### בינה מלאכותית (AI) ומודלים מתקדמים
* **LLMs & Multi-Model Orchestration:** ניתוב דינמי של משימות למודלים של Claude 3.5 (Sonnet/Opus), מודלי OpenAI (כולל o1) ו-Gemini, בהתאם למורכבות המשימה.
* **AI Framework:** Vercel AI SDK (`ai` package) לניהול אחיד של מודלי שפה, ו-Inngest כאורקסטרטור למערכת מרובת-סוכנים (Multi-Agent System).
* **RAG, Vector DB & GraphRAG:** שימוש ב-**pgvector** (המובנה ב-Neon Postgres) לאחזור הקשר סימנטי, בשילוב עם מתודולוגיית **GraphRAG** לגילוי סתירות מדעיות ולבדיקת עקביות לוגית בטקסט.
* **Knowledge Graph:** בנייה וויזואליזציה של גרף ידע (באמצעות `react-force-graph-2d`) למיפוי קשרים בין מאמרים, חוקרים ורעיונות.
* **Multi-Agent Debate (Swarm / LangGraph):** מודול ייעודי (`debateService`) מבוסס ארכיטקטורת **Swarm** המאפשר דיון מרובה סוכנים (Debate) לפתרון סוגיות אקדמיות מורכבות, עם אפשרות לניהול State מתקדם באמצעות **LangGraph**.
* **RLHF (Reinforcement Learning from Human Feedback):** מנגנון למידה ממשוב משתמשים (`rlhfService`) לשיפור מתמיד של איכות העריכה של הסוכנים.
* **Data Science Sandbox:** סביבת הרצת קוד מבודדת (Code Interpreter) בעזרת **E2B** המאפשרת לסוכנים להריץ פייתון, לנתח נתונים וליצור גרפים.
* **Vision AI:** יכולת עיבוד תמונה (`visionAi.service`) לניתוח טבלאות וגרפים בתוך מאמרים אקדמיים.
* **Literature Search Integrations:** APIs של PubMed, Semantic Scholar, ו-arXiv.

### מסמכים וממשק משתמש (UI/UX)
* **Document Processing:** סידור וקידוד (Typesetting) בעזרת **Pandoc**, חבילות `mammoth` (קריאת Word), `pdf-parse` (קריאת PDF), ו-`docx` (יצירת קבצי Word סופיים).
* **Styling & UI:** Tailwind CSS v4, Framer Motion (אנימציות), Lucide React (אייקונים), Sonner (התראות - Toasts)
* **Advanced Editors & Visuals:** עורך טקסט אינטראקטיבי מבוסס **TipTap** עם תמיכה ב-SSE Streaming, ו-Monaco Editor (`@monaco-editor/react`). ויזואליזציות בעזרת Recharts (גרפים).
* **Internationalization:** `next-intl` לתמיכה בריבוי שפות (i18n - עברית ואנגלית)
* **Email Service:** Nodemailer עם תמיכה בשירותי SMTP לשליחת התראות (Ethereal לבדיקות)
* **External Connections:** WordPress REST API, Open Journal Systems (OJS) REST API
* **Security & Integrity:** הצפנת AES-256-GCM לשמירת פרטי התחברות. בדיקת Plagiarism ואמינות מדעיים מול מערכות כדוגמת **Copyleaks**.

## היסטוריית פיתוח ושדרוגים (Phases 1-5)
עד כה הפרויקט עבר 5 שלבים מרכזיים, כולם **הושלמו בהצלחה**:
1. **שלב 1: תשתיות ודאטה בייס -** הקמת Next.js, מסד נתונים ב-Neon, אימות משתמשים (NextAuth), תכנון סכמות הנתונים, וממשק העלאת קבצים ראשוני המבוסס על ספריות פענוח (mammoth/pdf-parse).
2. **שלב 2: תזמור סוכני AI וחיפוש ספרות -** שילוב Inngest ליצירת שרשרת של 9 סוכני AI מתמחים (מ-Clarification Agent, דרך Planning, Execution, ועד QA ו-Compilation). שילוב Vercel AI SDK וחיבור למאגרי מידע אקדמיים.
3. **שלב 3: פיצ'רים מתקדמים וממשק תוצרים -** הקמת מערכת מעקב שינויים מתקדמת (DiffEditor ו-ReviewPanel), יצירת מאגר חוקי כתבי עת, התראות קופצות (Sonner), תמיכה בריבוי שפות (next-intl) ומחולל מסמכי Docx ו-Cover Letter. שולבו עורכי קוד וויזואליזציות מתקדמות (Monaco, Recharts).
4. **שלב 4: מודול הגשה אוטומטית ובקרת איכות -** יצירת יכולת להגיש ישירות למערכות OJS ו-WordPress, כולל הצפנת סיסמאות ובדיקות חיבוריות. הוטמעו התראות מייל (Nodemailer), שירותי זיהוי AI ופלגיאט (Integrity Scanner), ו-Upstash Rate Limiting להגנה. נכתבו סקריפטים לבדיקות עומסים ו-QA.
5. **שלב 5: אוטומציית מעגל ביקורת (Resubmission) -** הוספת סוכן ייעודי (Rebuttal Agent) להתמודדות עם הערות Reviewers, שמעדכן את המאמר ומייצר מכתב תגובה, מגובה בפלואו Inngest ועיצוב לממשק הזנת ההערות.
