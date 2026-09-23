import re

with open("src/components/layout/AnimatedSidebar.tsx", "r") as f:
    content = f.read()

# Remove the menu item from the main list
old_main = """    { name: locale === 'he' ? 'מעקב הגשות וביקורת' : 'Submissions & Reviews', icon: Send, href: `/submissions` },
    { name: locale === 'he' ? 'למידת מערכת' : 'AI Learning', icon: Brain, href: `/learning` },
    { name: t("settings"), icon: Settings, href: `/settings` },"""

new_main = """    { name: locale === 'he' ? 'מעקב הגשות וביקורת' : 'Submissions & Reviews', icon: Send, href: `/submissions` },
    { name: t("settings"), icon: Settings, href: `/settings` },"""

content = content.replace(old_main, new_main)

# Add it to the admin block
old_admin = """  if (isAdmin) {
    menuItems.push({ name: locale === 'he' ? 'ניהול מערכת' : 'Admin Dashboard', icon: Globe, href: `/admin` });
    menuItems.push({ name: locale === 'he' ? 'ארכיטקטורת מערכת' : 'System Architecture', icon: Share2, href: `/architecture` });
  }"""

new_admin = """  if (isAdmin) {
    menuItems.push({ name: locale === 'he' ? 'ניהול מערכת' : 'Admin Dashboard', icon: Globe, href: `/admin` });
    menuItems.push({ name: locale === 'he' ? 'ארכיטקטורת מערכת' : 'System Architecture', icon: Share2, href: `/architecture` });
    menuItems.push({ name: locale === 'he' ? 'למידת מערכת' : 'AI Learning', icon: Brain, href: `/learning` });
  }"""

content = content.replace(old_admin, new_admin)

with open("src/components/layout/AnimatedSidebar.tsx", "w") as f:
    f.write(content)
