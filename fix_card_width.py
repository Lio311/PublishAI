with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "r") as f:
    content = f.read()

old_code = """<div className={`w-[175px] min-h-[110px] flex flex-col rounded-xl border-[3px] ${s.border} ${s.bg} p-2.5 shadow-md transition-all hover:shadow-lg hover:-translate-y-1 group shrink-0 relative z-10 bg-opacity-95`}>"""
new_code = """<div className={`w-full max-w-[175px] min-w-[130px] shrink flex-1 min-h-[110px] flex flex-col rounded-xl border-[3px] ${s.border} ${s.bg} p-2 shadow-md transition-all hover:shadow-lg hover:-translate-y-1 group relative z-10 bg-opacity-95`}>"""

if old_code in content:
    content = content.replace(old_code, new_code)
    with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "w") as f:
        f.write(content)
    print("Success")
else:
    print("Not found")
