import re

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("export default function ArchitectureInteractivePage() {", "export default function ArchitectureClient({ isAdmin }: { isAdmin: boolean }) {")

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)

