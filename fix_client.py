import re

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("export default function ArchitecturePage() {", "export default function ArchitectureClient({ isAdmin }: { isAdmin: boolean }) {")
content = content.replace("<DashboardLayout isAdmin={true}>", "<DashboardLayout isAdmin={isAdmin} showSidebar={isAdmin}>")

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)

