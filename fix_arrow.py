with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "r") as f:
    content = f.read()

bad_arrow = """                {/* Arrow coming from missing creds */}
                <div className="hidden lg:block absolute -left-[14px] top-1/2 w-4 border-b-[3px] border-slate-400"></div>
                <div className="hidden lg:block absolute -left-[12px] top-[calc(50%-4px)] border-l-[8px] border-l-slate-400 border-y-[5px] border-y-transparent z-20"></div>"""

content = content.replace(bad_arrow, "")

with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "w") as f:
    f.write(content)
