import re

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Flowchart wrapper: Make it collapsible on mobile
flowchart_code = r'<VisualFlowchart locale={locale} />'
collapsible_flowchart = '''
      {/* Visual Flowchart - Hidden on mobile by default or wrapped in details */}
      <div className="mb-8">
        <details className="lg:hidden bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4">
          <summary className="font-bold text-slate-700 cursor-pointer outline-none">
            {isHe ? " צפה במפת הזרימה המלאה (תרשים)" : " View Full Architecture Map"}
          </summary>
          <div className="mt-4">
            <VisualFlowchart locale={locale} />
          </div>
        </details>
        <div className="hidden lg:block">
          <VisualFlowchart locale={locale} />
        </div>
      </div>
'''
content = content.replace(flowchart_code, collapsible_flowchart)

# 2. Step Selector: Replace horizontal scroll with a Select dropdown on mobile
sidebar_code_start = r'<div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide snap-x">'
# We will use regex to replace the entire lg:col-span-1 block and add the mobile select
old_sidebar_regex = r'(<div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-2 lg:p-4 lg:max-h-\[85vh\] lg:overflow-y-auto">.*?</div>\n        </div>)'

new_sidebar = '''<div className="lg:col-span-1">
          {/* Mobile Step Selector (Dropdown) */}
          <div className="block lg:hidden mb-4">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              {isHe ? "בחר שלב בתהליך:" : "Select Step:"}
            </label>
            <div className="relative">
              <select
                value={activeStep}
                onChange={(e) => {
                  setActiveStep(Number(e.target.value));
                  setSelectedTool(null);
                }}
                className="w-full appearance-none bg-white border border-slate-300 text-slate-800 font-medium py-3 px-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-sm"
                dir={isHe ? "rtl" : "ltr"}
              >
                {currentPhaseSteps.map((step) => (
                  <option key={step.id} value={step.id}>
                    {step.title[locale]}
                  </option>
                ))}
              </select>
              <div className={`pointer-events-none absolute inset-y-0 ${isHe ? 'left-0 pl-4' : 'right-0 pr-4'} flex items-center text-slate-500`}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Desktop Step Selector (Sidebar) */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-slate-100 p-4 max-h-[85vh] overflow-y-auto sticky top-6">
            <div className="flex flex-col gap-2">
              {currentPhaseSteps.map((step) => {
                const isActive = step.id === activeStep;
                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      setActiveStep(step.id);
                      setSelectedTool(null);
                    }}
                    className={`w-full text-start flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? "bg-slate-800 text-white shadow-md transform scale-[1.02]" 
                        : "hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-transparent"
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${isActive ? "bg-white/20" : step.color.split(' ')[0]}`}>
                      <step.icon className={`w-5 h-5 ${isActive ? "text-white" : step.color.split(' ')[1]}`} />
                    </div>
                    <span className="font-medium text-sm leading-tight flex-1 whitespace-normal">{step.title[locale]}</span>
                    {isActive && <svg className={`w-4 h-4 shrink-0 opacity-70 ${isHe ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>'''

content = re.sub(old_sidebar_regex, new_sidebar, content, flags=re.DOTALL)

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)

