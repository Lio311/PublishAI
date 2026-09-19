import re

with open("src/app/[locale]/architecture/ArchitectureClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Shift Phase 3 steps 16-20 to 17-21
content = content.replace('id: 20, phase: 3', 'id: 21, phase: 3')
content = content.replace('en: "20.', 'en: "21.')
content = content.replace('he: "20.', 'he: "21.')

content = content.replace('id: 19, phase: 3', 'id: 20, phase: 3')
content = content.replace('en: "19.', 'en: "20.')
content = content.replace('he: "19.', 'he: "20.')

content = content.replace('id: 18, phase: 3', 'id: 19, phase: 3')
content = content.replace('en: "18.', 'en: "19.')
content = content.replace('he: "18.', 'he: "19.')

content = content.replace('id: 17, phase: 3', 'id: 18, phase: 3')
content = content.replace('en: "17.', 'en: "18.')
content = content.replace('he: "17.', 'he: "18.')

content = content.replace('id: 16, phase: 3', 'id: 17, phase: 3')
content = content.replace('en: "16.', 'en: "17.')
content = content.replace('he: "16.', 'he: "17.')


# 2. Insert the new Step 16 in Phase 2
new_step = '''  {
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
  // PHASE 3'''

content = content.replace('  // PHASE 3', new_step)

with open("src/app/[locale]/architecture/ArchitectureClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)

