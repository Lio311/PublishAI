import re

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# I will use string replace to inject the prompt right after the `description: { ... },` of each step.

replacements = [
    (
        r'(id: 2, phase: 1,\n\s*title: \{ en: "2. Clarification Agent".*?\n\s*description: \{.*?\},\n)',
        r'\1    prompt: { \n      en: "You are an expert academic editor. Analyze the academic text provided and extract: 1. The main thesis / objective. 2. The primary field of study. 3. Any obvious missing sections (e.g., no Conclusion).", \n      he: "אתה עורך אקדמי מומחה. עליך לנתח את הטקסט האקדמי ולחלץ מתוכו: 1. את התזה המרכזית / המטרה. 2. את תחום המחקר העיקרי. 3. כל חסר בולט של חלקים במאמר (כגון היעדר מסקנות)." \n    },\n'
    ),
    (
        r'(id: 3, phase: 1,\n\s*title: \{ en: "3. Planning Agent".*?\n\s*description: \{.*?\},\n)',
        r'\1    prompt: { \n      en: "You are an expert academic planner. Based on the clarification analysis and the manuscript, create a structural revision plan for this paper. Identify weaknesses, required citations, and sections to rewrite.", \n      he: "אתה מתכנן אקדמי מומחה. בהתבסס על ניתוח הבירור והמאמר שהוזן, צור תוכנית שכתוב מבנית עבור מאמר זה. עליך לזהות חולשות, ציטוטים חסרים נדרשים ופסקאות שדורשות שכתוב." \n    },\n'
    ),
    (
        r'(id: 4, phase: 1,\n\s*title: \{ en: "4. Knowledge Agent".*?\n\s*description: \{.*?\},\n)',
        r'\1    prompt: { \n      en: "Extract 3 main search queries for academic literature based on this text. Output ONLY the 3 queries, separated by commas, with no additional text, numbering, or formatting.", \n      he: "חלץ 3 שורות חיפוש עיקריות לספרות אקדמית בהתבסס על הטקסט. פלוט *אך ורק* את 3 שורות החיפוש, מופרדות בפסיקים, ללא טקסט נוסף, מספור או עיצוב כלשהו." \n    },\n'
    ),
    (
        r'(id: 5, phase: 1,\n\s*title: \{ en: "5. Visual & Data Verification".*?\n\s*description: \{.*?\},\n)',
        r'\1    prompt: { \n      en: "Generate a simulated peer-review report for this final manuscript provided.", \n      he: "צור דוח הדמיה של ביקורת עמיתים (Peer Review) עבור גרסת המאמר הסופית שהוזנה." \n    },\n'
    ),
    (
        r'(id: 6, phase: 1,\n\s*title: \{ en: "6. Scientific Debate Panel".*?\n\s*description: \{.*?\},\n)',
        r'\1    prompt: { \n      en: "Reviewer 1 (GPT-4o): You are a rigorous, constructive, and demanding peer reviewer for a top-tier scientific journal...\\n\\nReviewer 2 (Claude 3.5): You are an elite academic co-author and principal investigator specialized in scientific writing...\\n\\nReviewer 3 (Gemini 1.5): You are a visionary research scientist synthesizing prior literature and exploring novel connections...", \n      he: "סוקר 1 (GPT-4o): אתה סוקר עמיתים קפדני, ביקורתי ותובעני מטעם כתב עת מדעי מהשורה הראשונה...\\n\\nסוקר 2 (Claude 3.5): אתה סופר וחוקר ראשי מהאליטה האקדמית, המתמחה בכתיבה מדעית למגזינים בעלי אימפקט גבוה...\\n\\nסוקר 3 (Gemini 1.5): אתה מדען מחקר בעל חזון שמסנתז ספרות קודמת ומגלה קשרים חדשניים..." \n    },\n'
    ),
    (
        r'(id: 7, phase: 1,\n\s*title: \{ en: "7. Area Chair".*?\n\s*description: \{.*?\},\n)',
        r'\1    prompt: { \n      en: "System Context: You are the Area Chair and Meta-Reviewer. Deeply analyze and synthesize the diverse (and sometimes conflicting) feedback from the panel of specialized reviewers. Employ advanced multi-step logical reasoning to weigh the validity of each critique. Formulate a final structured decision, resolve contradictions, and outline a prioritized master revision plan for the execution agents.", \n      he: "הקשר מערכת: אתה \'יושב ראש התחום\' (Area Chair) וסוקר-העל. עליך לנתח לעומק ולסנתז את המשוב המגוון (ולעיתים סותר) מפאנל הסוקרים המומחים. הפעל חשיבה לוגית רב-שלבית ומתקדמת כדי לשקול את התוקף של כל ביקורת. נסח החלטה מובנית סופית, פתור סתירות, והכן תוכנית-אב אופרטיבית ומתועדפת עבור סוכני הביצוע." \n    },\n'
    ),
    (
        r'(id: 8, phase: 1,\n\s*title: \{ en: "8. Academic Writing Agent".*?\n\s*description: \{.*?\},\n)',
        r'\1    prompt: { \n      en: "Rewrite the text to elevate the academic tone, address the following review feedback, and remove any generic AI-sounding phrases.", \n      he: "שכתב את הטקסט כדי להעלות את המשלב האקדמי שלו, לטפל במשוב מהביקורת, ולהסיר כל ביטוי גנרי שנשמע כאילו נכתב על ידי AI." \n    },\n'
    ),
    (
        r'(id: 10, phase: 1,\n\s*title: \{ en: "10. QA Agent".*?\n\s*description: \{.*?\},\n)',
        r'\1    prompt: { \n      en: "Check the academic text provided for spelling errors, inconsistency, and unreferenced figures/tables.", \n      he: "בדוק את הטקסט האקדמי שהוזן וחפש שגיאות כתיב, חוסר עקביות ותרשימים/טבלאות שאינם מצוטטים בגוף הטקסט." \n    },\n'
    ),
    (
        r'(id: 11, phase: 1,\n\s*title: \{ en: "11. Compilation & Export".*?\n\s*description: \{.*?\},\n)',
        r'\1    prompt: { \n      en: "You are an academic editor. Write a professional cover letter for the following manuscript being submitted to the journal. Ensure it follows this structure: 1. Address the Editor in Chief. 2. State the title of the manuscript and intent to submit. 3. Briefly highlight the main findings and significance. 4. Confirm it has not been published elsewhere. 5. Provide contact info.", \n      he: "אתה עורך אקדמי. כתוב מכתב מקדים (Cover Letter) מקצועי עבור המאמר המוגש לכתב העת. עליך לוודא שהוא עוקב אחר המבנה הבא: 1. פנייה לעורך הראשי. 2. ציון כותרת המאמר. 3. הדגשה של הממצאים העיקריים והחשיבות. 4. אישור שהמאמר לא פורסם בשום מקום אחר. 5. פרטי התקשרות." \n    },\n'
    ),
    (
        r'(id: 18, phase: 3,\n\s*title: \{ en: "18. Rebuttal Strategy".*?\n\s*description: \{.*?\},\n)',
        r'\1    prompt: { \n      en: "You are a senior academic editor. The author has received reviewer comments. To enhance the creativity and robustness of the rebuttal, consider cross-domain analogies. Generate a \'Response to Reviewers\' strategy document proposing clear, actionable changes. Format as: 1. Reviewer\'s Point 2. Proposed Change 3. Draft Rebuttal Text.", \n      he: "אתה עורך אקדמי בכיר. המחבר קיבל הערות מסוקרים. כדי לשפר את היצירתיות והחוסן של מכתב התגובה, היעזר באנלוגיות חוצות-תחומים. צור מסמך אסטרטגיה של \'תגובה לסוקרים\' ובו שינויים ברורים ויישומים. עצב זאת כ: 1. נקודת הביקורת 2. השינוי המוצע למאמר 3. טיוטת טקסט התגובה (מה להגיד לסוקר)." \n    },\n'
    )
]

for pat, repl in replacements:
    content = re.sub(pat, repl, content, flags=re.DOTALL)

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)

