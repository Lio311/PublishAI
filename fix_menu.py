with open("src/components/layout/AnimatedSidebar.tsx", "r") as f:
    content = f.read()

old_block = """  // Always visible pages
  menuItems.push({ name: locale === 'he' ? 'ארכיטקטורת מערכת' : 'System Architecture', icon: Share2, href: `/architecture` });
  menuItems.push({ name: locale === 'he' ? 'תרשים זרימה' : 'System Flowchart', icon: Workflow, href: `/flowchart` });

  if (isAdmin) {
    menuItems.push({ name: locale === 'he' ? 'ניהול מערכת' : 'Admin Dashboard', icon: Globe, href: `/admin` });
    menuItems.push({ name: locale === 'he' ? 'למידת מערכת' : 'AI Learning', icon: Brain, href: `/learning` });
  }"""

new_block = """  if (isAdmin) {
    menuItems.push({ name: locale === 'he' ? 'ניהול מערכת' : 'Admin Dashboard', icon: Globe, href: `/admin` });
    menuItems.push({ name: locale === 'he' ? 'למידת מערכת' : 'AI Learning', icon: Brain, href: `/learning` });
    
    // Admin-only menu items, but accessible via direct link to anyone with site password
    menuItems.push({ name: locale === 'he' ? 'ארכיטקטורת מערכת' : 'System Architecture', icon: Share2, href: `/architecture` });
    menuItems.push({ name: locale === 'he' ? 'תרשים זרימה' : 'System Flowchart', icon: Workflow, href: `/flowchart` });
  }"""

content = content.replace(old_block, new_block)

with open("src/components/layout/AnimatedSidebar.tsx", "w") as f:
    f.write(content)
