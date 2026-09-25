with open("src/components/layout/GlobalPasswordProtection.tsx", "r") as f:
    content = f.read()

# Add usePathname import
import_marker = "import { useSession, signIn } from 'next-auth/react';"
new_import = "import { useSession, signIn } from 'next-auth/react';\nimport { usePathname } from 'next/navigation';"
content = content.replace(import_marker, new_import)

# Find the start of the component
comp_start = "export default function GlobalPasswordProtection({ children }: { children: React.ReactNode }) {"
comp_start_idx = content.find(comp_start)

# Add pathname hook
new_comp_start = """export default function GlobalPasswordProtection({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isPublicRoute = pathname?.includes('/architecture') || pathname?.includes('/flowchart');"""
content = content.replace(comp_start, new_comp_start)

# Update unauthenticated check
unauth_check = "if (status === 'unauthenticated') {"
new_unauth_check = "if (status === 'unauthenticated' && !isPublicRoute) {"
content = content.replace(unauth_check, new_unauth_check)

with open("src/components/layout/GlobalPasswordProtection.tsx", "w") as f:
    f.write(content)
