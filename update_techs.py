import re

with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "r") as f:
    content = f.read()

# Phase 1
content = content.replace("techs={['Next.js 16', 'Tiptap']}", "techs={['Next.js 16', 'Tailwind CSS', 'Vercel Blob']}")
content = content.replace("techs={['Mammoth', 'PDF Parser']}", "techs={['Vercel AI SDK', 'Mammoth', 'PDF Parser']}")
content = content.replace("techs={['Claude 3.5 Haiku', 'Zod']}", "techs={['Claude 3.5 Haiku', 'Zod']}")
content = content.replace("titleEn=\"Save Record\" titleHe=\"שמירת רשומה\" descEn=\"Save initial record to 'papers' table.\" descHe=\"שמירת רשומה ראשונית בטבלת 'papers'\" techs={['Neon Postgres']}", "titleEn=\"Save Record\" titleHe=\"שמירת רשומה\" descEn=\"Save initial record to 'papers' table.\" descHe=\"שמירת רשומה ראשונית בטבלת 'papers'\" techs={['Neon Postgres', 'Drizzle ORM']}")

# Phase 2
content = content.replace("techs={['LangGraph', 'Langfuse']}", "techs={['LangGraph', 'Langfuse', 'Vercel AI SDK']}")
content = content.replace("titleEn=\"7. PlanningAgent\" titleHe=\"7. סוכן תכנון\" descEn=\"Generates step-by-step editorial plan\" descHe=\"יצירת תוכנית עריכה שלב אחר שלב\" techs={['Claude 3.7']}", "titleEn=\"7. PlanningAgent\" titleHe=\"7. סוכן תכנון\" descEn=\"Generates step-by-step editorial plan\" descHe=\"יצירת תוכנית עריכה שלב אחר שלב\" techs={['Claude 3.7 Sonnet']}")
content = content.replace("titleEn=\"8. KnowledgeAgent\" titleHe=\"8. סוכן ידע\" descEn=\"Web search & literature retrieval\" descHe=\"חיפוש רשת ושליפת ספרות מקצועית\" techs={['MCP', 'pgvector']}", "titleEn=\"8. KnowledgeAgent\" titleHe=\"8. סוכן ידע\" descEn=\"Web search & literature retrieval\" descHe=\"חיפוש רשת ושליפת ספרות מקצועית\" techs={['MCP', 'pgvector', 'LangChain']}")
content = content.replace("techs={['GPT-4o', 'Gemini 1.5']}", "techs={['GPT-4o-mini', 'Gemini 1.5 Pro']}")
content = content.replace("techs={['OpenAI o1']}", "techs={['o1-preview']}")
content = content.replace("techs={['Claude 3.7', 'Langfuse']}", "techs={['Claude 3.7 Sonnet', 'E2B Code Interpreter']}")
content = content.replace("techs={['Claude 3.7', 'Tiptap']}", "techs={['Claude 3.7 Sonnet']}")
content = content.replace("titleEn=\"15. VerificationAgent\" titleHe=\"15. סוכן אימות\" descEn=\"Verifies journal guidelines are met\" descHe=\"וידאו עמידה בהנחיות כתב העת\" techs={['Claude 3.7']}", "titleEn=\"15. VerificationAgent\" titleHe=\"15. סוכן אימות\" descEn=\"Verifies journal guidelines are met\" descHe=\"וידאו עמידה בהנחיות כתב העת\" techs={['Claude 3.5 Haiku']}")
content = content.replace("titleEn=\"16. CoverLetterAgent\" titleHe=\"16. סוכן מכתב מקדים\" descEn=\"Generates customized cover letter\" descHe=\"כתיבת מכתב מקדים מותאם אישית\" techs={['Claude 3.7', 'Jest']}", "titleEn=\"16. CoverLetterAgent\" titleHe=\"16. סוכן מכתב מקדים\" descEn=\"Generates customized cover letter\" descHe=\"כתיבת מכתב מקדים מותאם אישית\" techs={['Claude 3.7 Sonnet']}")
content = content.replace("titleEn=\"17. CompilationAgent\" titleHe=\"17. סוכן הידור\" descEn=\"Compiles final text and metadata\" descHe=\"חיבור הטקסט הסופי והמטא-דאטה\" techs={['OpenAI o1']}", "titleEn=\"17. CompilationAgent\" titleHe=\"17. סוכן הידור\" descEn=\"Compiles final text and metadata\" descHe=\"חיבור הטקסט הסופי והמטא-דאטה\" techs={['o1-preview', 'Vercel Blob']}")

# Phase 3
content = content.replace("techs={['Next.js 16']}", "techs={['Next.js 16', 'NextAuth.js']}")

# Phase 5
content = content.replace("titleEn=\"36. Queue\" titleHe=\"36. תור\" descEn=\"Event: 'comments-received'\" descHe=\"אירוע: התקבלו הערות סוקרים\" techs={['Inngest']}", "titleEn=\"36. Cron / Webhook\" titleHe=\"36. סורק מתוזמן / Webhook\" descEn=\"Cron polls portal OR parses Email\" descHe=\"Cron סורק סטטוס או זיהוי מייל נכנס\" techs={['Inngest Cron', 'IMAP']}")
content = content.replace("titleEn=\"38. RebuttalAgent\" titleHe=\"38. סוכן תגובה\" descEn=\"Read critique → Generate rebuttalStrategy\" descHe=\"קריאת הביקורת → יצירת אסטרטגיית תגובה\" techs={['OpenAI o1', 'Mem0']}", "titleEn=\"38. RebuttalAgent\" titleHe=\"38. סוכן תגובה\" descEn=\"Read critique → Generate rebuttalStrategy\" descHe=\"קריאת הביקורת → יצירת אסטרטגיית תגובה\" techs={['o1-preview', 'Mem0']}")

with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "w") as f:
    f.write(content)
