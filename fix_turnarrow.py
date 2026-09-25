import re

with open('src/app/[locale]/flowchart/FlowchartClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Change z-0 to z-20 for TurnArrow to render over cards
content = content.replace(
    "className={`hidden lg:block absolute top-1/2 w-8 h-[calc(100%+3rem)] border-slate-400 z-0",
    "className={`hidden lg:block absolute top-1/2 w-8 h-[calc(100%+3rem)] border-slate-400 z-20"
)

# 2. Add pointer-events-none just in case
content = content.replace(
    "className={`hidden lg:block absolute top-1/2 w-8 h-[calc(100%+3rem)] border-slate-400 z-20",
    "className={`hidden lg:block absolute top-1/2 w-8 h-[calc(100%+3rem)] border-slate-400 z-20 pointer-events-none"
)

# 3. Use -translate-x-full instead of -translate-x-[90%] to align the edge perfectly, preventing line overlap with the card.
content = content.replace(
    "-translate-x-[90%]",
    "-translate-x-full"
)
content = content.replace(
    "translate-x-[90%]",
    "translate-x-full"
)


with open('src/app/[locale]/flowchart/FlowchartClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

