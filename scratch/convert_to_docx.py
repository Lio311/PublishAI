import os
import markdown
from htmldocx import HtmlToDocx
from docx import Document

def main():
    files = [
        "scratch/system_overview.md",
        "scratch/frontend_analysis.md",
        "scratch/backend_analysis.md",
        "scratch/integrations_analysis.md",
        "scratch/devops_analysis.md"
    ]
    
    combined_md = "# PublishAI - Comprehensive Project Architecture & Onboarding Document\n\n"
    
    for fpath in files:
        if os.path.exists(fpath):
            with open(fpath, "r", encoding="utf-8") as f:
                combined_md += f.read() + "\n\n---\n\n"
        else:
            print(f"Warning: {fpath} not found.")

    # Convert markdown to html
    html = markdown.markdown(combined_md, extensions=['tables', 'fenced_code'])
    
    # Create docx
    document = Document()
    new_parser = HtmlToDocx()
    
    # Add a title
    document.add_heading('PublishAI Technical Onboarding Document', 0)
    
    # htmldocx can add html to an existing document
    new_parser.add_html_to_document(html, document)
    
    # Save the document
    out_path = "PublishAI_Onboarding.docx"
    document.save(out_path)
    print(f"Document saved to {out_path}")

if __name__ == '__main__':
    main()
