with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "r") as f:
    content = f.read()

old_code = """function DataLabel({ label, isHe }: { label: { en: string; he: string }; isHe: boolean }) {
  return (
    <div className="absolute top-0 -translate-y-[60%] left-1/2 -translate-x-1/2 text-[9.5px] font-mono bg-white text-slate-600 px-1.5 py-0.5 rounded border border-slate-300 whitespace-nowrap shadow-sm z-20">
      {isHe ? label.he : label.en}
    </div>
  );
}"""

new_code = """function DataLabel({ label, isHe }: { label: { en: string; he: string }; isHe: boolean }) {
  return (
    <div className="absolute bottom-[calc(50%+4px)] left-1/2 -translate-x-1/2 text-[9.5px] font-mono bg-white/90 text-slate-600 px-1.5 py-0.5 rounded border border-slate-300 whitespace-nowrap shadow-sm z-20">
      {isHe ? label.he : label.en}
    </div>
  );
}"""

content = content.replace(old_code, new_code)

with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "w") as f:
    f.write(content)
