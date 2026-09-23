import re

with open("src/app/[locale]/(dashboard)/learning/page.tsx", "r") as f:
    content = f.read()

# Add redirect import if missing
if 'import { redirect } from "next/navigation";' not in content:
    content = content.replace(
        'import { checkIsAdmin } from "@/services/auth-utils";',
        'import { checkIsAdmin } from "@/services/auth-utils";\nimport { redirect } from "next/navigation";'
    )

# Add redirect logic
old_admin_check = """  const isAdmin = await checkIsAdmin();
  const locale = params.locale;
  const isHe = locale === "he";"""

new_admin_check = """  const isAdmin = await checkIsAdmin();
  const locale = params.locale;
  if (!isAdmin) {
    redirect(`/${locale}`);
  }
  
  const isHe = locale === "he";"""

content = content.replace(old_admin_check, new_admin_check)

with open("src/app/[locale]/(dashboard)/learning/page.tsx", "w") as f:
    f.write(content)
