import os
import re
import subprocess
import markdown
from htmldocx import HtmlToDocx
from docx import Document

def generate_mermaid_image(mermaid_text, out_path, temp_mmd="scratch/temp.mmd"):
    # Write to temp.mmd
    with open(temp_mmd, "w", encoding="utf-8") as f:
        f.write(mermaid_text)
    
    # Run npx mmdc in the scratch directory where it's installed
    # The output path is also relative to the outer directory, so we should make it absolute
    out_path_abs = os.path.abspath(out_path)
    temp_mmd_abs = os.path.abspath(temp_mmd)
    
    cmd = ["npx", "mmdc", "-i", temp_mmd_abs, "-o", out_path_abs, "-s", "4", "-b", "white"]
    try:
        subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, cwd="scratch")
        return True
    except subprocess.CalledProcessError as e:
        print(f"Failed to generate image for {out_path}: {e.stderr.decode()}")
        return False

def process_markdown(content, img_dir, prefix):
    # Find all mermaid blocks
    pattern = r"```mermaid\n(.*?)\n```"
    
    def replacer(match):
        nonlocal counter
        mermaid_code = match.group(1)
        img_filename = f"{prefix}_diagram_{counter}.png"
        img_path = os.path.join(img_dir, img_filename)
        
        print(f"Generating {img_path}...")
        if generate_mermaid_image(mermaid_code, img_path):
            counter += 1
            # Return markdown image syntax. Use relative path so htmldocx can find it maybe?
            # Actually absolute or relative to the CWD works. CWD is publish-ai.
            return f"![Diagram]({img_path})"
        else:
            return "*(Diagram rendering failed)*"
            
    counter = 1
    processed = re.sub(pattern, replacer, content, flags=re.DOTALL)
    return processed

def main():
    files = [
        "scratch/system_overview.md",
        "scratch/frontend_analysis.md",
        "scratch/backend_analysis.md",
        "scratch/integrations_analysis.md",
        "scratch/devops_analysis.md"
    ]
    
    img_dir = "scratch/images"
    os.makedirs(img_dir, exist_ok=True)
    
    combined_md = "# PublishAI - Comprehensive Project Architecture & Onboarding Document\n\n"
    
    for fpath in files:
        if os.path.exists(fpath):
            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()
                prefix = os.path.basename(fpath).split('.')[0]
                content = process_markdown(content, img_dir, prefix)
                combined_md += content + "\n\n---\n\n"
        else:
            print(f"Warning: {fpath} not found.")

    html = markdown.markdown(combined_md, extensions=['tables', 'fenced_code'])
    
    document = Document()
    new_parser = HtmlToDocx()
    document.add_heading('PublishAI Technical Onboarding Document', 0)
    new_parser.add_html_to_document(html, document)
    
    out_path = "PublishAI_Onboarding.docx"
    document.save(out_path)
    print(f"Document saved to {out_path}")

if __name__ == '__main__':
    main()
