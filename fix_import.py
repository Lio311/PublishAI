import re

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add Terminal to the lucide-react import
content = re.sub(
    r'import \{([^\}]+)\} from "lucide-react";',
    lambda m: f'import {{{m.group(1)}, Terminal}} from "lucide-react";' if 'Terminal' not in m.group(1) else m.group(0),
    content
)

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)

