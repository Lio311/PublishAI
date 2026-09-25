import re

with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "r") as f:
    content = f.read()

# Replace TurnArrow component
content = re.sub(r'function TurnArrow.*?\n}', r'''function SideDropArrow({ isRightSide }: { isRightSide: boolean }) {
  return (
    <div className={`hidden lg:flex absolute top-[100%] h-12 w-[175px] justify-center z-0 ${isRightSide ? 'right-0' : 'left-0'}`}>
      <div className="h-[120%] w-[3px] bg-slate-400 relative">
        <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 border-t-[10px] border-t-slate-400 border-x-[6px] border-x-transparent"></div>
      </div>
    </div>
  );
}''', content, flags=re.DOTALL)

# Replace usage
content = content.replace('<TurnArrow isHe={isHe} direction="right-to-left" />', '<SideDropArrow isRightSide={!isHe} />')
content = content.replace('<TurnArrow isHe={isHe} direction="left-to-right" />', '<SideDropArrow isRightSide={isHe} />')

with open("src/app/[locale]/flowchart/FlowchartClient.tsx", "w") as f:
    f.write(content)

