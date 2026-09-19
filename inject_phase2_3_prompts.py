import re

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Step 13
content = re.sub(
    r'(id: 13, phase: 2,\n\s*title: \{ en: "13. Guideline Extraction".*?\n\s*description: \{.*?\},\n\s*)(icon: Search, tools: \[.*?\])',
    r'\1prompt: {\n      en: "Extract the formatting guidelines from the provided journal webpage. Return a structured JSON containing word limits, mandatory sections, and citation style rules.",\n      he: "חלץ את הנחיות העיצוב מתוך דף כתב העת שסופק. החזר JSON מובנה המכיל את מגבלות המילים, חלקי החובה וכללי סגנון הציטוט."\n    },\n    \2',
    content,
    flags=re.DOTALL
)

# Step 14
content = re.sub(
    r'(id: 14, phase: 2,\n\s*title: \{ en: "14. Manuscript Formatting".*?\n\s*description: \{.*?\},\n\s*)(icon: Scissors, tools: \[.*?\])',
    r'\1prompt: {\n      en: "Reformat the provided manuscript to adhere strictly to the target journal guidelines (JSON). Adjust headings, references, and spacing without altering the core scientific meaning.",\n      he: "עצב מחדש את כתב היד המצורף כך שיעמוד בקפדנות בהנחיות כתב העת (JSON). התאם כותרות, הפניות וריווח מבלי לשנות את המשמעות המדעית."\n    },\n    \2',
    content,
    flags=re.DOTALL
)

# Step 15
content = re.sub(
    r'(id: 15, phase: 2,\n\s*title: \{ en: "15. Compliance Validation".*?\n\s*description: \{.*?\},\n\s*)(icon: ListChecks, tools: \[.*?\])',
    r'\1prompt: {\n      en: "Cross-reference the formatted manuscript against the journal\'s formal guidelines. Perform a rigorous step-by-step checklist validation and report any missing compliance items.",\n      he: "הצלב את כתב היד המעוצב אל מול ההנחיות הרשמיות של כתב העת. בצע אימות קפדני לפי רשימת תיוג ודווח על כל סעיף שאינו עומד בדרישות."\n    },\n    \2',
    content,
    flags=re.DOTALL
)

# Step 17
content = re.sub(
    r'(id: 17, phase: 3,\n\s*title: \{ en: "17. Reviewer Mapping".*?\n\s*description: \{.*?\},\n\s*)(icon: GitMerge, tools: \[.*?\])',
    r'\1prompt: {\n      en: "Parse the rejection/revision letter. Isolate each individual critique, assign it to the specific reviewer (e.g., Reviewer 1, Reviewer 2), and categorize the severity of the requested change.",\n      he: "נתח את מכתב הביקורת. בודד כל הערה ספציפית, שייך אותה לסוקר הרלוונטי (למשל סוקר 1, סוקר 2), וסווג את רמת החומרה של השינוי המבוקש."\n    },\n    \2',
    content,
    flags=re.DOTALL
)

# Step 19
content = re.sub(
    r'(id: 19, phase: 3,\n\s*title: \{ en: "19. Directed Revision".*?\n\s*description: \{.*?\},\n\s*)(icon: Edit3, tools: \[.*?\])',
    r'\1prompt: {\n      en: "Implement the required changes in the manuscript according to the Rebuttal Strategy Document. Maintain the academic tone and ensure the edits directly address the reviewers\' concerns.",\n      he: "יישם את השינויים הנדרשים במאמר בהתאם למסמך אסטרטגיית התגובה. שמור על המשלב האקדמי וודא שהעריכה נותנת מענה ישיר לחששות הסוקרים."\n    },\n    \2',
    content,
    flags=re.DOTALL
)

# Step 20
content = re.sub(
    r'(id: 20, phase: 3,\n\s*title: \{ en: "20. Rebuttal Letter Generation".*?\n\s*description: \{.*?\},\n\s*)(icon: FileCheck, tools: \[.*?\])',
    r'\1prompt: {\n      en: "Draft the official \'Response to Reviewers\' letter. For each point, copy the original reviewer comment and provide our polite, detailed explanation of how the manuscript was amended.",\n      he: "נסח את מכתב ה\'תגובה לסוקרים\' הרשמי. עבור כל נקודה, העתק את הערת הסוקר המקורית וספק את ההסבר המנומס והמפורט שלנו כיצד תוקן המאמר."\n    },\n    \2',
    content,
    flags=re.DOTALL
)

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)

