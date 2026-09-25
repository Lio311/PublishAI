import os

file_path = "src/app/[locale]/flowchart/FlowchartClient.tsx"
with open(file_path, "r") as f:
    content = f.read()

# I will replace the TurnArrow component completely with a SideDropArrow
turn_arrow_def = """function TurnArrow({ isHe, direction }: { isHe: boolean, direction: 'right-to-left' | 'left-to-right' }) {
  const isRightSide = (isHe && direction === 'left-to-right') || (!isHe && direction === 'right-to-left');
  
  return (
    <div className={`hidden lg:block absolute top-1/2 w-8 h-[calc(100%+3rem)] border-slate-400 z-0 ${isRightSide ? 'right-0 border-r-[3px] border-y-[3px] rounded-r-xl translate-x-[90%]' : 'left-0 border-l-[3px] border-y-[3px] rounded-l-xl -translate-x-[90%]'}`}>
      <div className={`absolute bottom-[-1px] ${isRightSide ? 'left-[-4px]' : 'right-[-4px]'} border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ${isRightSide ? 'border-r-[10px] border-r-slate-400' : 'border-l-[10px] border-l-slate-400'}`}></div>
    </div>
  );
}"""

side_drop_arrow_def = """function SideDropArrow({ isRightSide }: { isRightSide: boolean }) {
  return (
    <div className={`hidden lg:flex absolute top-[100%] h-12 w-[175px] justify-center z-0 ${isRightSide ? 'right-0' : 'left-0'}`}>
      <div className="h-[120%] w-[3px] bg-slate-400 relative">
        <div className="absolute bottom-[-1px] left-1/2 -translate-x-1/2 border-t-[10px] border-t-slate-400 border-x-[6px] border-x-transparent"></div>
      </div>
    </div>
  );
}"""

content = content.replace(turn_arrow_def, side_drop_arrow_def)

# In Row 1
content = content.replace('<TurnArrow isHe={isHe} direction="right-to-left" />', '<SideDropArrow isRightSide={!isHe} />')

# In Row 2
content = content.replace('<TurnArrow isHe={isHe} direction="left-to-right" />', '<SideDropArrow isRightSide={isHe} />')


with open(file_path, "w") as f:
    f.write(content)
