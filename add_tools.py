import re

with open("src/app/[locale]/architecture/ArchitectureClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

new_tools = """  "Puppeteer": {
    en: "A Node library which provides a high-level API to control Chrome or Chromium over the DevTools Protocol. Used here as an alternative automation driver.",
    he: "ספריית Node לשליטה בדפדפן Chrome דרך פרוטוקול DevTools. משמשת כאן כמנוע אוטומציה חלופי."
  },
  "Node.js": {
    en: "JavaScript runtime built on Chrome's V8 JavaScript engine. Executes the RPA bot scripts on the server.",
    he: "סביבת ריצה ל-JavaScript המאפשרת הרצת סקריפטים של סוכני ה-RPA בשרת."
  },
  "Playwright": {"""

content = content.replace('  "Playwright": {', new_tools)

with open("src/app/[locale]/architecture/ArchitectureClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)

