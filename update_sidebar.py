with open("src/components/layout/AnimatedSidebar.tsx", "r") as f:
    content = f.read()

# I want to move these two lines outside of `if (isAdmin)`
# Currently:
#   if (isAdmin) {
#     menuItems.push({ name: locale === 'he' ? 'ניהול מערכת' : 'Admin Dashboard', icon: Globe, href: `/admin` });
#     menuItems.push({ name: locale === 'he' ? 'ארכיטקטורת מערכת' : 'System Architecture', icon: Share2, href: `/architecture` });
#     menuItems.push({ name: locale === 'he' ? 'תרשים זרימה' : 'System Flowchart', icon: Workflow, href: `/flowchart` });
#     menuItems.push({ name: locale === 'he' ? 'למידת מערכת' : 'AI Learning', icon: Brain, href: `/learning` });
#   }

old_block = """  if (isAdmin) {
    menuItems.push({ name: locale === 'he' ? 'ניהול מערכת' : 'Admin Dashboard', icon: Globe, href: `/admin` });
    menuItems.push({ name: locale === 'he' ? 'ארכיטקטורת מערכת' : 'System Architecture', icon: Share2, href: `/architecture` });
    menuItems.push({ name: locale === 'he' ? 'תרשים זרימה' : 'System Flowchart', icon: Workflow, href: `/flowchart` });
    menuItems.push({ name: locale === 'he' ? 'למידת מערכת' : 'AI Learning', icon: Brain, href: `/learning` });
  }"""

new_block = """  // Always visible pages
  menuItems.push({ name: locale === 'he' ? 'ארכיטקטורת מערכת' : 'System Architecture', icon: Share2, href: `/architecture` });
  menuItems.push({ name: locale === 'he' ? 'תרשים זרימה' : 'System Flowchart', icon: Workflow, href: `/flowchart` });

  if (isAdmin) {
    menuItems.push({ name: locale === 'he' ? 'ניהול מערכת' : 'Admin Dashboard', icon: Globe, href: `/admin` });
    menuItems.push({ name: locale === 'he' ? 'למידת מערכת' : 'AI Learning', icon: Brain, href: `/learning` });
  }"""

content = content.replace(old_block, new_block)

with open("src/components/layout/AnimatedSidebar.tsx", "w") as f:
    f.write(content)
