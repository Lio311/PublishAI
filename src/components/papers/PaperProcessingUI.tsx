"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { 
  Upload, MessageSquareText, FileText, Brain, Search, 
  Microscope, PenTool, CheckCircle, ShieldCheck, FileCheck, Loader2
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
  },
  {
    id: 2,
    icon: FileText,
    titleKey: "steps.planning.title",
    descKey: "steps.planning.desc",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    glowColor: "shadow-blue-200/60",
  },
  {
    id: 3,
    icon: Brain,
    titleKey: "steps.knowledge.title",
    descKey: "steps.knowledge.desc",
    color: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-300",
    glowColor: "shadow-indigo-200/60",
  },
  {
    id: 4,
    icon: Search,
    titleKey: "steps.figures.title",
    descKey: "steps.figures.desc",
    color: "text-violet-700",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-300",
    glowColor: "shadow-violet-200/60",
  },
  {
    id: 5,
    icon: Microscope,
    titleKey: "steps.scientific.title",
    descKey: "steps.scientific.desc",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-300",
    glowColor: "shadow-purple-200/60",
  },
  {
    id: 6,
    icon: PenTool,
    titleKey: "steps.writing.title",
    descKey: "steps.writing.desc",
    color: "text-fuchsia-700",
    bgColor: "bg-fuchsia-50",
    borderColor: "border-fuchsia-300",
    glowColor: "shadow-fuchsia-200/60",
  },
  {
    id: 7,
    icon: CheckCircle,
    titleKey: "steps.execution.title",
    descKey: "steps.execution.desc",
    color: "text-pink-700",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-300",
    glowColor: "shadow-pink-200/60",
  },
  {
    id: 8,
    icon: ShieldCheck,
    titleKey: "steps.qa.title",
    descKey: "steps.qa.desc",
    color: "text-rose-700",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-300",
    glowColor: "shadow-rose-200/60",
  },
  {
    id: 9,
    icon: FileCheck,
    titleKey: "steps.verification.title",
    descKey: "steps.verification.desc",
    color: "text-orange-700",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    glowColor: "shadow-orange-200/60",
  },
  {
    id: 10,
    icon: CheckCircle,
    titleKey: "steps.submission.title",
    descKey: "steps.submission.desc",
    color: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
    glowColor: "shadow-green-200/60",
  }
];

export default function PaperProcessingUI({ paperId, initialStatus }: { paperId: number, initialStatus: string }) {
  const t = useTranslations("Dashboard.SystemFlow");
  const [currentStepIndex, setCurrentStepIndex] = useState(1); // Skip upload step
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set([0]));
  const [isFinished, setIsFinished] = useState(false);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-advance for visual simulation
  useEffect(() => {
    if (isFinished) return;
    
    // Scroll current step into view
    const currentEl = stepRefs.current[currentStepIndex];
    if (currentEl) {
      currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    const timer = setTimeout(() => {
      setCompletedSteps(prev => new Set([...prev, currentStepIndex]));
      
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < FLOW_STEPS.length) {
        setCurrentStepIndex(nextIndex);
      } else {
        setIsFinished(true);
      }
    }, 4500); // 4.5 seconds per agent for simulation

    return () => clearTimeout(timer);
  }, [currentStepIndex, isFinished]);

  return (
    <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
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
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                ) : (
                  <Icon className="w-5 h-5 text-slate-400" />
                )}
              </div>
              
              <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border-2 transition-all duration-500
                ${isCurrent ? 'bg-blue-50 border-blue-400 shadow-md shadow-blue-100' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${step.bgColor}`}>
                    <Icon className={`w-5 h-5 ${isCurrent ? step.color : 'text-slate-500'}`} />
                  </div>
                  <h3 className={`font-bold text-lg ${isCurrent ? 'text-blue-900' : 'text-slate-700'}`}>
                    {t(step.titleKey)}
                  </h3>
                </div>
                
                <p className="text-slate-600 leading-relaxed">
                  {t(step.descKey)}
                </p>

                {isCurrent && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 bg-blue-100/50 p-2 rounded-lg">
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
        <div className="mt-12 text-center p-8 bg-green-50 rounded-xl border border-green-200">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-800 mb-2">{t("processComplete")}</h3>
          <p className="text-green-700">{t("processCompleteDesc")}</p>
        </div>
      )}
    </div>
  );
}
