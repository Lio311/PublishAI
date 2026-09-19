import re

with open("src/components/layout/DashboardLayout.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the Main Content opening to add a logo if !showSidebar
content = content.replace(
    '''{/* Main Content */}
      <main className="flex-1 overflow-auto relative bg-slate-50/30">''',
    '''{/* Main Content */}
      <main className="flex-1 overflow-auto relative bg-slate-50/30 flex flex-col">
        {!showSidebar && (
          <div className="hidden md:flex p-6">
            <Image src="/logo.png" alt="PublishAI Logo" width={140} height={45} className="object-contain" priority />
          </div>
        )}'''
)

with open("src/components/layout/DashboardLayout.tsx", "w", encoding="utf-8") as f:
    f.write(content)

