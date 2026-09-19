import re

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add the UI for prompt under the step description
ui_addition = '''                  <p className="text-slate-600 leading-relaxed text-lg">{stepData.description[locale]}</p>
                  
                  {/* Step Agent System Prompt */}
                  {stepData.prompt && (
                    <div className="mt-6 p-4 md:p-5 bg-slate-800 rounded-xl border border-slate-700 shadow-inner">
                      <div className="flex items-center gap-2 mb-3">
                        <Terminal className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                          {isHe ? 'פרומפט מערכת (System Prompt)' : 'Agent System Prompt'}
                        </h4>
                      </div>
                      <div className={`text-slate-300 font-mono text-sm leading-relaxed ${isHe ? 'font-sans' : ''} whitespace-pre-wrap`} dir={isHe ? "rtl" : "ltr"}>
                        {stepData.prompt[locale]}
                      </div>
                    </div>
                  )}'''

content = content.replace(
    '<p className="text-slate-600 leading-relaxed text-lg">{stepData.description[locale]}</p>',
    ui_addition
)

# We need to make sure 'Terminal' icon is imported from lucide-react
if "Terminal" not in content[:1000]:
    content = content.replace(
        'import { FileText, Database, ShieldCheck, Download, Activity, Save, Search, Edit3, MessageSquare, ListChecks, CheckCircle2, GitMerge, FileCheck, Layers, Upload, ArrowRight, Menu, X, ChevronRight, ChevronLeft, LayoutDashboard, Settings, LogOut, Cpu, Info, BarChart2, Scissors, BrainCircuit } from "lucide-react";',
        'import { FileText, Database, ShieldCheck, Download, Activity, Save, Search, Edit3, MessageSquare, ListChecks, CheckCircle2, GitMerge, FileCheck, Layers, Upload, ArrowRight, Menu, X, ChevronRight, ChevronLeft, LayoutDashboard, Settings, LogOut, Cpu, Info, BarChart2, Scissors, BrainCircuit, Terminal } from "lucide-react";'
    )

with open("src/app/[locale]/(dashboard)/admin/architecture/ArchitectureClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)

