import re

file_path = "src/app/[locale]/flowchart/FlowchartClient.tsx"
with open(file_path, "r") as f:
    content = f.read()

# I will extract the current Row 3 and replace it.
original_row3 = """              {/* Row 3 - LTR */}
              <div className="mt-0 lg:mt-12 flex flex-col lg:flex-row justify-between items-center w-full relative z-10">
                <NodeCard type="logic" icon={Shield} isHe={isHe} titleEn="IntegrityScanner" titleHe="סורק תקינות" descEn="Plagiarism score + AI-generation detection" descHe="בדיקת ציון פלגיאט + זיהוי כתיבת AI" techs={['Claude 3.7']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={CheckCircle} isHe={isHe} titleEn="QaAgent" titleHe="סוכן QA" descEn="Final consistency, formatting, grammar check" descHe="בדיקת עקביות סופית, עיצוב ודקדוק" techs={['Claude 3.7', 'Jest']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={ListChecks} isHe={isHe} titleEn="Verification" titleHe="סוכן אימות" descEn="Verify journal guidelines compliance" descHe="אימות עמידה מלאה בהנחיות כתב העת" techs={['o1-preview']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={FileText} isHe={isHe} titleEn="Cover Letter" titleHe="מכתב מקדים" descEn="Generate persuasive letter to Editor-in-Chief" descHe="יצירת מכתב מקדים משכנע לעורך" techs={['Claude 3.7']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Download} isHe={isHe} titleEn="Compile & Reinject" titleHe="הידור ושחזור" descEn="Compile manuscript & restore Mendeley CSL" descHe="הידור ושחזור ציטוטי Mendeley במסמך" techs={['DOCX', 'Mendeley CSL']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={Database} isHe={isHe} titleEn="Post-Predict" titleHe="ניבוי חוזר" descEn="Predict Acceptance % after AI rewrite" descHe="ניבוי אחוזי קבלה לאחר שכתוב המערכת" techs={['GPT-4o']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="infra" icon={FileText} isHe={isHe} titleEn="Export PDF/DOCX" titleHe="ייצוא קבצים" descEn="Generate formatted PDF & Word documents" descHe="יצירת קבצי PDF ו-Word מעוצבים" techs={['PDF Parser', 'DOCX']} />
              </div>"""

replacement = """              {/* Row 3 - LTR */}
              <div className="mt-0 lg:mt-12 flex flex-col lg:flex-row justify-between items-center w-full relative z-10">
                <NodeCard type="logic" icon={Shield} isHe={isHe} titleEn="IntegrityScanner" titleHe="סורק תקינות" descEn="Plagiarism score + AI-generation detection" descHe="בדיקת ציון פלגיאט + זיהוי כתיבת AI" techs={['Claude 3.7']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={CheckCircle} isHe={isHe} titleEn="QaAgent" titleHe="סוכן QA" descEn="Final consistency, formatting, grammar check" descHe="בדיקת עקביות סופית, עיצוב ודקדוק" techs={['Claude 3.7', 'Jest']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={ListChecks} isHe={isHe} titleEn="Verification" titleHe="סוכן אימות" descEn="Verify journal guidelines compliance" descHe="אימות עמידה מלאה בהנחיות כתב העת" techs={['o1-preview']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} />
                <NodeCard type="agent" icon={FileText} isHe={isHe} titleEn="Cover Letter" titleHe="מכתב מקדים" descEn="Generate persuasive letter to Editor-in-Chief" descHe="יצירת מכתב מקדים משכנע לעורך" techs={['Claude 3.7']} />
                
                <SideDropArrow isRightSide={!isHe} />
                <VerticalFlowArrow isHe={isHe} length="h-16 lg:hidden" />
              </div>

              {/* Row 4 - RTL */}
              <div className={`mt-0 lg:mt-12 flex flex-col items-center w-full relative justify-between z-10 lg:flex-row-reverse`}>
                <NodeCard type="agent" icon={Download} isHe={isHe} titleEn="Compile & Reinject" titleHe="הידור ושחזור" descEn="Compile manuscript & restore Mendeley CSL" descHe="הידור ושחזור ציטוטי Mendeley במסמך" techs={['DOCX', 'Mendeley CSL']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} reverse={true} />
                <NodeCard type="agent" icon={Database} isHe={isHe} titleEn="Post-Predict" titleHe="ניבוי חוזר" descEn="Predict Acceptance % after AI rewrite" descHe="ניבוי אחוזי קבלה לאחר שכתוב המערכת" techs={['GPT-4o']} />
                <VerticalFlowArrow isHe={isHe} length="h-10 lg:hidden" />
                <FlowArrow isHe={isHe} reverse={true} />
                <NodeCard type="infra" icon={FileText} isHe={isHe} titleEn="Export PDF/DOCX" titleHe="ייצוא קבצים" descEn="Generate formatted PDF & Word documents" descHe="יצירת קבצי PDF ו-Word מעוצבים" techs={['PDF Parser', 'DOCX']} />
                
                {/* Add invisible spacers to push the 3 items to the right side if justify-between is used, or let it distribute. 
                    Actually justify-between on 3 items will put them left, center, right. Since it's row-reverse, Compile is Right, Predict is Center, Export is Left. 
                    This perfectly aligns Export to drop down to the next phase on the left side! */}
              </div>"""

if original_row3 in content:
    content = content.replace(original_row3, replacement)
    with open(file_path, "w") as f:
        f.write(content)
    print("Replaced successfully")
else:
    print("Could not find the original block")
