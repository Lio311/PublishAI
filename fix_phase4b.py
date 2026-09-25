import re

with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "r") as f:
    content = f.read()

split_merge_code = """
function SplitFork({ isHe, yesLabel, noLabel }: { isHe: boolean, yesLabel: string, noLabel: string }) {
  return (
    <div className="flex flex-col items-center w-full my-0 relative z-0">
      <div className="h-4 w-[3px] bg-slate-400"></div>
      <div className="flex w-full max-w-[320px] relative">
        <div className="absolute top-0 left-[25%] right-[25%] h-[3px] bg-slate-400"></div>
        <div className="flex-1 flex flex-col items-center">
          <div className="h-8 w-[3px] bg-slate-400 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 rounded-full border border-slate-200 z-10 whitespace-nowrap">
              {yesLabel}
            </div>
            <div className="absolute bottom-[0px] left-1/2 -translate-x-1/2 border-t-[8px] border-t-slate-400 border-x-[5px] border-x-transparent translate-y-full"></div>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className="h-8 w-[3px] bg-slate-400 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-600 rounded-full border border-slate-200 z-10 whitespace-nowrap">
              {noLabel}
            </div>
            <div className="absolute bottom-[0px] left-1/2 -translate-x-1/2 border-t-[8px] border-t-slate-400 border-x-[5px] border-x-transparent translate-y-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MergeFork() {
  return (
    <div className="flex flex-col items-center w-full my-0 relative z-0">
      <div className="flex w-full max-w-[320px] relative">
        <div className="absolute bottom-0 left-[25%] right-[25%] h-[3px] bg-slate-400"></div>
        <div className="flex-1 flex flex-col items-center">
          <div className="h-6 w-[3px] bg-slate-400"></div>
        </div>
        <div className="flex-1 flex flex-col items-center">
          <div className="h-6 w-[3px] bg-slate-400"></div>
        </div>
      </div>
      <div className="h-6 w-[3px] bg-slate-400 relative">
        <div className="absolute bottom-[0px] left-1/2 -translate-x-1/2 border-t-[8px] border-t-slate-400 border-x-[5px] border-x-transparent translate-y-full"></div>
      </div>
    </div>
  );
}
"""

content = content.replace("// ═══════════════════════════════════════════\n// Main Component", split_merge_code + "\n// ═══════════════════════════════════════════\n// Main Component")

phase4b_start = content.find("            {/* 4B: Complex Lane */}")
phase4b_end = content.find("          {/* ══════════════════════════════════\n               PHASE 5")

old_phase4b = content[phase4b_start:phase4b_end]

new_phase4b = """            {/* 4B: Complex Lane */}
            <div className="flex-[5] rounded-2xl overflow-visible shadow-lg border border-purple-300 bg-purple-50/40 mt-6 lg:mt-0">
              <div className="w-full p-4 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-t-xl relative">
                <h2 className="text-xl font-bold">{isHe ? 'שלב 4B: נתיב RPA אוטונומי' : 'Phase 4B: Autonomous RPA Bot'}</h2>
                <p className="text-sm opacity-90">{isHe ? 'מופעל כגיבוי או כשאין API זמין' : 'Fallback when no API / no credentials'}</p>
                {/* Arrow coming from missing creds */}
                <div className="hidden lg:block absolute -left-[14px] top-1/2 w-4 border-b-[3px] border-slate-400"></div>
                <div className="hidden lg:block absolute -left-[12px] top-[calc(50%-4px)] border-l-[8px] border-l-slate-400 border-y-[5px] border-y-transparent z-20"></div>
              </div>
              <div className="p-6 md:p-8 flex flex-col items-center">
                <NodeCard type="rpa" icon={Bot} isHe={isHe} titleEn="GenericNavigator" titleHe="נווט גנרי" descEn="Launch headless Chromium & load portal" descHe="הפעלת דפדפן ללא ראש וטעינת הפורטל" techs={['Playwright']} />
                
                <VerticalFlowArrow isHe={isHe} length="h-8" />
                <NodeCard type="logic" icon={Search} isDiamond isHe={isHe} titleEn="DOM Found?" titleHe="אלמנטים נמצאו?" descEn="Are CSS selectors visible?" descHe="האם סלקטורים קיימים?" />
                
                <SplitFork isHe={isHe} yesLabel={isHe ? 'כן' : 'Yes'} noLabel={isHe ? 'לא (ראייה)' : 'No (Vision)'} />
                
                <div className="flex w-full max-w-[380px] justify-between gap-4 relative z-10">
                  <div className="flex-1 flex justify-center">
                    <NodeCard type="rpa" icon={Edit3} isHe={isHe} titleEn="Fill & Upload" titleHe="מילוי והעלאה" descEn="fillForm() & uploadFiles()" descHe="מילוי טפסים והעלאת קבצי מאמר" techs={['Playwright']} />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <NodeCard type="rpa" icon={Eye} isHe={isHe} titleEn="Vision AI" titleHe="ראייה ממוחשבת" descEn="Claude → JSON {X,Y} → Click" descHe="גיבוי - קואורדינטות ראייה ולחיצה" techs={['Vision AI']} />
                  </div>
                </div>

                <MergeFork />

                <NodeCard type="logic" icon={Lock} isDiamond isHe={isHe} titleEn="CAPTCHA / 2FA?" titleHe="אימות דו-שלבי?" descEn="Is human intervention needed?" descHe="האם נדרשת התערבות אנושית?" />
                
                <SplitFork isHe={isHe} yesLabel={isHe ? 'כן' : 'Yes'} noLabel={isHe ? 'לא' : 'No'} />
                
                <div className="flex w-full max-w-[380px] justify-between gap-4 relative z-10">
                  <div className="flex-1 flex justify-center">
                    <NodeCard type="queue" icon={User} isHe={isHe} titleEn="Pause & Notify" titleHe="השהיה והתראה" descEn="WebSocket → User solves → Resume" descHe="התראה → המשתמש פותר בממשק → חידוש" techs={['WebSockets', 'Inngest']} />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <NodeCard type="rpa" icon={CheckCircle2} isHe={isHe} titleEn="Final Submit" titleHe="הגשה סופית" descEn="Click Submit → Scrape Tracking ID" descHe="לחיצה על שליחה → חילוץ מזהה מעקב" techs={['Playwright']} />
                  </div>
                </div>

                <MergeFork />
                
                <NodeCard type="db" icon={Database} isHe={isHe} titleEn="Update DB" titleHe="עדכון מסד" descEn="Set status: 'submitted'. Save tracking ID." descHe="עדכון סטטוס 'הוגש' ושמירת מזהה." techs={['Neon Postgres', 'Drizzle ORM']} />
              </div>
            </div>
          </div>

"""

content = content.replace(old_phase4b, new_phase4b)

with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "w") as f:
    f.write(content)

