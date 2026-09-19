import re

with open('src/app/[locale]/architecture/ArchitectureClient.tsx', 'r') as f:
    content = f.read()

# Replace steps 16 to 22 (the end of the array)
# Step 16 current string
step_16_start = '  {\n    id: 16, phase: 2,'

new_steps = """  {
    id: 16, phase: 2,
    title: { en: "16. RPA Login & Navigation", he: "16. ניווט והתחברות אוטומטית (RPA)" },
    description: { 
      en: "A Robotic Process Automation (RPA) bot powered by Playwright navigates the target journal's portal, executing automated logins using the user's stored OAuth or app-password credentials.",
      he: "בוט אוטומציה (RPA) המופעל על ידי Playwright מנווט אל מערכת ההגשות של העיתון ומתחבר עצמאית בעזרת פרטי ההזדהות (OAuth או סיסמאות יישום) שהוגדרו."
    },
    prompt: { 
      en: "SYSTEM: You are a secure Web Automation Navigation Agent.\\nTASK: Access the target journal submission platform.\\n1. Safely retrieve encrypted user credentials from the database.\\n2. Navigate the headless browser to the journal's login endpoint.\\n3. Identify DOM elements for username, password, and submit button.\\n4. Execute login, handle cookies, and navigate to the 'New Submission' dashboard.\\nOUTPUT: Navigation success state or explicit error for invalid credentials.", 
      he: "מערכת: אתה סוכן אוטומציית ניווט מאובטח.\\nמשימה: גש למערכת ההגשות של העיתון.\\n1. שלוף בבטחה את פרטי ההזדהות המוצפנים של המשתמש מהמסד.\\n2. נווט בדפדפן הנסתר לעמוד ההתחברות של העיתון.\\n3. זהה אלמנטים ב-DOM להזנת שם משתמש, סיסמה ולחיצה על התחברות.\\n4. בצע התחברות, שמור עוגיות (Cookies) ונווט למסך 'הגשה חדשה'.\\nפלט: סטטוס הצלחת ניווט או שגיאה מפורשת על פרטים שגויים." 
    },
    icon: Globe, tools: ["Playwright", "Puppeteer API", "Node.js"],
    color: "bg-pink-50 text-pink-700 border-pink-200"
  },
  {
    id: 17, phase: 2,
    title: { en: "17. Form Filling & Metadata", he: "17. מילוי טפסים ופרטי מחברים" },
    description: { 
      en: "Agent reads the journal's dynamic HTML forms, maps the paper's metadata (Abstract, Authors, Institutions, Conflicts of Interest), and automatically injects them into the respective fields.",
      he: "הסוכן סורק את טופסי ה-HTML הדינמיים בעיתון, ממפה את פרטי המאמר (תקציר, שמות מחברים, מוסדות, ניגודי עניינים) ומזריק אותם אוטומטית לשדות המתאימים."
    },
    prompt: { 
      en: "SYSTEM: You are a DOM-parsing and Data-Entry Agent.\\nTASK: Fill out the journal's complex multi-page submission form.\\n1. Scan the current page for input fields, textareas, and select dropdowns.\\n2. Cross-reference the required fields with the manuscript's JSON metadata.\\n3. Map and type out all fields automatically (e.g., matching 'Corresponding Author' to the user's profile).\\n4. Upload the required files (Manuscript, Cover Letter, Figures) into the correct dropzones.\\nOUTPUT: State verification that all mandatory fields are satisfied.", 
      he: "מערכת: אתה סוכן ניתוח DOM והזנת נתונים.\\nמשימה: מלא את טופס ההגשה מרובה-הדפים של העיתון.\\n1. סרוק את העמוד הנוכחי לאיתור שדות טקסט, תפריטי בחירה ואזורי גרירה.\\n2. הצלב את השדות הנדרשים עם המטא-דאטה של המאמר (JSON).\\n3. הזן את כל הנתונים הרלוונטיים (לדוגמה, חיבור 'המחבר המייצג' לפרופיל המשתמש).\\n4. העלה את הקבצים הנדרשים (קובץ המאמר, מכתב מלווה, איורים) לאזורים הנכונים.\\nפלט: אישור סטטוס שכל השדות החובה מולאו כהלכה." 
    },
    icon: Edit3, tools: ["Playwright", "Claude 3.5", "Vision AI"],
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
      en: "SYSTEM: You are an Exception Handling & Alert Agent.\\nTASK: Monitor the RPA pipeline for roadblocks.\\n1. Detect presence of Cloudflare turnstiles, reCAPTCHA, or unexpected modal dialogs.\\n2. If detected, pause the Playwright script indefinitely.\\n3. Capture the HTML state and a screenshot. Send a WebSocket ping to the frontend Dashboard.\\n4. Serve a secure iframe or remote-desktop link so the user can solve the challenge.\\nOUTPUT: Resumes the script only when the user clicks 'Verification Complete'.", 
      he: "מערכת: אתה סוכן טיפול בחריגים והתראות.\\nמשימה: נטר את תהליך ה-RPA לאיתור חסימות.\\n1. מצא נוכחות של חסמי אבטחה (Cloudflare, reCAPTCHA) או חלונות קופצים בלתי צפויים.\\n2. אם זוהתה חסימה, הקפא את הסקריפט באופן מלא.\\n3. צלם מסך של המצב הנוכחי ושלח פולס (Ping) ב-WebSocket לדשבורד של המשתמש.\\n4. פתח חלון מאובטח (iframe) שמאפשר למשתמש לפתור את האתגר מתוך המערכת שלנו.\\nפלט: חידוש הסקריפט יתבצע אך ורק כשהמשתמש מאשר שסיים את ההתערבות הידנית." 
    },
    icon: ShieldCheck, tools: ["WebSockets", "Vercel AI SDK", "Puppeteer API"],
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
      en: "SYSTEM: You are the Final Submission Gatekeeper.\\nTASK: Execute the finalization of the journal submission.\\n1. Navigate to the final review page of the journal's portal.\\n2. Extract the summary PDF or HTML and push it to the user's dashboard.\\n3. Wait for the explicit 'Approve & Submit' API call from the user.\\n4. Click the final Submit button, intercept the success screen, and parse the Manuscript ID/Tracking Number.\\nOUTPUT: The confirmed Manuscript ID written to the Neon database.", 
      he: "מערכת: אתה סוכן אישור ההגשה הסופית.\\nמשימה: בצע את השלמת ההגשה מול מערכת העיתון.\\n1. נווט לעמוד הסיכום הסופי בפורטל העיתון.\\n2. חלץ את סיכום ההגשה (PDF/HTML) והצג אותו בדשבורד המשתמש לאישור.\\n3. המתן לקריאת ה-API 'Approve & Submit' מאת המשתמש.\\n4. לחץ על כפתור השליחה הסופי, תעד את מסך ההצלחה וחלץ את מספר המעקב (Manuscript ID).\\nפלט: עדכון מספר המעקב במסד הנתונים של PublishAI." 
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
      en: "SYSTEM: You are a Document Extractor.\\nTASK: Parse an uploaded PDF/Docx containing peer review feedback.\\n1. Strip out headers, journal branding, and boilerplate text.\\n2. Isolate the core feedback section where Reviewer 1, Reviewer 2, and the Editor leave their detailed comments.\\n3. Normalize the text into a clean Markdown format for the next agent.\\nOUTPUT: Raw but cleaned text of peer review feedback.", 
      he: "מערכת: אתה מחלץ מסמכים מתקדם.\\nמשימה: נתח קובץ PDF/Docx שהועלה המכיל ביקורת סוקרים.\\n1. סנן כותרות, לוגואים של העיתון וטקסטים גנריים.\\n2. בודד את חלקי הביקורת המרכזיים שבהם סוקר 1, סוקר 2 והעורך השאירו את הערותיהם המפורטות.\\n3. נרמל את הטקסט לפורמט Markdown נקי עבור הסוכן הבא.\\nפלט: טקסט נקי המכיל את נטו ביקורת הסוקרים." 
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
      en: "SYSTEM: You are a Peer Review Analyst.\\nTASK: Deconstruct the peer review text into an array of isolated, distinct comments.\\n1. Identify when a new point is being raised by a reviewer.\\n2. Extract the exact text of the comment.\\n3. Classify it as Major Revision (methodological flaws, requires new data) or Minor Revision (typos, clarifications, formatting).\\nOUTPUT: A JSON array of 'ReviewComment' objects.", 
      he: "מערכת: אתה מנתח ביקורות עמיתים.\\nמשימה: פרק את מכתב הביקורת למערך של הערות בודדות ונפרדות.\\n1. זהה מתי הסוקר עובר לנקודה או להערה חדשה.\\n2. חלץ את הטקסט המדויק של ההערה.\\n3. סווג אותה כ'תיקון מהותי' (כשלים מתודולוגיים, צורך בנתונים חדשים) או 'תיקון משני' (שגיאות כתיב, הבהרות, עיצוב).\\nפלט: מערך JSON של אובייקטים מסוג 'ReviewComment'." 
    },
    icon: GitMerge, tools: ["Claude 3.5", "Vercel AI SDK"],
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
      en: "SYSTEM: You are an Area Chair directing a revision.\\nTASK: Formulate an action plan for every ReviewComment.\\n1. For each comment, determine: Does this require altering the manuscript, or just a polite refutation?\\n2. If altering the manuscript, pinpoint the exact section (e.g., 'Methods: Data Collection').\\n3. Generate a draft response to the reviewer thanking them and explaining how it was addressed.\\nOUTPUT: Strategic action items appended to each ReviewComment.", 
      he: "מערכת: אתה סוכן-על (Area Chair) המנחה תהליך R&R.\\nמשימה: גבש תוכנית פעולה אסטרטגית עבור כל ReviewComment.\\n1. עבור כל הערה, קבע: האם נדרש שינוי בכתב היד, או שניתן להפריך אותה בנימוס מבוסס ספרות?\\n2. אם נדרש שינוי, סמן את הפסקה המדויקת במאמר (למשל 'פרק שיטות').\\n3. נסח טיוטת תגובה לסוקר המודה לו ומסבירה כיצד ההערה טופלה.\\nפלט: סעיפי פעולה אסטרטגיים המוצמדים לכל הערת סוקר." 
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
      en: "SYSTEM: You are the Targeted Execution Agent.\\nTASK: Modify the manuscript exactly according to the Rebuttal Strategy.\\n1. Locate the specific paragraphs identified by the Area Chair.\\n2. Execute the required rewriting, preserving the surrounding context perfectly.\\n3. Output a diff (Track Changes) showing only the newly modified areas so the human author can review them easily.\\nOUTPUT: Updated manuscript with localized diffs.", 
      he: "מערכת: אתה סוכן ביצוע ממוקד-מטרה.\\nמשימה: שנה את כתב היד בדיוק לפי אסטרטגיית המענה.\\n1. אתר את הפסקאות הספציפיות שסומנו על ידי סוכן-העל.\\n2. בצע את השכתוב הנדרש, תוך שמירה מושלמת על ההקשר הסובב.\\n3. הפק מסמך עם סימוני שינויים (Track Changes) שיציג אך ורק את החלקים שעודכנו כדי שהמחבר יוכל לבחון אותם.\\nפלט: כתב היד המעודכן עם סימוני Diff." 
    },
    icon: Code, tools: ["Claude 3.5"],
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
      en: "SYSTEM: You are an Academic Letter Generator.\\nTASK: Compile the final 'Response to Reviewers' letter.\\n1. Use a highly formal, respectful, and appreciative academic tone.\\n2. Format the letter as: [Reviewer Comment] followed by [Author Response] and [Action Taken in Manuscript].\\n3. Include page/line numbers showing where the changes were made.\\nOUTPUT: A perfectly formatted PDF/Docx rebuttal letter ready for submission.", 
      he: "מערכת: אתה מפיק מסמכים אקדמיים.\\nמשימה: חבר את המכתב הסופי 'מענה לסוקרים'.\\n1. השתמש בטון אקדמי רשמי, מכבד ומלא הוקרה.\\n2. ערוך את המכתב במבנה של: [הערת הסוקר] מלווה ב-[תגובת המחברים] ו-[פעולה שבוצעה במאמר].\\n3. ציין מספרי עמודים/שורות המראים היכן בוצעו השינויים בפועל.\\nפלט: מכתב תגובה מעוצב בפורמט PDF/Docx מוכן להגשה." 
    },
    icon: FileCheck, tools: ["Next.js API", "Claude 3.5", "Mammoth & Docx"],
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
"""

start_index = content.find(step_16_start)
if start_index == -1:
    print("Could not find start string")
    exit(1)

# Find the end of the array
end_index = content.find('];\n', start_index)
if end_index == -1:
    print("Could not find end of array")
    exit(1)

new_content = content[:start_index] + new_steps + content[end_index+3:]

with open('src/app/[locale]/architecture/ArchitectureClient.tsx', 'w') as f:
    f.write(new_content)

print("Successfully replaced steps")
