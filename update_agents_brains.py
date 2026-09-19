import re

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Step 4: Knowledge Agent
# Add Claude 3.7
content = re.sub(
    r'(id: 4, phase: 1,\n\s*title: \{ en: "4. Knowledge Agent".*?\n\s*description: \{.*?\},\n\s*prompt: \{.*?\},\n\s*icon: .*?, tools: \[)(.*?)\]',
    r'\1"Claude 3.7", \2]',
    content,
    flags=re.DOTALL
)

# Step 5: Verification
content = re.sub(
    r'(id: 5, phase: 1,\n\s*title: \{ en: "5. Visual & Data Verification".*?\n\s*description: \{.*?\},\n\s*prompt: \{.*?\},\n\s*icon: .*?, tools: \[)(.*?)\]',
    r'\1"Claude 3.7", \2]',
    content,
    flags=re.DOTALL
)

# Step 9: Execution Agent
# First, insert prompt, then add Claude 3 Opus to tools
content = re.sub(
    r'(id: 9, phase: 1,\n\s*title: \{ en: "9. Execution Agent".*?\n\s*description: \{.*?\},\n\s*icon: .*?, tools: \[)(.*?)\]',
    r'    prompt: { \n      en: "Create a structured summary of the changes made between the original manuscript and the rewritten version.", \n      he: "צור סיכום מובנה של השינויים שבוצעו בין כתב היד המקורי לגרסה המשוכתבת." \n    },\n\1"Claude 3 Opus", \2]',
    content,
    flags=re.DOTALL
)

# Step 11: Compilation
content = re.sub(
    r'(id: 11, phase: 1,\n\s*title: \{ en: "11. Compilation & Export".*?\n\s*description: \{.*?\},\n\s*prompt: \{.*?\},\n\s*icon: .*?, tools: \[)(.*?)\]',
    r'\1"Claude 3.7", \2]',
    content,
    flags=re.DOTALL
)

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)

