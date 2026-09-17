from docx import Document
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def make_rtl(paragraph):
    pPr = paragraph._p.get_or_add_pPr()
    bidi = pPr.find(qn('w:bidi'))
    if bidi is None:
        bidi = OxmlElement('w:bidi')
        pPr.append(bidi)
    for run in paragraph.runs:
        run.font.rtl = True
        run.font.cs_bold = run.font.bold

def delete_paragraph(paragraph):
    p = paragraph._element
    p.getparent().remove(p)
    p._p = p._element = None

doc = Document('PublishAI_Product_Roadmap_Backup.docx')

# 1. Delete everything starting from paragraph 18
paragraphs_to_delete = doc.paragraphs[18:]
for p in paragraphs_to_delete:
    delete_paragraph(p)

# Helper for adding paragraphs
def add_p(text, style='Normal', bold_prefix=None, blue_prefix=False):
    p = doc.add_paragraph(style=style)
    make_rtl(p)
    if bold_prefix:
        if text.startswith(bold_prefix):
            r = p.add_run(bold_prefix)
            r.bold = True
            if blue_prefix:
                r.font.color.rgb = RGBColor(0, 0, 255)
            r.font.rtl = True
            r.font.cs_bold = True
            
            rest = text[len(bold_prefix):]
            r2 = p.add_run(rest)
            r2.font.rtl = True
        else:
            r = p.add_run(text)
            r.font.rtl = True
    else:
        r = p.add_run(text)
        r.font.rtl = True
    return p

# 2. Add the systems section
add_p("")
add_p("מערכות הגשה (Submission Systems) נתמכות:", bold_prefix="מערכות הגשה (Submission Systems) נתמכות:")
add_p("המערכת תידרש לדעת להתמודד, להתממשק ולהגיש אוטומטית למגוון הרחב של מערכות ההגשה הקיימות כיום בשוק העולמי, ביניהן:")
add_p("Editorial Manager: מערכת מסחרית מבית Aries Systems. זוהי אחת המערכות הנפוצות בעולם, והיא נמצאת בשימוש רחב של הוצאות לאור גדולות כגון Elsevier, SpringerNature, ו-Wiley.", style='List Bullet', bold_prefix="Editorial Manager: ")
add_p("ScholarOne Manuscripts: מערכת מסחרית מבית Clarivate (לשעבר מבית Thomson Reuters). המערכת משמשת הוצאות מרכזיות רבות, ביניהן Taylor & Francis, IEEE, ו-Oxford University Press.", style='List Bullet', bold_prefix="ScholarOne Manuscripts: ")
add_p("Open Journal Systems (OJS): פלטפורמת קוד פתוח חינמית שפותחה על ידי ה-Public Knowledge Project. היא פופולרית מאוד בקרב כתבי עת עצמאיים, אוניברסיטאיים, ומוסדות אקדמיים המעוניינים לנהל את תהליך ההגשה והשיפוט ללא עלויות רישוי גבוהות.", style='List Bullet', bold_prefix="Open Journal Systems (OJS): ")
add_p("eJournalPress: מערכת המשמשת מו\"לים אקדמיים נוספים הדורשים תמיכה באוטומציית טפסים.", style='List Bullet', bold_prefix="eJournalPress: ")

# 3. Add Stage 1
add_p("")
add_p("שלב 1: מחקר, מדיניות, סטטסיטיקה וכתיבת המאמר", bold_prefix="שלב 1: מחקר, מדיניות, סטטסיטיקה וכתיבת המאמר", blue_prefix=True)
add_p("מטרה: בדיקת מדיניות חוקית של הז'ורנלים כלפי AI, אפיון ה-20 ז'ורנלים המרכזיים, מחקר ספרות מלא, ניתוח אוטומטי, וכתיבה שאינה מזוהה כ-AI.", bold_prefix="מטרה: ")
add_p("לו\"ז מוערך: 4-6 שבועות.", bold_prefix="לו\"ז מוערך: ")
add_p("פעולות מרכזיות:", bold_prefix="פעולות מרכזיות:")
add_p("מחקר מדיניות (Policy Check): וידוא האם העיתונים אוסרים על כתיבה/סיוע באמצעות AI, ומה דרישות הגילוי הנאות (Disclosure) שלהם.", style='List Bullet')
add_p("אפיון מקצה לקצה (בהנחיית מור): מיפוי 20 עיתונים, כללי ציטוט, דרישות מבוא ו-Cover letter.", style='List Bullet')
add_p("איסוף נתונים: גישה למאמרים מלאים (Full-text) תוך עקיפת Paywalls (באמצעות Proxy – סיוע מיעלי).", style='List Bullet')
add_p("ניתוח נתונים (Stats): ה-AI קורא קבצי CSV ומריץ עליהם קוד סטטיסטי בסביבת Sandbox לחילוץ מסקנות.", style='List Bullet')
add_p("כתיבת המאמר ויצירת גרפים באמצעות פייתון.", style='List Bullet')
add_p("דרישות פיתוחיות וטכנולוגיות:", bold_prefix="דרישות פיתוחיות וטכנולוגיות:")
add_p("דניאל תפתח סקריפטים מבוססי Pandoc/python-docx שימירו את הפלט ישירות לפורמט ה-Word הספציפי.", style='List Bullet')
add_p("הקמת סביבת Python Sandbox מאובטחת שבה ה-AI יכול להריץ קוד סטטיסטי.", style='List Bullet')
add_p("שילוב פסקת 'גילוי נאות' גמישה בפרומפטים במידה והז'ורנל דורש הצהרה על שימוש ב-AI.", style='List Bullet')
add_p("ולידציה:", bold_prefix="ולידציה:")
add_p("בדיקת אנטי-פלגיאט (Turnitin).", style='List Bullet')
add_p("וידוא משפטי/תקנוני שאנחנו לא מפרים את מדיניות ה-AI של העיתון המוגש.", style='List Bullet')

# 4. Add Stage 2
add_p("")
add_p("שלב 2: התממשקות להגשה אוטומטית (Automated Submission)", bold_prefix="שלב 2: התממשקות להגשה אוטומטית (Automated Submission)", blue_prefix=True)
add_p("מטרה: חיבור אוטומטי (RPA) למערכת ההגשה, בצורה המחקה התנהגות אנושית, עם יכולת לעצירה והתערבות אנושית.", bold_prefix="מטרה: ")
add_p("לו\"ז מוערך: 3-4 שבועות.", bold_prefix="לו\"ז מוערך: ")
add_p("פעולות מרכזיות:", bold_prefix="פעולות מרכזיות:")
add_p("בדיקת תנאי השימוש (ToS) של מערכות ההגשה (כגון Editorial Manager) בנוגע לשימוש בבוטים, והתאמת קצב הריצה כדי לא לקבל חסימה (Ban).", style='List Bullet')
add_p("פיתוח מנגנון הזדהות, מילוי טפסים, והעלאת מסמכים.", style='List Bullet')
add_p("מנגנון 'Pause & Resume': הבוט נעצר במסכים מסובכים, שולח התראה, ממתין שהמשתמש יזין את המידע, וממשיך.", style='List Bullet')
add_p("עצירה לתשלום (APC): הבוט שולח לינק והמשתמש מבצע את התשלום ידנית.", style='List Bullet')
add_p("דרישות פיתוחיות וטכנולוגיות:", bold_prefix="דרישות פיתוחיות וטכנולוגיות:")
add_p("פיתוח RPA על ידי דניאל (Selenium/Playwright) הכולל השהיות אקראיות (Human-like delays) כדי לא לעורר חשד של מנגנוני Anti-Bot.", style='List Bullet')
add_p("מערכת התראות משתמש (Slack/Email/Web UI) להתערבות אנושית.", style='List Bullet')
add_p("ולידציה:", bold_prefix="ולידציה:")
add_p("ביצוע 5 הגשות ניסיון (טסטים) ללא קריסת המערכת או קבלת חסימת IP מהשרת.", style='List Bullet')

# 5. Add Stage 3
add_p("")
add_p("שלב 3: הפינג-פונג (Peer Review) ואסטרטגיית מפל (Cascade)", bold_prefix="שלב 3: הפינג-פונג (Peer Review) ואסטרטגיית מפל (Cascade)", blue_prefix=True)
add_p("מטרה: ניהול ביקורות, תיקונים אוטומטיים, והגשות מחדש במקרה של דחייה.", bold_prefix="מטרה: ")
add_p("לו\"ז מוערך: 2-6 שבועות.", bold_prefix="לו\"ז מוערך: ")
add_p("פעולות מרכזיות:", bold_prefix="פעולות מרכזיות:")
add_p("קליטה אוטומטית של החלטת העיתון (Decision letter).", style='List Bullet')
add_p("ניתוח ביקורות סוקרים והכנת מכתב תגובה ותיקוני טקסט/גרפים בהתאמה.", style='List Bullet')
add_p("אסטרטגיית מפל (דחייה): במקרה של Reject, המערכת תציע למשתמש רשימת ז'ורנלים חלופיים. לאחר בחירת המשתמש, דניאל (המערכת) תפרמט הכל מחדש לפורמט החדש ותגיש.", style='List Bullet')
add_p("דרישות פיתוחיות וטכנולוגיות:", bold_prefix="דרישות פיתוחיות וטכנולוגיות:")
add_p("מנגנון AI לניתוח ביקורות והצעת ז'ורנלים חלופיים (Recommendation Engine).", style='List Bullet')
add_p("סקריפטים להתאמה מחדש (Re-formatting) לז'ורנל חלופי בלחיצת כפתור.", style='List Bullet')
add_p("ולידציה:", bold_prefix="ולידציה:")
add_p("וידוא אנושי למכתבי תגובה ולבחירת הז'ורנל החלופי לפני יריית ההגשה.", style='List Bullet')

# 6. Add Claude API Budget
doc.add_page_break()
add_p("הערכת תקציב כלים ומודלי שפה (Claude API)", bold_prefix="הערכת תקציב כלים ומודלי שפה (Claude API)")
add_p("התקציב לוקח בחשבון שריצות רבות ייעצרו או ייכשלו (Buffer פיתוח).")
add_p("")

# Create table
table = doc.add_table(rows=1, cols=4)
table.style = 'Table Grid'
# Ensure RTL for table
tblPr = table._element.xpath('w:tblPr')
if tblPr:
    bidiVisual = OxmlElement('w:bidiVisual')
    tblPr[0].append(bidiVisual)

hdr_cells = table.rows[0].cells
headers = ["סעיף / שלב", "תיאור פעילות", "הערכת קלט (טוקנים)", "הערכת פלט (טוקנים)"]
for i, header in enumerate(headers):
    hdr_cells[i].text = header
    make_rtl(hdr_cells[i].paragraphs[0])
    for run in hdr_cells[i].paragraphs[0].runs:
        run.bold = True
        run.font.cs_bold = True

data = [
    ("שלב 1", "מחקר Full-text, מדיניות, סטטיסטיקה וקוד", "650,000", "50,000"),
    ("שלב 2", "אוטומציית הגשה (RPA) מחקה-אנוש", "150,000", "5,000"),
    ("שלב 3", "ניתוח ביקורות / המלצות Cascade", "200,000", "20,000"),
    ("סה\"כ לריצה", "מסלול ללא שגיאות", "1,000,000", "75,000"),
    ("סה\"כ (20 טסטים)", "כולל מקדם דיבוג (Buffer פי 2.5)", "50,000,000 (50M)", "3,750,000 (3.75M)")
]

for row_data in data:
    row_cells = table.add_row().cells
    for i, item in enumerate(row_data):
        row_cells[i].text = item
        make_rtl(row_cells[i].paragraphs[0])

add_p("")
add_p("סיכום עלויות מוערך (חודש פיתוח):", bold_prefix="סיכום עלויות מוערך (חודש פיתוח):")
add_p("- Claude API (קלט/פלט מורחבים): כ-$300 בחודש.")
add_p("- מנוי Claude Code: $100 בחודש.")
add_p("- סה\"כ: כ-$300 בחודש לפיתוח.", bold_prefix="- סה\"כ: ")

doc.save('PublishAI_Product_Roadmap.docx')
print("Successfully modified PublishAI_Product_Roadmap.docx in-place!")
