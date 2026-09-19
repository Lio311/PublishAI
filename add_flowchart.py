import re

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Import the VisualFlowchart
content = content.replace(
    'import { FileText,',
    'import VisualFlowchart from "./VisualFlowchart";\nimport { FileText,'
)

# Insert the flowchart below the main title
content = content.replace(
    '''        <p className="text-slate-500 mt-2">
          {isHe 
            ? "מפת הארכיטקטורה המלאה של PublishAI: מזיהוי המסמך, דרך פאנל הדיבייט המדעי ועד להגשה." 
            : "The complete architecture map of PublishAI: from document ingestion, through the scientific debate panel, to submission."}
        </p>
      </div>''',
    '''        <p className="text-slate-500 mt-2">
          {isHe 
            ? "מפת הארכיטקטורה המלאה של PublishAI: מזיהוי המסמך, דרך פאנל הדיבייט המדעי ועד להגשה." 
            : "The complete architecture map of PublishAI: from document ingestion, through the scientific debate panel, to submission."}
        </p>
      </div>

      <VisualFlowchart locale={locale} />'''
)

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)

