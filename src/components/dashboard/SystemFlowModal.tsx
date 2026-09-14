"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  X,
  MessageSquareText,
  ClipboardList,
  BookOpen,
  Microscope,
  PenTool,
  Play,
  ShieldCheck,
  FileCheck,
  Package,
  Upload,
  Download,
  ChevronDown,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

interface FlowStep {
  id: number;
  icon: React.ElementType;
  titleKey: string;
  descKey: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  model: string;
}

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
    color: "text-indigo-700",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-300",
    glowColor: "shadow-indigo-200/60",
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
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    glowColor: "shadow-blue-200/60",
    model: "",
  },
];

export default function SystemFlowModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("SystemFlow");
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [autoPlaying, setAutoPlaying] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setVisibleSteps(0);
      setActiveStep(null);
      setIsClosing(false);
      setAutoPlaying(true);
    }
  }, [isOpen]);

  // Auto-reveal steps one by one
  useEffect(() => {
    if (!isOpen || !autoPlaying) return;

    if (visibleSteps <= FLOW_STEPS.length) {
      const timer = setTimeout(
        () => {
          setVisibleSteps((prev) => prev + 1);
          if (visibleSteps < FLOW_STEPS.length) {
            setActiveStep(visibleSteps);
          }
        },
        visibleSteps === 0 ? 300 : 250
      );
      return () => clearTimeout(timer);
    } else {
      setAutoPlaying(false);
      setActiveStep(null);
    }
  }, [isOpen, visibleSteps, autoPlaying]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  }, [onClose]);

  const handleReplay = () => {
    setVisibleSteps(0);
    setActiveStep(null);
    setAutoPlaying(true);
  };

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleClose]);

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-4xl max-h-[90vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 ${
          isClosing
            ? "scale-95 opacity-0 translate-y-4"
            : "scale-100 opacity-100 translate-y-0"
        }`}
        style={{
          animation: !isClosing ? "modalSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)" : undefined,
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{t("title")}</h2>
                <p className="text-blue-100 text-sm mt-0.5">{t("subtitle")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReplay}
                className="p-2.5 hover:bg-white/20 rounded-xl transition-all duration-200 group"
                title={t("replay")}
              >
                <RotateCcw className="w-5 h-5 text-white/80 group-hover:text-white transition-colors group-hover:rotate-[-360deg] duration-500" />
              </button>
              <button
                onClick={handleClose}
                className="p-2.5 hover:bg-white/20 rounded-xl transition-all duration-200 group"
              >
                <X className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white/80 rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${(Math.min(visibleSteps, FLOW_STEPS.length) / FLOW_STEPS.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Flow Steps */}
        <div className="overflow-y-auto p-8 space-y-0" style={{ maxHeight: "calc(90vh - 140px)" }}>
          {FLOW_STEPS.map((step, index) => {
            const isVisible = index < visibleSteps;
            const isActive = activeStep === index;
            const IconComponent = step.icon;
            const isLast = index === FLOW_STEPS.length - 1;

            return (
              <div key={step.id}>
                {/* Step Card */}
                <div
                  className={`transition-all duration-700 ease-out ${
                    isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  }`}
                  style={{
                    transitionDelay: `${index * 30}ms`,
                  }}
                >
                  <div
                    onClick={() => setActiveStep(activeStep === index ? null : index)}
                    className={`relative flex items-start gap-5 p-5 rounded-2xl border-2 cursor-pointer
                      transition-all duration-300 ease-out group
                      ${
                        isActive
                          ? `${step.bgColor} ${step.borderColor} shadow-lg ${step.glowColor}`
                          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                      }
                    `}
                  >
                    {/* Step Number + Icon */}
                    <div className="flex-shrink-0 relative">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300
                          ${
                            isActive
                              ? `${step.bgColor} shadow-md`
                              : "bg-slate-100 group-hover:bg-slate-200"
                          }
                        `}
                      >
                        <IconComponent
                          className={`w-7 h-7 transition-all duration-300 ${
                            isActive ? step.color : "text-slate-500"
                          }`}
                        />
                      </div>
                      {/* Step number badge */}
                      <div
                        className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                          transition-all duration-300
                          ${
                            isActive
                              ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md scale-110"
                              : "bg-slate-200 text-slate-600"
                          }
                        `}
                      >
                        {index + 1}
                      </div>

                      {/* Pulse animation when active */}
                      {isActive && (
                        <div className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-blue-400" 
                             style={{ animationDuration: "2s" }} />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`font-bold text-lg transition-colors duration-300 ${
                            isActive ? step.color : "text-slate-800"
                          }`}
                        >
                          {t(step.titleKey)}
                        </h3>
                        {step.model && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all duration-300 ${
                              isActive
                                ? "bg-white/70 text-slate-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {step.model}
                          </span>
                        )}
                      </div>

                      {/* Description - expandable */}
                      <div
                        className={`overflow-hidden transition-all duration-500 ease-out ${
                          isActive ? "max-h-40 opacity-100 mt-1" : "max-h-0 opacity-0"
                        }`}
                      >
                        <p className="text-sm text-slate-600 leading-relaxed">
                          {t(step.descKey)}
                        </p>
                      </div>
                    </div>

                    {/* Expand indicator */}
                    <div className="flex-shrink-0 mt-1">
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                          isActive ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Connector Arrow */}
                {!isLast && (
                  <div
                    className={`flex justify-center py-1.5 transition-all duration-500 ${
                      isVisible ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-4 bg-gradient-to-b from-slate-300 to-slate-200" />
                      <ArrowRight className="w-4 h-4 text-slate-300 rotate-90" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Final success message */}
          <div
            className={`mt-6 text-center transition-all duration-700 ${
              visibleSteps > FLOW_STEPS.length
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
            }`}
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-green-200 rounded-2xl">
              <Sparkles className="w-5 h-5 text-green-600" />
              <span className="font-bold text-green-700">{t("complete")}</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
