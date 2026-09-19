"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, Search, FileText, BarChart2, Eye, MessageSquare, 
  CheckCircle, Edit3, Save, ShieldCheck, Download, 
  Cpu, Database, Layers, ArrowRight
} from "lucide-react";

// Architecture data based on our 11-step diagram
const ARCHITECTURE_STEPS = [
  {
    id: 1,
    title: "1. Document Upload",
    description: "User uploads manuscript (PDF/Word). Next.js API Routes stream it to Vercel Blob and trigger the Inngest background engine.",
    icon: Upload,
    tools: ["Next.js 16 UI", "Vercel Blob", "Inngest"],
    color: "bg-cyan-50 text-cyan-700 border-cyan-200"
  },
  {
    id: 2,
    title: "2. Clarification Agent",
    description: "Interviews the user and extracts target journal constraints, word counts, and required formatting styles.",
    icon: Search,
    tools: ["Claude 3.5"],
    color: "bg-green-50 text-green-700 border-green-200"
  },
  {
    id: 3,
    title: "3. Planning Agent",
    description: "Drafts a high-level revision strategy, identifying logical flaws and planning structural improvements.",
    icon: FileText,
    tools: ["Claude 3.5"],
    color: "bg-green-50 text-green-700 border-green-200"
  },
  {
    id: 4,
    title: "4. Knowledge Agent",
    description: "Connects to PubMed/ArXiv via Model Context Protocol (MCP) to retrieve external literature and cross-domain analogies using GraphRAG.",
    icon: Database,
    tools: ["pgvector", "GraphRAG", "MCP"],
    color: "bg-green-50 text-green-700 border-green-200"
  },
  {
    id: 5,
    title: "5. Visual & Data Verification",
    description: "Parses charts from the PDF using Vision AI. Pipes raw numerical data into an E2B Python Sandbox to run SciPy statistical verifications.",
    icon: BarChart2,
    tools: ["Vision AI", "E2B Sandbox"],
    color: "bg-orange-50 text-orange-700 border-orange-200"
  },
  {
    id: 6,
    title: "6. Scientific Review Debate",
    description: "A parallel multi-agent debate (Vercel AI SDK). Harsh Reviewer (Claude), Novelty Reviewer (o1), and Optimist Reviewer (Gemini) debate the paper's merits.",
    icon: MessageSquare,
    tools: ["Claude 3.5", "OpenAI o1", "Gemini 1.5"],
    color: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    id: 7,
    title: "7. Area Chair Meta-Agent",
    description: "Synthesizes the parallel reviews into a final concrete rebuttal and action plan using deep logical reasoning.",
    icon: Layers,
    tools: ["OpenAI o1", "RLHF Logs"],
    color: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    id: 8,
    title: "8. Academic Writing Agent",
    description: "Rewrites and edits the text based on the Area Chair's decisions, ensuring a standard academic tone and removing 'AI-style' language.",
    icon: Edit3,
    tools: ["Claude 3.5"],
    color: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: 9,
    title: "9. Execution Agent",
    description: "Applies the line-by-line Diff changes to the manuscript. Populates the Tiptap/Monaco UI so the user can see exact modifications.",
    icon: Save,
    tools: ["Tiptap & Monaco", "Neon Postgres"],
    color: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: 10,
    title: "10. QA Agent",
    description: "Final consistency checks. Scans for plagiarism, reference formatting, and generates the final citation visual map.",
    icon: ShieldCheck,
    tools: ["react-force-graph-2d", "Claude 3.5"],
    color: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    id: 11,
    title: "11. Compilation & Export",
    description: "Packages the final approved version into Word/PDF, generates a Cover Letter, and emails the user.",
    icon: Download,
    tools: ["Next.js API", "Nodemailer"],
    color: "bg-cyan-50 text-cyan-700 border-cyan-200"
  }
];

export default function ArchitectureInteractivePage() {
  const [activeStep, setActiveStep] = useState(1);

  const stepData = ARCHITECTURE_STEPS.find(s => s.id === activeStep) || ARCHITECTURE_STEPS[0];

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">System Architecture</h1>
        <p className="text-slate-500 mt-2">Interactive exploration of the PublishAI 11-Step Algorithm & Infrastructure.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Sidebar: Stepper */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-4 max-h-[80vh] overflow-y-auto">
          <h2 className="font-semibold text-slate-700 mb-4 px-2 uppercase text-sm tracking-wider">The 11-Step Pipeline</h2>
          <div className="space-y-2">
            {ARCHITECTURE_STEPS.map((step) => {
              const isActive = step.id === activeStep;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  className={`w-full text-left flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                    isActive 
                      ? "bg-slate-800 text-white shadow-md transform scale-[1.02]" 
                      : "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${isActive ? "bg-white/20" : step.color.split(' ')[0]}`}>
                    <step.icon className={`w-5 h-5 ${isActive ? "text-white" : step.color.split(' ')[1]}`} />
                  </div>
                  <span className="font-medium text-sm">{step.title}</span>
                  {isActive && <ArrowRight className="w-4 h-4 ml-auto opacity-70" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Content: Details */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 h-full flex flex-col"
            >
              <div className="flex items-start gap-6 mb-8">
                <div className={`p-4 rounded-2xl ${stepData.color.split(' ')[0]}`}>
                  <stepData.icon className={`w-10 h-10 ${stepData.color.split(' ')[1]}`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">{stepData.title}</h2>
                  <p className="text-slate-600 leading-relaxed text-lg">{stepData.description}</p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Technologies & Agents Used</h3>
                <div className="flex flex-wrap gap-3">
                  {stepData.tools.map((tool, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center gap-2 px-4 py-2 rounded-full border bg-opacity-10 text-sm font-semibold
                        ${tool.includes("Claude") || tool.includes("OpenAI") || tool.includes("Gemini") ? "bg-purple-100 text-purple-700 border-purple-200" : ""}
                        ${tool.includes("Neon") || tool.includes("pgvector") || tool.includes("Blob") ? "bg-emerald-100 text-emerald-700 border-emerald-200" : ""}
                        ${tool.includes("Next") || tool.includes("Inngest") ? "bg-blue-100 text-blue-700 border-blue-200" : ""}
                        ${!tool.includes("Claude") && !tool.includes("OpenAI") && !tool.includes("Gemini") && !tool.includes("Neon") && !tool.includes("pgvector") && !tool.includes("Blob") && !tool.includes("Next") && !tool.includes("Inngest") ? "bg-slate-100 text-slate-700 border-slate-200" : ""}
                      `}
                    >
                      <Cpu className="w-4 h-4 opacity-70" />
                      {tool}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-12 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
                    disabled={activeStep === 1}
                    className="px-6 py-2 rounded-xl text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors font-medium"
                  >
                    Previous Step
                  </button>
                  <button 
                    onClick={() => setActiveStep(prev => Math.min(11, prev + 1))}
                    disabled={activeStep === 11}
                    className="px-6 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 disabled:opacity-50 transition-colors font-medium shadow-sm"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
