import re

with open('src/app/[locale]/architecture/VisualFlowchart.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

phase0 = """
        {/* Phase 0 */}
        <div className="w-full bg-white border border-indigo-200 rounded-xl p-6 shadow-sm">
          <h4 className="font-bold text-indigo-800 mb-4 border-b border-indigo-100 pb-2">
            {isHe ? "שלב 0: מחקר, נתונים וניתוח חזותי" : "Phase 0: Data Science & Vision"}
          </h4>
          <div className="flex items-center justify-center gap-6">
            <Node title={isHe ? "העלאת נתונים" : "Data Upload"} color="bg-indigo-100 text-indigo-800" />
            <Arrow isHe={isHe} />
            <Node title={isHe ? "ארגז חול (פייתון)" : "Data Science Sandbox"} color="bg-indigo-100 text-indigo-800" />
            <Arrow isHe={isHe} />
            <Node title={isHe ? "ניתוח איורים (Vision)" : "Vision Analysis"} color="bg-indigo-100 text-indigo-800" />
          </div>
        </div>

        <ArrowDown className="text-slate-400 w-6 h-6" />
"""

phase4 = """
        <ArrowDown className="text-slate-400 w-6 h-6" />

        {/* Phase 4 */}
        <div className="w-full bg-white border border-emerald-200 rounded-xl p-6 shadow-sm">
          <h4 className="font-bold text-emerald-800 mb-4 border-b border-emerald-100 pb-2">
            {isHe ? "שלב 4: הפצה ולמידת חיזוק (RLHF)" : "Phase 4: Dissemination & RLHF"}
          </h4>
          <div className="flex items-center justify-center gap-6">
            <Node title={isHe ? "פרסום באתר (CMS)" : "CMS Publish"} color="bg-emerald-100 text-emerald-800" />
            <Arrow isHe={isHe} />
            <Node title={isHe ? "מעקב ביצועים" : "Performance Tracking"} color="bg-emerald-100 text-emerald-800" />
            <Arrow isHe={isHe} />
            <Node title={isHe ? "משוב אנושי (RLHF)" : "Human Feedback"} color="bg-emerald-100 text-emerald-800" />
            <Arrow isHe={isHe} />
            <Node title={isHe ? "עדכון מודלים" : "Model Fine-Tuning"} color="bg-emerald-100 text-emerald-800" />
          </div>
        </div>
"""

content = content.replace(
    "{/* Phase 1 */}",
    phase0 + "\n        {/* Phase 1 */}"
)

content = content.replace(
    "          </div>\n        </div>\n\n      </div>\n    </div>",
    "          </div>\n        </div>\n" + phase4 + "\n      </div>\n    </div>"
)

with open('src/app/[locale]/architecture/VisualFlowchart.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

