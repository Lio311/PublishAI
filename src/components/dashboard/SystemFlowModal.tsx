"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  Workflow,
  CircleCheckBig,
  ArrowRight,
  RotateCcw,
  Pause,
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

// Timing constants (ms)
const INITIAL_DELAY = 700;
const STEP_APPEAR_DURATION = 500;
const STEP_OPEN_DURATION = 600;
const STEP_HOLD_DURATION = 3800;
const STEP_CLOSE_DURATION = 500;
const NEXT_STEP_DELAY = 400;
const COMPLETION_DELAY = 600;

type AnimPhase = "idle" | "appearing" | "opening" | "holding" | "closing";

export default function SystemFlowModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("SystemFlow");
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [animPhase, setAnimPhase] = useState<AnimPhase>("idle");
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isClosing, setIsClosing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const finishRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending timer
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Smooth scroll to a step element
  const scrollToStep = useCallback((index: number) => {
    const el = stepRefs.current[index];
    if (el && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const elRect = el.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const offset = elRect.top - containerRect.top + container.scrollTop - 40;
      container.scrollTo({ top: offset, behavior: "smooth" });
    }
  }, []);

  const scrollToFinish = useCallback(() => {
    if (finishRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const elRect = finishRef.current.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const offset = elRect.top - containerRect.top + container.scrollTop - 80;
      container.scrollTo({ top: offset, behavior: "smooth" });
    }
  }, []);

  // Block user scroll on the container during animation
  useEffect(() => {
    const container = scrollContainerRef.current;
    // If modal is closed or animation is finished, allow scrolling
    if (!container || !isOpen || isFinished) return;

    const blockScroll = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };

    container.addEventListener("wheel", blockScroll, { passive: false });
    container.addEventListener("touchmove", blockScroll, { passive: false });

    return () => {
      container.removeEventListener("wheel", blockScroll);
      container.removeEventListener("touchmove", blockScroll);
    };
  }, [isOpen, isFinished]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(-1);
      setAnimPhase("idle");
      setCompletedSteps(new Set());
      setIsClosing(false);
      setIsFinished(false);
      setIsPaused(false);
      clearTimer();

      // Start the sequence after initial delay
      timerRef.current = setTimeout(() => {
        setCurrentStepIndex(0);
        setAnimPhase("appearing");
      }, INITIAL_DELAY);
    }

    return () => clearTimer();
  }, [isOpen, clearTimer]);

  // Main animation state machine
  useEffect(() => {
    if (!isOpen || isPaused || currentStepIndex < 0 || currentStepIndex >= FLOW_STEPS.length) return;

    clearTimer();

    switch (animPhase) {
      case "appearing":
        // Step fades in, scroll to it
        scrollToStep(currentStepIndex);
        timerRef.current = setTimeout(() => {
          setAnimPhase("opening");
        }, STEP_APPEAR_DURATION);
        break;

      case "opening":
        // Description expands
        timerRef.current = setTimeout(() => {
          setAnimPhase("holding");
        }, STEP_OPEN_DURATION);
        break;

      case "holding":
        // Hold open for reading
        timerRef.current = setTimeout(() => {
          setAnimPhase("closing");
        }, STEP_HOLD_DURATION);
        break;

      case "closing":
        // Description collapses, mark as completed
        setCompletedSteps((prev) => new Set(prev).add(currentStepIndex));
        timerRef.current = setTimeout(() => {
          const nextIndex = currentStepIndex + 1;
          if (nextIndex < FLOW_STEPS.length) {
            // Move to next step
            setCurrentStepIndex(nextIndex);
            setAnimPhase("appearing");
          } else {
            // All done
            setAnimPhase("idle");
            timerRef.current = setTimeout(() => {
              setIsFinished(true);
              setTimeout(() => scrollToFinish(), 200);
            }, COMPLETION_DELAY);
          }
        }, STEP_CLOSE_DURATION + NEXT_STEP_DELAY);
        break;
    }

    return () => clearTimer();
  }, [isOpen, currentStepIndex, animPhase, isPaused, clearTimer, scrollToStep, scrollToFinish]);

  const handleClose = useCallback(() => {
    clearTimer();
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  }, [onClose, clearTimer]);

  const handleReplay = () => {
    clearTimer();
    setCurrentStepIndex(-1);
    setAnimPhase("idle");
    setCompletedSteps(new Set());
    setIsFinished(false);
    setIsPaused(false);

    // Scroll to top
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });

    timerRef.current = setTimeout(() => {
      setCurrentStepIndex(0);
      setAnimPhase("appearing");
    }, INITIAL_DELAY);
  };

  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false);
      // Re-trigger current phase to continue
      setAnimPhase((prev) => prev);
    } else {
      setIsPaused(true);
      clearTimer();
    }
  };

  // Resume from pause: re-enter the state machine
  useEffect(() => {
    if (!isPaused && isOpen && currentStepIndex >= 0 && animPhase !== "idle") {
      // Force a re-trigger by setting the phase again
      const currentPhase = animPhase;
      setAnimPhase("idle");
      requestAnimationFrame(() => {
        setAnimPhase(currentPhase);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === " ") {
        e.preventDefault();
        handlePauseResume();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, handleClose, isPaused]);

  if (!isOpen && !isClosing) return null;

  const progressPercent =
    ((completedSteps.size + (animPhase === "holding" || animPhase === "opening" ? 0.5 : 0)) /
      FLOW_STEPS.length) *
    100;

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
        className={`relative w-full max-w-4xl max-h-[90vh] bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 flex flex-col ${
          isClosing
            ? "scale-95 opacity-0 translate-y-4"
            : "scale-100 opacity-100 translate-y-0"
        }`}
        style={{
          animation: !isClosing
            ? "modalSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
            : undefined,
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Workflow className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{t("title")}</h2>
                <p className="text-blue-100 text-sm mt-0.5">{t("subtitle")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Pause / Play button */}
              {!isFinished && currentStepIndex >= 0 && (
                <button
                  onClick={handlePauseResume}
                  className="p-2.5 hover:bg-white/20 rounded-xl transition-all duration-200 group"
                  title={isPaused ? "Resume" : "Pause"}
                >
                  {isPaused ? (
                    <Play className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
                  ) : (
                    <Pause className="w-5 h-5 text-white/80 group-hover:text-white transition-colors" />
                  )}
                </button>
              )}
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
              className="h-full bg-white/80 rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.min(progressPercent, 100)}%`,
              }}
            />
          </div>

          {/* Step counter */}
          <div className="mt-2 flex items-center justify-between text-xs text-blue-200">
            <span>
              {currentStepIndex >= 0
                ? `${Math.min(currentStepIndex + 1, FLOW_STEPS.length)} / ${FLOW_STEPS.length}`
                : `0 / ${FLOW_STEPS.length}`}
            </span>
            {isPaused && (
              <span className="flex items-center gap-1 text-amber-200 font-medium animate-pulse">
                {t("paused")}
              </span>
            )}
          </div>
        </div>

        {/* Flow Steps */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-8 space-y-0 scrollbar-hide"
        >
          {FLOW_STEPS.map((step, index) => {
            const isCurrentOrPast = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isExpanded = isCurrent && (animPhase === "opening" || animPhase === "holding");
            const isCompleted = completedSteps.has(index);
            const IconComponent = step.icon;
            const isLast = index === FLOW_STEPS.length - 1;

            // Hide future steps entirely so they don't take up space and make the modal artificially tall
            if (!isCurrentOrPast) {
              return null;
            }

            // When a step is expanded, blur everything else
            const isFocusMode = animPhase === "opening" || animPhase === "holding";
            const isBlurred = isFocusMode && !isCurrent;

            return (
              <div
                key={step.id}
                ref={(el) => { stepRefs.current[index] = el; }}
                className={`transition-all duration-500 ease-out ${
                  isBlurred ? "blur-[2px] opacity-30 scale-[0.97]" : "blur-0 opacity-100 scale-100"
                }`}
              >
                {/* Step Card */}
                <div className="animate-step-in">
                  <div
                    className={`relative flex items-start gap-5 p-5 rounded-2xl border-2
                      transition-all duration-500 ease-out
                      ${
                        isCurrent && !isCompleted
                          ? `${step.bgColor} ${step.borderColor} shadow-xl ${step.glowColor} scale-[1.02]`
                          : isCompleted
                          ? "bg-white border-slate-200 opacity-60 scale-[0.98]"
                          : "bg-white border-slate-200"
                      }
                    `}
                  >
                    {/* Step Number + Icon */}
                    <div className="flex-shrink-0 relative">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500
                          ${
                            isCurrent && !isCompleted
                              ? `${step.bgColor} shadow-md`
                              : isCompleted
                              ? "bg-green-100"
                              : "bg-slate-100"
                          }
                        `}
                      >
                        {isCompleted ? (
                          <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <IconComponent
                            className={`w-7 h-7 transition-all duration-300 ${
                              isCurrent ? step.color : "text-slate-400"
                            }`}
                          />
                        )}
                      </div>
                      {/* Step number badge */}
                      <div
                        className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                          transition-all duration-300
                          ${
                            isCurrent && !isCompleted
                              ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md scale-110"
                              : isCompleted
                              ? "bg-green-500 text-white"
                              : "bg-slate-200 text-slate-600"
                          }
                        `}
                      >
                        {isCompleted ? "✓" : index + 1}
                      </div>

                      {/* Pulse animation when current */}
                      {isCurrent && !isCompleted && (
                        <div
                          className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-blue-400"
                          style={{ animationDuration: "2s" }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`font-bold text-lg transition-colors duration-300 ${
                            isCurrent && !isCompleted
                              ? step.color
                              : isCompleted
                              ? "text-slate-500"
                              : "text-slate-800"
                          }`}
                        >
                          {t(step.titleKey)}
                        </h3>
                        {step.model && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all duration-300 ${
                              isCurrent && !isCompleted
                                ? "bg-white/70 text-slate-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {step.model}
                          </span>
                        )}
                      </div>

                      {/* Description — auto-expands and collapses */}
                      <div
                        className={`overflow-hidden transition-all ease-out ${
                          isExpanded
                            ? "max-h-40 opacity-100 mt-2 duration-600"
                            : "max-h-0 opacity-0 mt-0 duration-400"
                        }`}
                      >
                        <p className="text-[15px] text-slate-700 leading-relaxed">
                          {t(step.descKey)}
                        </p>
                      </div>
                    </div>

                    {/* Active typing indicator */}
                    {isCurrent && isExpanded && (
                      <div className="flex-shrink-0 mt-2">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Connector Arrow */}
                {!isLast && (
                  <div
                    className={`flex justify-center py-2 transition-all duration-500 ${
                      isCurrentOrPast ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-0.5 h-5 rounded-full transition-all duration-500 ${
                          isCompleted
                            ? "bg-gradient-to-b from-green-300 to-green-200"
                            : "bg-gradient-to-b from-slate-300 to-slate-200"
                        }`}
                      />
                      <ArrowRight
                        className={`w-4 h-4 rotate-90 transition-colors duration-500 ${
                          isCompleted ? "text-green-300" : "text-slate-300"
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Final success message */}
          {isFinished && (
            <div
              ref={finishRef}
              className="mt-8 text-center animate-step-in"
            >
            <div className="inline-flex flex-col items-center gap-3 px-8 py-6 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-2 border-green-200 rounded-3xl shadow-lg shadow-green-100/50">
              <div className="relative">
                <CircleCheckBig className="w-8 h-8 text-green-600" />
              </div>
              <span className="font-bold text-xl text-green-700">{t("complete")}</span>
              <span className="text-sm text-green-600/80">{t("subtitle")}</span>
            </div>
            </div>
          )}

          {/* Extra bottom padding so last items can scroll into view */}
          <div className="h-32" />
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
