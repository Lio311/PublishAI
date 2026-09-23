import re

with open("src/app/[locale]/(dashboard)/learning/page.tsx", "r") as f:
    content = f.read()

content = content.replace("<DashboardLayout>", "<DashboardLayout isAdmin={isAdmin}>")

with open("src/app/[locale]/(dashboard)/learning/page.tsx", "w") as f:
    f.write(content)
