import re

with open("src/app/[locale]/(dashboard)/admin/architecture/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

replacement_stepper = """        {/* Sidebar: Stepper */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-2 lg:p-4 lg:max-h-[85vh] lg:overflow-y-auto">
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide snap-x">
            {currentPhaseSteps.map((step) => {
              const isActive = step.id === activeStep;
              return (
                <button
                  key={step.id}
                  onClick={() => {
                    setActiveStep(step.id);
                    setSelectedTool(null);
                  }}
                  className={`snap-center shrink-0 lg:w-full text-start flex items-center gap-3 lg:gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? "bg-slate-800 text-white shadow-md lg:transform lg:scale-[1.02]" 
                      : "hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-100 lg:border-transparent"
                  }`}
                >
                  <div className={`p-1.5 lg:p-2 rounded-lg shrink-0 ${isActive ? "bg-white/20" : step.color.split(' ')[0]}`}>
                    <step.icon className={`w-4 h-4 lg:w-5 lg:h-5 ${isActive ? "text-white" : step.color.split(' ')[1]}`} />
                  </div>
                  <span className="font-medium text-xs lg:text-sm leading-tight flex-1 whitespace-nowrap lg:whitespace-normal">{step.title[locale]}</span>
                  {isActive && <ArrowRight className={`hidden lg:block w-4 h-4 shrink-0 opacity-70 ${isHe ? 'rotate-180' : ''}`} />}
                </button>
              );
            })}
          </div>
        </div>"""

content = re.sub(
    r'\{\/\* Sidebar: Stepper \*\/\}.*?\{\/\* Content: Details \*\/\}',
    replacement_stepper + '\n\n        {/* Content: Details */}',
    content,
    flags=re.DOTALL
)

with open("src/app/[locale]/(dashboard)/admin/architecture/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

