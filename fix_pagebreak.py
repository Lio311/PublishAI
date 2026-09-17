from docx import Document
from docx.oxml.ns import qn

doc = Document('PublishAI_Product_Roadmap_Final.docx')

# Remove any page breaks from paragraphs
for p in doc.paragraphs:
    runs = p.runs
    for r in runs:
        if 'w:br' in r._element.xml and 'type="page"' in r._element.xml:
            r.clear() # remove the page break

doc.save('PublishAI_Product_Roadmap_Final.docx')
