import re

with open("src/components/layout/AnimatedSidebar.tsx", "r") as f:
    content = f.read()

# Add Brain to imports
content = content.replace(
    'import { FileText, Home, Settings, LogOut, Globe, Book, Link as LinkIcon, ChevronRight, Send, Share2 } from "lucide-react";',
    'import { FileText, Home, Settings, LogOut, Globe, Book, Link as LinkIcon, ChevronRight, Send, Share2, Brain } from "lucide-react";'
)

# Add menu item
old_menu = """    { name: locale === 'he' ? 'מעקב הגשות וביקורת' : 'Submissions & Reviews', icon: Send, href: `/submissions` },
    { name: t("settings"), icon: Settings, href: `/settings` },"""
new_menu = """    { name: locale === 'he' ? 'מעקב הגשות וביקורת' : 'Submissions & Reviews', icon: Send, href: `/submissions` },
    { name: locale === 'he' ? 'למידת מערכת' : 'AI Learning', icon: Brain, href: `/learning` },
    { name: t("settings"), icon: Settings, href: `/settings` },"""

content = content.replace(old_menu, new_menu)

with open("src/components/layout/AnimatedSidebar.tsx", "w") as f:
    f.write(content)
