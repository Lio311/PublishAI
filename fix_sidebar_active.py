import re

with open("src/components/layout/AnimatedSidebar.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the loop to pre-calculate the active index
# We need to find the item in menuItems that matches the pathname best.
# The best match is the one where pathname starts with item.href, and item.href is the longest.

replacement = """  const activeItem = [...menuItems].sort((a, b) => b.href.length - a.href.length).find(
    item => pathname === item.href || (item.href !== `/${locale}` && pathname.startsWith(item.href))
  );

  return (
    <aside"""

content = content.replace("  return (\n    <aside", replacement)

# Then in the map, replace isActive
content = content.replace(
    "const isActive = pathname === item.href || (item.href !== `/${locale}` && pathname.startsWith(item.href));",
    "const isActive = activeItem?.href === item.href;"
)

with open("src/components/layout/AnimatedSidebar.tsx", "w", encoding="utf-8") as f:
    f.write(content)

