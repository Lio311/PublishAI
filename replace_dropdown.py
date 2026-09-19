import re

with open("src/app/[locale]/architecture/ArchitectureClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Locate the select block
start_tag = r'\{/\* Mobile Step Selector \(Dropdown\) \*/\}'
end_tag = r'\{/\* Desktop Step Selector \(Sidebar\) \*/\}'

match = re.search(f'({start_tag}.*?){end_tag}', content, flags=re.DOTALL)
if match:
    old_block = match.group(1)
    new_block = """{/* Mobile Step Selector (Custom Animated Dropdown) */}
          <div className="block lg:hidden mb-4 relative z-50">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              {isHe ? "בחר שלב בתהליך:" : "Select Step:"}
            </label>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-white border border-slate-300 text-slate-800 font-medium py-3 px-4 rounded-xl shadow-sm flex items-center justify-between hover:border-sky-400 hover:ring-1 hover:ring-sky-400 transition-all focus:outline-none"
              dir={isHe ? "rtl" : "ltr"}
            >
              <span className="truncate">{stepData.title[locale]}</span>
              <motion.div
                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className={`text-slate-500 shrink-0 ${isHe ? 'mr-4' : 'ml-4'}`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </motion.div>
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 divide-y divide-slate-100"
                  dir={isHe ? "rtl" : "ltr"}
                >
                  {currentPhaseSteps.map((step) => (
                    <button
                      key={step.id}
                      onClick={() => {
                        setActiveStep(step.id);
                        setSelectedTool(null);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-start px-4 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                        activeStep === step.id ? "bg-sky-50 text-sky-700 font-bold" : "text-slate-700 font-medium"
                      }`}
                    >
                      <span>{step.title[locale]}</span>
                      {activeStep === step.id && (
                        <CheckCircle className="w-5 h-5 text-sky-500 shrink-0" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          """
    content = content.replace(old_block, new_block)
    with open("src/app/[locale]/architecture/ArchitectureClient.tsx", "w", encoding="utf-8") as f:
        f.write(content)
else:
    print("Could not find the mobile step selector block.")

