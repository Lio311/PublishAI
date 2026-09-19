import re

with open("src/app/[locale]/(dashboard)/admin/architecture/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Generate the navigation buttons HTML
nav_buttons = """
              {/* Navigation Buttons */}
              <div className="mt-auto pt-8 border-t border-slate-100 flex items-center justify-between">
                {(() => {
                  const currentIndex = currentPhaseSteps.findIndex(s => s.id === activeStep);
                  const prevStep = currentIndex > 0 ? currentPhaseSteps[currentIndex - 1] : null;
                  const nextStep = currentIndex < currentPhaseSteps.length - 1 ? currentPhaseSteps[currentIndex + 1] : null;
                  
                  return (
                    <>
                      {prevStep ? (
                        <button
                          onClick={() => {
                            setActiveStep(prevStep.id);
                            setSelectedTool(null);
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors font-medium text-sm ${isHe ? 'ml-auto' : 'mr-auto'}`}
                        >
                          <ArrowRight className={`w-4 h-4 ${isHe ? '' : 'rotate-180'}`} />
                          {isHe ? 'השלב הקודם' : 'Previous Step'}
                        </button>
                      ) : <div className={isHe ? 'ml-auto' : 'mr-auto'}></div>}
                      
                      {nextStep && (
                        <button
                          onClick={() => {
                            setActiveStep(nextStep.id);
                            setSelectedTool(null);
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors font-medium text-sm shadow-sm"
                        >
                          {isHe ? 'השלב הבא' : 'Next Step'}
                          <ArrowRight className={`w-4 h-4 ${isHe ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
"""

# Inject before the closing </motion.div>
content = content.replace("            </motion.div>", nav_buttons + "\n            </motion.div>")

with open("src/app/[locale]/(dashboard)/admin/architecture/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

