from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def make_rtl(paragraph):
    """Sets paragraph direction to Right-to-Left."""
    pPr = paragraph._p.get_or_add_pPr()
    bidi = pPr.find(qn('w:bidi'))
    if bidi is None:
        bidi = OxmlElement('w:bidi')
        pPr.append(bidi)
    for run in paragraph.runs:
        run.font.rtl = True
        run.font.cs_bold = run.font.bold

document = Document()
document.core_properties.title = "תוכנית עבודה ומפרט טכני מלא - פרויקט PublishAI"

style = document.styles['Normal']
style.font.name = 'Arial'
style.font.rtl = True

# Title
title = document.add_heading("תוכנית עבודה ומפרט טכני מלא - פרויקט PublishAI", 0)
make_rtl(title)

# 1. Executive Summary
h1 = document.add_heading("1. תקציר מנהלים (Executive Summary)", level=1)
make_rtl(h1)
p1 = document.add_paragraph("מערכת SaaS חכמה המקבלת מאמרים אקדמיים ונתונים סטטיסטיים, ומעבירה אותם תהליך אוטומטי-למחצה (היברידי) להפיכתם למאמרים מוכנים לפרסום בכתבי עת מובילים. המערכת מתבססת על שרשרת של סוכני AI מתמחים, סביבות הרצת קוד מבודדות, אוטומציות להגשה \"מחקה אנוש\", וטיפול בדחיות או ביקורות עמיתים.")
make_rtl(p1)

# 2. Team
h2 = document.add_heading("2. צוות הפרויקט", level=1)
make_rtl(h2)
p2 = document.add_paragraph()
make_rtl(p2)
p2.add_run("מור וליאור: ").bold = True
p2.add_run("מייסדי הפרויקט (Founders). מור מובילה עסקית ויועצת בחוקי כתיבת מאמרים אקדמיים. ליאור מוביל את המוצר.\n")
p2.add_run("דניאל: ").bold = True
p2.add_run("מהנדסת תוכנה ואוטומציה (Software & Automation Engineer). מתכנתת ומובילה טכנולוגית של הפיתוח.\n")
p2.add_run("יעלי: ").bold = True
p2.add_run("יועצת מקצועית (Advisory) לפיתוח ולדאטה.")

# 3. Tech Stack
h3 = document.add_heading("3. ארכיטקטורה טכנולוגית (Tech Stack)", level=1)
make_rtl(h3)
tech_stack = [
    "Frontend & Backend: Next.js 14/16 (App Router), React 19, TypeScript, Tailwind CSS.",
    "Database & Storage: Neon Postgres (Serverless DB), Drizzle ORM, Vercel Blob.",
    "Orchestration: Inngest (ניהול סוכנים ברקע).",
    "AI Engine: Vercel AI SDK, Claude 3.5 Sonnet/Opus, LangGraph.",
    "Data Science: E2B Code Interpreter (להרצת קוד פייתון מבודד)."
]
for item in tech_stack:
    p = document.add_paragraph(item, style='List Bullet')
    make_rtl(p)

# 4. Phased Implementation
h4 = document.add_heading("4. תוכנית השלבים המשולבת (Phased Implementation)", level=1)
make_rtl(h4)
p_intro = document.add_paragraph("התוכנית מאחדת את הפיתוח שכבר בוצע יחד עם יעדי ה-Unknown Unknowns להשלמת המערכת.")
make_rtl(p_intro)

def add_stage(title_text, items):
    h = document.add_heading(title_text, level=2)
    make_rtl(h)
    for item in items:
        p = document.add_paragraph(item, style='List Bullet')
        make_rtl(p)

add_stage("שלב 1: תשתיות ליבה, מסד נתונים ואבטחה", [
    "הקמת הפרויקט: Next.js ב-Vercel.",
    "מסד נתונים ואימות: הגדרת Neon Postgres, Drizzle, ו-NextAuth להתחברות.",
    "העלאת קבצים: פיתוח Dashboard לגרירת קבצים וניהול אובטח של מידע (הצפנת AES-256-GCM)."
])

add_stage("שלב 2: מנוע סוכני AI מתקדם ומחקר (כולל Paywalls)", [
    "שרשרת הסוכנים: פיתוח ה-Pipeline של 9 סוכני AI המנוהלים ע\"י Inngest.",
    "חיבור למאגרי ספרות: אינטגרציה עם PubMed, Semantic Scholar, ו-arXiv.",
    "[חדש] מחקר מתקדם ועקיפת Paywalls: שילוב פתרונות מתקדמים (Proxy אקדמי / Scraping מבוסס הנחיות יעלי) לחילוץ מאמרים מלאים (Full-text)."
])

add_stage("שלב 3: ממשק משתמש וניהול גרסאות", [
    "מעקב שינויים: פיתוח DiffEditor ו-ReviewPanel המאפשרים למשתמש לאשר/לדחות שינויים של ה-AI ברמת הפסקה.",
    "תצוגה מקדימה: עורכי טקסט אינטראקטיביים (TipTap / Monaco)."
])

add_stage("שלב 4: דאטה סיינס ועיצוב מחמיר (Strict Formatting)", [
    "[חדש] סביבת סטטיסטיקה מבודדת: שדרוג האינטגרציה עם E2B Code Interpreter כך שה-AI יוכל לקבל קבצי CSV גולמיים, לכתוב ולהריץ עליהם סקריפטים בפייתון ולשלב מסקנות.",
    "[חדש] עיצוב מחמיר לתבנית המקור: פיתוח מנוע פירמוט מבוסס Pandoc או python-docx, שייצוק את התוצר הסופי בדיוק לתבנית ה-Word הנוקשה של כתב העת."
])

add_stage("שלב 5: בקרת איכות ורגולציית AI", [
    "Integrity Scanner: מנגנון לזיהוי פלגיאט ו\"שפת AI\".",
    "[חדש] מדיניות AI (Policy Check): שילוב בדיקה אוטומטית של חוקי כתב העת המיועד. במקרה שהז'ורנל דורש הצהרה, המערכת תשתול אוטומטית פסקת \"גילוי נאות\" במסמך."
])

add_stage("שלב 6: הגשה אוטומטית חכמה (Smart RPA Submission)", [
    "חיבור API: יכולת הגשה ישירה למערכות התומכות ב-OJS ו-WordPress.",
    "[חדש] בוט \"מחקה אנוש\" (Anti-Ban): פיתוח אוטומציית UI (Selenium/Playwright) לעיתונים מורכבים, הכוללת זמני השהייה אקראיים כדי לעקוף חסימות.",
    "[חדש] עצירה לתשלום (Pause for APC): עצירת האוטומציה ושליחת התראה למשתמש לבצע סליקה ידנית בכרטיס אשראי במידה והאתר דורש זאת."
])

add_stage("שלב 7: מעגל ביקורת ואסטרטגיית מפל (Cascade)", [
    "מעגל ביקורת (Resubmission): פיתוח RebuttalAgent שקולט את הערות ה-Reviewers, מנתח אותן ומייצר מכתב תגובה.",
    "[חדש] אסטרטגיית מפל בדחייה (Cascade): במקרה של דחייה סופית, המערכת תמליץ על 3 ז'ורנלים חלופיים, תבצע Re-formatting אוטומטי ותתחיל את תהליך ההגשה לעיתון החדש."
])

# Save as V2 so we don't overwrite the user's styled document
document.save("PublishAI_Project_Plan_Integrated.docx")
print("Integrated document saved successfully.")
