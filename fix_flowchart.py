import re

with open('src/app/[locale]/flowchart/FlowchartClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix TurnArrow height
content = content.replace(
    "h-full border-slate-400",
    "h-[calc(100%+3rem)] border-slate-400"
)

# 2. Fix Row 2 flex direction
content = content.replace(
    "${isHe ? 'lg:flex-row' : 'lg:flex-row-reverse'}",
    "lg:flex-row-reverse"
)

with open('src/app/[locale]/flowchart/FlowchartClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

