import re

with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "r") as f:
    content = f.read()

# 1. Inject OrDivider component before the Main Component
or_divider_code = """
function OrDivider({ isHe, labelEn = 'OR', labelHe = 'או (נתיב חלופי)' }: { isHe: boolean, labelEn?: string, labelHe?: string }) {
  return (
    <div className="w-full flex items-center justify-center my-1.5 z-20 relative">
      <div className="absolute w-full h-[1px] bg-slate-200/50 -z-10"></div>
      <div className="bg-white border-2 border-slate-300 rounded-full px-2.5 py-0.5 shadow-sm text-[10px] font-bold text-slate-500 uppercase tracking-wider">
        {isHe ? labelHe : labelEn}
      </div>
    </div>
  );
}
"""

content = content.replace("// ═══════════════════════════════════════════\n// Main Component", or_divider_code + "\n// ═══════════════════════════════════════════\n// Main Component")

# 2. Phase 4A dividers
phase_4a_replacement = """<div className="flex flex-col lg:flex-row items-center justify-between w-full mb-2">
                  <NodeCard type="rpa" icon={Globe} isHe={isHe} titleEn="WordPress/OJS API" titleHe="WordPress / OJS" descEn="Execute direct POST to REST APIs" descHe="ביצוע קריאות REST API ישירות" techs={['Next.js 16']} />
                  <VerticalFlowArrow isHe={isHe} length="h-8 lg:hidden" />
                  <FlowArrow isHe={isHe} />
                  <NodeCard type="success" icon={CheckCircle2} isHe={isHe} titleEn="Success ✓" titleHe="הצלחה ✓" descEn="Submission complete" descHe="ההגשה הושלמה" techs={['Neon Postgres']} />
                </div>
                
                <OrDivider isHe={isHe} />
                
                <div className="flex flex-col lg:flex-row items-center justify-between w-full mb-2 mt-2">
                  <NodeCard type="rpa" icon={Globe} isHe={isHe} titleEn="EditorialManager API" titleHe="EditorialManager API" descEn="Execute API stub requests securely" descHe="ביצוע קריאות API מאובטחות" techs={['Next.js 16']} />
                  <VerticalFlowArrow isHe={isHe} length="h-8 lg:hidden" />
                  <FlowArrow isHe={isHe} />
                  <NodeCard type="success" icon={CheckCircle2} isHe={isHe} titleEn="Success ✓" titleHe="הצלחה ✓" descEn="Submission complete" descHe="ההגשה הושלמה" techs={['Neon Postgres']} />
                </div>
                
                <OrDivider isHe={isHe} />
                
                <div className="flex flex-col lg:flex-row items-center justify-between w-full mt-2">"""

# Replace the specific block in Phase 4A
old_phase_4a = """<div className="flex flex-col lg:flex-row items-center justify-between w-full mb-4">
                  <NodeCard type="rpa" icon={Globe} isHe={isHe} titleEn="WordPress/OJS API" titleHe="WordPress / OJS" descEn="Execute direct POST to REST APIs" descHe="ביצוע קריאות REST API ישירות" techs={['Next.js 16']} />
                  <VerticalFlowArrow isHe={isHe} length="h-8 lg:hidden" />
                  <FlowArrow isHe={isHe} />
                  <NodeCard type="success" icon={CheckCircle2} isHe={isHe} titleEn="Success ✓" titleHe="הצלחה ✓" descEn="Submission complete" descHe="ההגשה הושלמה" techs={['Neon Postgres']} />
                </div>
                <div className="flex flex-col lg:flex-row items-center justify-between w-full mb-4">
                  <NodeCard type="rpa" icon={Globe} isHe={isHe} titleEn="EditorialManager API" titleHe="EditorialManager API" descEn="Execute API stub requests securely" descHe="ביצוע קריאות API מאובטחות" techs={['Next.js 16']} />
                  <VerticalFlowArrow isHe={isHe} length="h-8 lg:hidden" />
                  <FlowArrow isHe={isHe} />
                  <NodeCard type="success" icon={CheckCircle2} isHe={isHe} titleEn="Success ✓" titleHe="הצלחה ✓" descEn="Submission complete" descHe="ההגשה הושלמה" techs={['Neon Postgres']} />
                </div>
                <div className="flex flex-col lg:flex-row items-center justify-between w-full">"""

content = content.replace(old_phase_4a, phase_4a_replacement)

# 3. Phase 4B dividers - Vision AI vs Fill & Upload
old_phase_4b_1 = """<div className="flex items-center rounded-lg pr-2 w-full">
                       <FlowArrow isHe={isHe} />
                       <NodeCard type="rpa" icon={Eye} isHe={isHe} titleEn="Vision AI" titleHe="ראייה ממוחשבת" descEn="Claude → JSON {X,Y} → Click" descHe="גיבוי - קואורדינטות ראייה ולחיצה" techs={['Vision AI']} />
                     </div>
                     <div className="flex items-center rounded-lg pr-2 w-full">"""

new_phase_4b_1 = """<div className="flex items-center rounded-lg pr-2 w-full">
                       <FlowArrow isHe={isHe} />
                       <NodeCard type="rpa" icon={Eye} isHe={isHe} titleEn="Vision AI" titleHe="ראייה ממוחשבת" descEn="Claude → JSON {X,Y} → Click" descHe="גיבוי - קואורדינטות ראייה ולחיצה" techs={['Vision AI']} />
                     </div>
                     <div className="w-1/2 ml-auto"><OrDivider isHe={isHe} labelEn="OR" labelHe="או" /></div>
                     <div className="flex items-center rounded-lg pr-2 w-full">"""

content = content.replace(old_phase_4b_1, new_phase_4b_1)

# 4. Phase 4B dividers - 2FA Pause vs Final Submit
old_phase_4b_2 = """<div className="flex items-center rounded-lg pr-2 w-full">
                       <FlowArrow isHe={isHe} />
                       <NodeCard type="queue" icon={User} isHe={isHe} titleEn="Pause & Notify" titleHe="השהיה והתראה" descEn="WebSocket → User solves → Resume" descHe="התראה → המשתמש פותר בממשק → חידוש" techs={['WebSockets', 'Inngest']} />
                     </div>
                     <div className="flex items-center rounded-lg pr-2 w-full">"""

new_phase_4b_2 = """<div className="flex items-center rounded-lg pr-2 w-full">
                       <FlowArrow isHe={isHe} />
                       <NodeCard type="queue" icon={User} isHe={isHe} titleEn="Pause & Notify" titleHe="השהיה והתראה" descEn="WebSocket → User solves → Resume" descHe="התראה → המשתמש פותר בממשק → חידוש" techs={['WebSockets', 'Inngest']} />
                     </div>
                     <div className="w-1/2 ml-auto"><OrDivider isHe={isHe} labelEn="OR" labelHe="או" /></div>
                     <div className="flex items-center rounded-lg pr-2 w-full">"""

content = content.replace(old_phase_4b_2, new_phase_4b_2)

# 5. Add OR to the Auth Given split in Phase 3
old_phase_3 = """<BranchLabel text={isHe ? 'כן (נתיב מהיר)' : 'Yes (Fast)'} />
                     <FlowArrow isHe={isHe} />
                  </div>
                  <div className="flex items-center w-full mt-10 relative">"""

new_phase_3 = """<BranchLabel text={isHe ? 'כן (נתיב מהיר)' : 'Yes (Fast)'} />
                     <FlowArrow isHe={isHe} />
                  </div>
                  <div className="w-full mt-2 mb-1"><OrDivider isHe={isHe} labelEn="OR" labelHe="או" /></div>
                  <div className="flex items-center w-full mt-2 relative">"""

content = content.replace(old_phase_3, new_phase_3)

# Fix translate-y if needed for Phase 3 line
content = content.replace("translate-y-[-48px]", "translate-y-[-38px]")


with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "w") as f:
    f.write(content)
