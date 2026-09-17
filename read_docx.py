from docx import Document
doc = Document('PublishAI_Project_Plan_Integrated.docx')
for i, p in enumerate(doc.paragraphs):
    if p.text.strip():
        print(f"{i}: {p.text}")
