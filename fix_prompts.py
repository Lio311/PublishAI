import re

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Remove the prompt block from the Tool Explanation Panel UI.
content = re.sub(
    r'\{TOOLS_INFO\[selectedTool\]\.prompt\s*&&\s*\(\s*<div className="mt-4 pt-4 border-t border-slate-200">.*?</div>\s*\)\}',
    '',
    content,
    flags=re.DOTALL
)

# 2. Delete the prompt strings from TOOLS_INFO for Claude 3.5, GPT-4o, OpenAI o1, Gemini 1.5
content = re.sub(
    r',\s*prompt:\s*\{\s*en:[\s\S]*?(?=\}\s*\n\s*\}|,\s*"OpenAI)',
    '\n  }',
    content
)

# I'll just write a script that replaces the ARCHITECTURE_STEPS array entirely to inject prompts.
