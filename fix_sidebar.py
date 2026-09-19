import re

with open("src/components/layout/AnimatedSidebar.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace /admin/architecture with /architecture
content = content.replace('/admin/architecture', '/architecture')

with open("src/components/layout/AnimatedSidebar.tsx", "w", encoding="utf-8") as f:
    f.write(content)

