import re

with open('src/app/[locale]/flowchart/FlowchartClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add TechColors
content = content.replace(
    "'Tiptap': 'bg-violet-50 text-violet-700 border-violet-200',",
    "'Tiptap': 'bg-violet-50 text-violet-700 border-violet-200',\n  'Python': 'bg-blue-100 text-blue-800 border-blue-300',\n  'WordPress API': 'bg-sky-100 text-sky-800 border-sky-300',"
)

# 2. Add Phase 0
phase0 = """
          {/* ══════════════════════════════════
               PHASE 0
             ══════════════════════════════════ */}
          <div className="w-full rounded-2xl overflow-visible shadow-lg border border-indigo-200 bg-indigo-50/40 mb-2 relative">
            <div className="w-full p-4 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white rounded-t-xl">
              <h2 className="text-xl font-bold">{isHe ? 'שלב 0: מחקר, נתונים וניתוח חזותי' : 'Phase 0: Data Science Sandbox & Vision Analysis'}</h2>
            </div>
            <div className="p-6 md:p-10 flex flex-col items-center w-full relative">
              <div className="flex flex-col lg:flex-row justify-between items-center w-full">
                <NodeCard type="user" icon={Database} isHe={isHe} titleEn="Data Upload" titleHe="העלאת נתונים" descEn="Upload raw datasets (CSV, Excel) & Figures" descHe="העלאת קובצי נתונים (CSV) ואיורים" techs={['Next.js 16', 'Tailwind CSS']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={BarChart2} isHe={isHe} titleEn="Data Science Sandbox" titleHe="ארגז חול לנתונים" descEn="Python execution for generating plots & analysis" descHe="הרצת פייתון ליצירת גרפים וניתוח נתונים" techs={['E2B Sandbox', 'Python']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Eye} isHe={isHe} titleEn="Vision Analysis" titleHe="ניתוח חזותי" descEn="Analyze figures, generate legends (FigureGallery)" descHe="ניתוח איורים ויצירת מקרא (FigureGallery)" techs={['Vision AI', 'Claude 3.7']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="success" icon={CheckCircle2} isHe={isHe} titleEn="Ready for Draft" titleHe="מוכן לטיוטה" descEn="Assets ready for paper generation" descHe="התוצרים מוכנים ליצירת המאמר" techs={['Neon Postgres']} />
              </div>
            </div>
          </div>
          
          <VerticalFlowArrow isHe={isHe} length="h-16" label={{ en: "Proceed to Drafting", he: "מעבר לכתיבת טיוטה" }} />
"""

content = content.replace(
    "{/* ══════════════════════════════════\n               PHASE 1\n             ══════════════════════════════════ */}",
    phase0 + "\n          {/* ══════════════════════════════════\n               PHASE 1\n             ══════════════════════════════════ */}"
)

# 3. Add Export to Phase 2 end
content = content.replace(
    '<NodeCard type="agent" icon={Download} isHe={isHe} titleEn="17. Compile" titleHe="17. סוכן הידור" descEn="Compile final manuscript + metadata payload" descHe="הידור מאמר סופי + מטען נתונים להגשה" techs={[\'DOCX\']} />\n              </div>',
    '<NodeCard type="agent" icon={Download} isHe={isHe} titleEn="17. Compile" titleHe="17. סוכן הידור" descEn="Compile final manuscript + metadata payload" descHe="הידור מאמר סופי + מטען נתונים להגשה" techs={[\'DOCX\']} />\n                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />\n                <FlowArrow isHe={isHe} />\n                <NodeCard type="infra" icon={FileText} isHe={isHe} titleEn="18. Export PDF/DOCX" titleHe="18. ייצוא קבצים" descEn="Generate formatted PDF & Word documents" descHe="יצירת קבצי PDF ו-Word מעוצבים" techs={[\'PDF Parser\', \'DOCX\']} />\n              </div>'
)

# 4. Add Phase 7
phase7 = """
          {/* ══════════════════════════════════
               PHASE 7
             ══════════════════════════════════ */}
          <VerticalFlowArrow isHe={isHe} length="h-16" label={{ en: "Post-Publication", he: "לאחר הפרסום" }} />

          <div className="w-full rounded-2xl overflow-visible shadow-lg border border-pink-200 bg-pink-50/40 mb-2">
            <div className="w-full p-4 bg-gradient-to-r from-pink-500 to-pink-700 text-white rounded-t-xl">
              <h2 className="text-xl font-bold">{isHe ? 'שלב 7: הפצה ולמידת חיזוק (RLHF & CMS)' : 'Phase 7: Dissemination & RLHF Analytics'}</h2>
            </div>
            <div className="p-6 md:p-10 flex flex-col items-center w-full relative z-10">
              <div className="flex flex-col lg:flex-row justify-between items-center w-full relative">
                <NodeCard type="infra" icon={Globe} isHe={isHe} titleEn="CMS Publish" titleHe="פרסום באתר" descEn="Auto-publish to Lab's WordPress" descHe="פרסום אוטומטי באתר המעבדה" techs={['WordPress API']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Activity} isHe={isHe} titleEn="Performance Tracking" titleHe="מעקב ביצועים" descEn="Track citations and journal metrics" descHe="מעקב אחר ציטוטים ומדדי כתב עת" techs={['pgvector']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="user" icon={User} isHe={isHe} titleEn="Human Feedback" titleHe="משוב אנושי" descEn="Rate agent decisions via Analytics Dashboard" descHe="דירוג החלטות הסוכנים בדאשבורד" techs={['RLHF']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="db" icon={Database} isHe={isHe} titleEn="Model Fine-Tuning" titleHe="עדכון מודלים" descEn="Export dataset to improve future revisions" descHe="ייצוא הדאטה-סט לשיפור עתידי של המודלים" techs={['RLHF', 'Neon Postgres']} />
              </div>
            </div>
          </div>
"""

content = content.replace(
    "          <div className=\"mt-10 h-10 w-full\" />\n        </div>\n      </div>",
    phase7 + "\n          <div className=\"mt-10 h-10 w-full\" />\n        </div>\n      </div>"
)

with open('src/app/[locale]/flowchart/FlowchartClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

