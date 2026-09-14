const fs = require('fs');

const heFile = 'messages/he.json';
const enFile = 'messages/en.json';

const heData = JSON.parse(fs.readFileSync(heFile, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));

const heSteps = {
  upload: {
    title: "העלאת מאמר",
    desc: "העלה את קובץ המאמר הגולמי שלך (Word או PDF) ישירות למערכת בקליק אחד. המערכת סורקת, מחלצת ומפענחת את התוכן, הטבלאות והמידע החזותי הקיים בו. תהליך זה מכין תשתית דיגיטלית נקייה ומסודרת, המאפשרת לסוכנים לקרוא ולהבין את המחקר שלך לעומק. כל המידע נשמר בצורה מאובטחת לחלוטין."
  },
  clarification: {
    title: "סוכן הבהרה",
    desc: "הסוכן הראשון קורא את המאמר ומתחיל לבנות את האסטרטגיה המחקרית. הוא מנתח את התחום המדעי, המטרה והקהל אליו המאמר מכוון. אם חסרים פרטים חיוניים כמו כתב העת המיועד או מגבלות כתיבה, הוא יוודא אותם. מטרתו היא לספק למערכת את כל ההקשר וההנחיות הנדרשות."
  },
  planning: {
    title: "סוכן תכנון",
    desc: "סוכן הליבה מבצע קריאת עומק מקיפה ובונה תוכנית עבודה אדריכלית לכלל המאמר. הוא מאתר חולשות בטיעונים, מזהה פערים מתודולוגיים, ומחליט אילו פסקאות דורשות שכתוב או הרחבה. הסוכן מפיק מסמך יעדים פרקטי שמנחה את שאר הסוכנים במדויק אילו פעולות עריכה לבצע."
  },
  knowledge: {
    title: "סוכן ידע ורפרנסים",
    desc: "סוכן זה מתחבר בזמן אמת למאגרי מידע אקדמיים כדי לחפש מקורות חסרים או לאמת ציטוטים קיימים. הוא מוודא שכל ההפניות מדויקות, ובודק האם יש ספרות חדשה שפספסת. לאחר מכן, הוא מסדר את הביבליוגרפיה בדיוק לפי כללי הציטוט של כתב העת המיועד."
  },
  review: {
    title: "סוכן סקירה מדעית",
    desc: "הסוכן פועל כמו סוקר עמיתים קפדני. הוא מחפש בכוונה כשלים לוגיים, בעיות בסטטיסטיקה או מסקנות שאינן נתמכות היטב בתוצאות. הוא מפיק דו\"ח מפורט המצביע על נקודות התורפה ומציע פתרונות ממוקדים - כדי שנוכל לתקן ולחזק את המאמר טרם ההגשה."
  },
  writing: {
    title: "סוכן כתיבה אקדמית",
    desc: "בשלב זה, סוכן הכתיבה משכתב את הטקסט לרמה האקדמית הגבוהה ביותר. הוא משפר את זרימת המשפטים, משחיז את אוצר המילים ומוחק חזרות מיותרות. במקביל, הוא משתמש בטכניקות מתקדמות להסרת סממנים של בינה מלאכותית ודואג לשמר את קולך הייחודי."
  },
  execution: {
    title: "סוכן ביצוע",
    desc: "כאן הכל קורה בפועל. סוכן הביצוע לוקח את כל ההמלצות והתיקונים מהסוכנים הקודמים ומטמיע אותם בתוך המסמך. כל שינוי מתבצע שקוף לחלוטין ומסומן בפורמט 'עקוב אחר שינויים' כדי שתוכל לעבור סעיף סעיף ולהחליט אילו תיקונים תרצה לאשר או לדחות."
  },
  qa: {
    title: "סוכן בקרת איכות",
    desc: "זוהי הבדיקה הקפדנית האחרונה. הסוכן עובר על המסמך בזכוכית מגדלת ומוודא שאין שגיאות כתיב עדינות, שכל הקישורים עובדים ושההפניות לאיורים מדויקות. הוא דואג להתאמה מלאה ודקדקנית להנחיות ולפורמט של כתב העת המיועד - מהרווחים ועד סגנון הכותרות."
  },
  verification: {
    title: "סוכן אימות",
    desc: "הסוכן מייצר עבורך את כל כלי העזר המשלימים הנדרשים להגשה. הוא כותב מכתב מקדים (Cover Letter) מרשים ומשכנע לעורך כתב העת, ומפיק דו\"ח ביקורת עמיתים סימולטיבית המראה כיצד המאמר צפוי להישפט - כך שתגיע שלם ובטוח להגשה."
  },
  compilation: {
    title: "סוכן הידור",
    desc: "בשלב טכני זה, המערכת אוספת את כל השינויים ואורזת אותם חזרה לקובץ נקי ומוכן. המערכת שומרת במדויק על העיצוב המקורי שלך, מבנה העמודים, הכותרות והפונטים, כך שהקובץ הסופי ייראה בדיוק כמו הקובץ שהעלית, רק מלוטש ומושלם."
  },
  export: {
    title: "ייצוא ופרסום",
    desc: "המסע הושלם בהצלחה! כעת תוכל להוריד את חבילת הפרסום המלאה: המאמר המלוטש, קובץ עם מעקב אחר שינויים, המכתב המקדים ודו\"ח האימות. הכל זמין להורדה מרוכזת בלחיצת כפתור, מסודר ומוכן לקחת את המחקר שלך לשלב הבא."
  }
};

const enSteps = {
  upload: {
    title: "Upload Paper",
    desc: "Upload your raw manuscript (Word or PDF) directly to our system in one click. The system scans, extracts, and parses the text, tables, and visual data. This process creates a clean digital foundation that allows our agents to read and deeply understand your research. All data is stored securely."
  },
  clarification: {
    title: "Clarification Agent",
    desc: "The first agent reads the paper and builds the research strategy. It analyzes the scientific field, objectives, and target audience. If crucial details like the target journal or word limits are missing, it will verify them to ensure the system has all the necessary context and guidelines."
  },
  planning: {
    title: "Planning Agent",
    desc: "Our core agent performs a comprehensive deep read and builds an architectural work plan for the entire paper. It identifies weak arguments, methodological gaps, and decides which paragraphs need rewriting or expansion. It produces an actionable objective document to guide the editing process."
  },
  knowledge: {
    title: "Knowledge & Reference Agent",
    desc: "This agent connects in real-time to academic databases to find missing sources or verify existing citations. It ensures all references are accurate, checks for newly published literature you might have missed, and formats the bibliography exactly according to your target journal's citation rules."
  },
  review: {
    title: "Scientific Review Agent",
    desc: "Acting as a rigorous peer reviewer, this agent actively looks for logical flaws, statistical issues, or conclusions that aren't well-supported by the results. It generates a detailed report highlighting weaknesses and offers targeted solutions to strengthen your paper before submission."
  },
  writing: {
    title: "Academic Writing Agent",
    desc: "At this stage, the writing agent rewrites the text to the highest academic standards. It improves sentence flow, refines vocabulary, and removes redundancies. Simultaneously, it uses advanced techniques to eliminate AI-writing markers while preserving your unique, original authorial voice."
  },
  execution: {
    title: "Execution Agent",
    desc: "This is where everything happens. The execution agent takes all recommendations and applies them directly into your document. Every modification is fully transparent and marked in 'Track Changes' format, allowing you to review section by section and approve or reject edits as you see fit."
  },
  qa: {
    title: "Quality Assurance Agent",
    desc: "The final rigorous check. This agent reviews the document with a magnifying glass, ensuring there are no subtle typos, all links work, and figure references are accurate. It guarantees strict adherence to the target journal's formatting guidelines - from line spacing to heading styles."
  },
  verification: {
    title: "Verification Agent",
    desc: "This agent generates all the supplementary materials required for submission. It writes a compelling and professional Cover Letter for the journal editor, and produces a simulated peer-review report showing how your paper is likely to be evaluated, giving you confidence before submitting."
  },
  compilation: {
    title: "Compilation Agent",
    desc: "In this technical step, the system gathers all applied changes and repacks them into a clean, ready file. The system accurately preserves your original formatting, page structure, headings, and fonts, ensuring the final output looks exactly like your original upload, just perfectly polished."
  },
  export: {
    title: "Export & Publish",
    desc: "The journey is complete! You can now download your full publication package: the polished manuscript, the tracked-changes version, the cover letter, and the verification report. Everything is available for immediate download in one click, ready to take your research to the next level."
  }
};

heData.SystemFlow.steps = heSteps;
enData.SystemFlow.steps = enSteps;

fs.writeFileSync(heFile, JSON.stringify(heData, null, 2) + '\n');
fs.writeFileSync(enFile, JSON.stringify(enData, null, 2) + '\n');

console.log("Translations updated successfully.");
