"use client";

import { useTranslations } from "next-intl";
import { SubmissionPanel } from "../submission/SubmissionPanel";
import { useEffect, useState, useRef, useCallback } from "react";
import { toast } from "sonner";

import { 
  Upload, MessageSquareText, ClipboardList, BookOpen, Microscope, 
  PenTool, Play, ShieldCheck, FileCheck, Package, Download, Loader2, CheckCircle
} from "lucide-react";

type FlowStep = {
  id: number;
  icon: React.ElementType;
  titleKey: string;
  descKey: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  model: string;
};

const FLOW_STEPS: FlowStep[] = [
  {
    id: 0,
    icon: Upload,
    titleKey: "steps.upload.title",
    descKey: "steps.upload.desc",
    color: "text-slate-700",
    bgColor: "bg-slate-50",
    borderColor: "border-slate-300",
    glowColor: "shadow-slate-200/60",
    model: "",
  },
  {
    id: 1,
    icon: MessageSquareText,
    titleKey: "steps.clarification.title",
    descKey: "steps.clarification.desc",
    color: "text-sky-700",
    bgColor: "bg-sky-50",
    borderColor: "border-sky-300",
    glowColor: "shadow-sky-200/60",
    model: "Sonnet",
  },
  {
    id: 2,
    icon: ClipboardList,
    titleKey: "steps.planning.title",
    descKey: "steps.planning.desc",
    color: "text-violet-700",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-300",
    glowColor: "shadow-violet-200/60",
    model: "Opus",
  },
  {
    id: 3,
    icon: BookOpen,
    titleKey: "steps.knowledge.title",
    descKey: "steps.knowledge.desc",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-300",
    glowColor: "shadow-amber-200/60",
    model: "Sonnet",
  },
  {
    id: 4,
    icon: Microscope,
    titleKey: "steps.review.title",
    descKey: "steps.review.desc",
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-300",
    glowColor: "shadow-rose-200/60",
    model: "Opus",
  },
  {
    id: 5,
    icon: PenTool,
    titleKey: "steps.writing.title",
    descKey: "steps.writing.desc",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-300",
    glowColor: "shadow-emerald-200/60",
    model: "Opus",
  },
  {
    id: 6,
    icon: Play,
    titleKey: "steps.execution.title",
    descKey: "steps.execution.desc",
    color: "text-sky-600",
    bgColor: "bg-sky-50",
    borderColor: "border-blue-300",
    glowColor: "shadow-sky-200/60",
    model: "Opus",
  },
  {
    id: 7,
    icon: ShieldCheck,
    titleKey: "steps.qa.title",
    descKey: "steps.qa.desc",
    color: "text-teal-700",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-300",
    glowColor: "shadow-teal-200/60",
    model: "Sonnet",
  },
  {
    id: 8,
    icon: FileCheck,
    titleKey: "steps.verification.title",
    descKey: "steps.verification.desc",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    glowColor: "shadow-orange-200/60",
    model: "Sonnet",
  },
  {
    id: 9,
    icon: Package,
    titleKey: "steps.compilation.title",
    descKey: "steps.compilation.desc",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
    glowColor: "shadow-green-200/60",
    model: "Sonnet",
  },
  {
    id: 10,
    icon: Download,
    titleKey: "steps.export.title",
    descKey: "steps.export.desc",
    color: "text-sky-600",
    bgColor: "bg-sky-50",
    borderColor: "border-blue-300",
    glowColor: "shadow-sky-200/60",
    model: "",
  },
];


export default function PaperProcessingUI({ paperId, initialStatus }: { paperId: number, initialStatus: string }) {
  const t = useTranslations("Dashboard.SystemFlow");
  const [currentStepIndex, setCurrentStepIndex] = useState(1); // Skip upload step
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set([0]));
  const [isFinished, setIsFinished] = useState(false);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Captcha state
  const [requiresCaptcha, setRequiresCaptcha] = useState(initialStatus === "requires_captcha");
  const [captchaInput, setCaptchaInput] = useState("");
  const [submittingCaptcha, setSubmittingCaptcha] = useState(false);

  // Auto-advance for visual simulation
  useEffect(() => {
    if (isFinished || requiresCaptcha) return;
    
    // Scroll current step into view
    const currentEl = stepRefs.current[currentStepIndex];
    if (currentEl) {
      currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    const timer = setTimeout(() => {
      setCompletedSteps((prev: Set<number>) => new Set([...prev, currentStepIndex]));
      
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < FLOW_STEPS.length) {
        setCurrentStepIndex(nextIndex);
      } else {
        setIsFinished(true);
      }
    }, 4500); // 4.5 seconds per agent for simulation

    return () => clearTimeout(timer);
  }, [currentStepIndex, isFinished, requiresCaptcha]);

  const handleCaptchaSubmit = async () => {
    try {
      setSubmittingCaptcha(true);
      const res = await fetch(`/api/submissions/${paperId}/captcha`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ captcha: captchaInput })
      });
      if (res.ok) {
        setRequiresCaptcha(false);
        setCaptchaInput("");
      } else {
        toast.error("Failed to submit captcha");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingCaptcha(false);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-8 border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] relative overflow-hidden">
      {requiresCaptcha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Solve Captcha</h3>
            <p className="text-slate-600 mb-6">A captcha is required to continue the submission process.</p>
            <input 
              type="text" 
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 mb-6"
              placeholder="Enter captcha text..."
            />
            <button
              onClick={handleCaptchaSubmit}
              disabled={submittingCaptcha || !captchaInput}
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submittingCaptcha ? "Submitting..." : "Submit Captcha"}
            </button>
          </div>
        </div>
      )}

      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50/50 via-transparent to-sky-50/50 pointer-events-none" />
      <h2 className="text-2xl font-bold mb-8 text-slate-800">{t("workingProcess")}</h2>
      
      <div className="flex flex-col gap-6 relative before:absolute before:inset-0 before:ml-[2.25rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
        {FLOW_STEPS.map((step, index) => {
          const isCurrent = index === currentStepIndex;
          const isCompleted = completedSteps.has(index);
          const isFuture = index > currentStepIndex;
          const Icon = step.icon;

          if (isFuture) return null;

          return (
            <div 
              key={step.id} 
              ref={(el) => { stepRefs.current[index] = el; }}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white z-10 
                  shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2
                  border-slate-300">
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-sky-500 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5 text-slate-400" />
                )}
              </div>
              
              <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl border transition-all duration-500 relative overflow-hidden backdrop-blur-md
                ${isCurrent 
                  ? 'bg-sky-50/80 border-blue-300 shadow-[0_8px_24px_rgba(59,130,246,0.12)] scale-[1.02]' 
                  : 'bg-white/40 border-white/60 hover:bg-white/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)]'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${step.bgColor}`}>
                    <Icon className={`w-5 h-5 ${isCurrent ? step.color : 'text-slate-500'}`} />
                  </div>
                  <h3 className={`font-bold text-lg ${isCurrent ? 'text-sky-800' : 'text-slate-700'}`}>
                    {t(step.titleKey)}
                  </h3>
                </div>
                
                <p className="text-slate-600 leading-relaxed">
                  {t(step.descKey)}
                </p>

                {isCurrent && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-sky-500 bg-sky-100/50 p-2 rounded-lg">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t("agentWorking")}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isFinished && (
        <div className="mt-12 text-center p-10 bg-green-50/70 backdrop-blur-md rounded-[2rem] border border-green-200/50 shadow-[0_8px_32px_rgba(34,197,94,0.08)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-100/30 to-emerald-50/20 pointer-events-none" />
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-5 drop-shadow-sm" />
          <h3 className="text-2xl font-bold text-green-800 mb-3">{t("processComplete")}</h3>
          <p className="text-green-700/90 mb-6">{t("processCompleteDesc")}</p>
          
          <button
            onClick={async () => {
              try {
                // Mock submission ID for the UI flow trigger if a real one isn't present in this context
                const submissionId = paperId || 1; 
                const res = await fetch(`/api/submissions/${submissionId}/submit`, {
                  method: "POST",
                });
                if (res.ok) {
                  toast.success("RPA Autonomous Submission initiated successfully!");
                } else {
                  toast.error("Failed to initiate submission.");
                }
              } catch (err) {
                console.error("Submission failed:", err);
              }
            }}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Approve & Submit
          </button>
        </div>
      )}

      {isFinished && (
        <div className="mt-8">
          <SubmissionPanel paperId={paperId} />
        </div>
      )}
    </div>
  );
}
