with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "r") as f:
    lines = f.readlines()

new_block = """          {/* ══════════════════════════════════
               PHASE 3
             ══════════════════════════════════ */}
          <div className="w-full rounded-2xl overflow-visible shadow-lg border border-rose-200 bg-rose-50/40 mb-2 relative">
            <div className="w-full p-4 bg-gradient-to-r from-rose-500 to-rose-700 text-white rounded-t-xl">
              <h2 className="text-xl font-bold">{isHe ? 'שלב 3: אישור, הרשאות ושער הגשה' : 'Phase 3: Approval, Permissions & Submission Gateway'}</h2>
            </div>
            <div className="p-6 md:p-10 flex flex-col items-center w-full relative z-10">
              
              <NodeCard type="user" icon={User} isHe={isHe} titleEn="20. Approve" titleHe="20. אישור והגשה" descEn="User reviews final paper and clicks 'Approve & Submit'" descHe="המשתמש סוקר את המאמר ולוחץ 'אשר והגש'" techs={['Next.js 16', 'NextAuth.js']} />
              
              <VerticalFlowArrow isHe={isHe} length="h-8" />
              
              <NodeCard type="logic" icon={Key} isDiamond isHe={isHe} titleEn="Auth Given?" titleHe="הרשאות הוענקו?" descEn="Has user linked API / Email creds?" descHe="האם המשתמש העניק הרשאות API/Email?" />
              
              <SplitFork isHe={isHe} yesLabel={isHe ? 'כן (פענוח)' : 'Yes (Decrypt)'} noLabel={isHe ? 'לא (דילוג)' : 'No (Skip)'} />
              
              <div className="flex w-full max-w-[380px] justify-between gap-4 relative z-10">
                <div className="flex-1 flex justify-center">
                  <NodeCard type="rpa" icon={Lock} isHe={isHe} titleEn="22. AES Decrypt" titleHe="22. פענוח הרשאות" descEn="Decrypt API tokens / Email passwords safely" descHe="פענוח מאובטח של סיסמאות וטוקנים" techs={['AES-256-GCM', 'Neon Postgres']} />
                </div>
                <div className="flex-1 flex justify-center">
                  <NodeCard type="queue" icon={ArrowRight} isHe={isHe} titleEn="Skip Decrypt" titleHe="דילוג על פענוח" descEn="Proceed directly to fallback route" descHe="המשך לנתיב חלופי ללא הרשאות מיוחדות" techs={['NextAuth.js']} />
                </div>
              </div>

              <MergeFork />
              
              <NodeCard type="logic" icon={Settings} isDiamond isHe={isHe} titleEn="23. Route Platform" titleHe="23. ניתוב פלטפורמה" descEn="Route by: WordPress / Editorial Mgr / Email" descHe="ניתוב פנימי לממשק המתאים" />
            
            </div>
          </div>
"""

# Replace lines 394 to 433 (0-indexed 394 to 433)
new_lines = lines[:394] + [new_block] + lines[434:]

with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "w") as f:
    f.writelines(new_lines)

