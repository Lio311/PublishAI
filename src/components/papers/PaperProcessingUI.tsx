"use client";

import { useTranslations } from "next-intl";
import { SubmissionPanel } from "../submission/SubmissionPanel";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

import { 
  Upload, MessageSquareText, ClipboardList, BookOpen, Microscope, 
  PenTool, Play, ShieldCheck, FileCheck, Package, Download, Loader2, CheckCircle,
  AlertCircle
} from "lucide-react";

export type FlowStep = {
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

export const FLOW_STEPS: FlowStep[] = [
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

export interface PaperProcessingUIProps {
  paperId: number;
  initialStatus?: string;
  submissionId?: number;
}

export function PaperProcessingUI({ 
  paperId, 
  initialStatus = "preparing",
  submissionId: initialSubmissionId
}: PaperProcessingUIProps) {
  const t = useTranslations("SystemFlow");
  const isInitialFinished = initialStatus === "completed" || initialStatus === "approved" || initialStatus === "submitted";

  const [currentStepIndex, setCurrentStepIndex] = useState(isInitialFinished ? FLOW_STEPS.length - 1 : 1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(
    () => new Set(isInitialFinished ? FLOW_STEPS.map((_, i) => i) : [0])
  );
  const [isFinished, setIsFinished] = useState(isInitialFinished);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Captcha state
  const [requiresCaptcha, setRequiresCaptcha] = useState(initialStatus === "requires_captcha");
  const [captchaInput, setCaptchaInput] = useState("");
  const [submittingCaptcha, setSubmittingCaptcha] = useState(false);
  const [captchaError, setCaptchaError] = useState<string | null>(null);

  // Submission action state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(initialStatus === "submitted" || initialStatus === "approved");
  const [pollError, setPollError] = useState<string | null>(null);
  const [resolvedSubmissionId, setResolvedSubmissionId] = useState<number | null>(initialSubmissionId ?? null);

  // Auto-scroll current step into view (separated from polling to fix hook dependency churn)
  useEffect(() => {
    if (isFinished || requiresCaptcha) return;

    const currentEl = stepRefs.current[currentStepIndex];
    if (currentEl) {
      currentEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentStepIndex, isFinished, requiresCaptcha]);

  // Status Polling Effect with AbortController and unmount safety
  useEffect(() => {
    if (isFinished || requiresCaptcha) return;

    let isMounted = true;
    const controller = new AbortController();

    const checkStatus = async () => {
      try {
        const targetId = resolvedSubmissionId ?? initialSubmissionId ?? paperId;
        if (!targetId || targetId <= 0) return;

        const res = await fetch(`/api/submissions/${targetId}/status`, {
          signal: controller.signal,
        });

        if (!isMounted) return;

        if (res.ok) {
          setPollError(null);
          const data = await res.json();
          
          if (data.status === "requires_captcha" || data.summary?.currentStatus === "requires_captcha") {
            setRequiresCaptcha(true);
            return;
          }

          if (data.status === "completed" || data.status === "approved" || data.status === "submitted") {
            setIsFinished(true);
            setCurrentStepIndex(FLOW_STEPS.length - 1);
            setCompletedSteps(new Set(FLOW_STEPS.map((_, i) => i)));
            return;
          }

          if (data.status === "failed") {
            setPollError(data.error || "Submission processing failed. Please check status or try again.");
            return;
          }

          // Advance step index according to stage if provided
          if (data.summary?.currentStage) {
            const stageMap: Record<string, number> = {
              initial_qc: 1,
              associate_editor_assigned: 2,
              inviting_reviewers: 3,
              peer_review_active: 4,
              evaluating_reviews: 7,
              awaiting_eic_decision: 8,
              final_publication: 10,
            };
            const mappedStep = stageMap[data.summary.currentStage];
            if (mappedStep !== undefined) {
              setCurrentStepIndex((prev) => Math.max(prev, mappedStep));
              setCompletedSteps((prev) => {
                const next = new Set(prev);
                for (let i = 0; i < mappedStep; i++) next.add(i);
                return next;
              });
            }
          }
        } else if (res.status === 404 && !resolvedSubmissionId) {
          // If polling by paperId returned 404, look up real submission linked to this paper
          try {
            const subRes = await fetch("/api/submissions", { signal: controller.signal });
            if (subRes.ok && isMounted) {
              const subData = await subRes.json();
              const list = Array.isArray(subData) ? subData : subData?.submissions || [];
              const match = list.find((s: any) => s.paperId === paperId);
              if (match?.id) {
                setResolvedSubmissionId(match.id);
              }
            }
          } catch {
            // ignore lookup error
          }
        } else {
          console.warn(`[PaperProcessingUI] Status polling returned HTTP ${res.status}`);
        }
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        if (isMounted) {
          console.error("[PaperProcessingUI] Polling error:", err);
        }
      }
    };

    const interval = setInterval(checkStatus, 3000);
    checkStatus();

    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(interval);
    };
  }, [isFinished, requiresCaptcha, paperId, initialSubmissionId, resolvedSubmissionId]);

  const handleCaptchaSubmit = async () => {
    const targetSubmissionId = resolvedSubmissionId ?? initialSubmissionId ?? paperId;
    if (!targetSubmissionId || targetSubmissionId <= 0) {
      const msg = "Invalid submission ID for captcha.";
      setCaptchaError(msg);
      toast.error(msg);
      return;
    }

    try {
      setSubmittingCaptcha(true);
      setCaptchaError(null);
      const res = await fetch(`/api/submissions/captcha`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ submissionId: String(targetSubmissionId), solution: captchaInput.trim() }),
      });

      if (res.ok) {
        setRequiresCaptcha(false);
        setCaptchaInput("");
        toast.success("Captcha submitted successfully.");
      } else {
        const errorData = await res.json().catch(() => ({}));
        const msg = errorData.error || "Failed to submit captcha";
        setCaptchaError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Failed to submit captcha";
      setCaptchaError(msg);
      toast.error(msg);
      console.error(err);
    } finally {
      setSubmittingCaptcha(false);
    }
  };

  const handleApproveAndSubmit = async () => {
    const targetSubmissionId = resolvedSubmissionId ?? initialSubmissionId ?? paperId;
    if (!targetSubmissionId || targetSubmissionId <= 0) {
      const msg = "Valid submission ID is required to initiate autonomous submission.";
      setSubmitError(msg);
      toast.error(msg);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/submissions/${targetSubmissionId}/submit`, {
        method: "POST",
      });

      if (res.ok) {
        setIsApproved(true);
        toast.success("RPA Autonomous Submission initiated successfully!");
      } else {
        const data = await res.json().catch(() => ({}));
        const msg = data.error || `Failed to initiate submission (HTTP ${res.status})`;
        setSubmitError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "Network error during submission";
      setSubmitError(msg);
      toast.error(msg);
      console.error("Submission failed:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-8 border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] relative overflow-hidden">
      {/* Screen Reader Live Announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isFinished 
          ? t("processComplete") 
          : requiresCaptcha 
            ? "Captcha verification required" 
            : `Step ${currentStepIndex + 1} of ${FLOW_STEPS.length}: ${t(FLOW_STEPS[currentStepIndex]?.titleKey || "")}`}
      </div>

      {/* Captcha Modal Dialog with Full A11y and Keyboard Support */}
      {requiresCaptcha && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-labelledby="captcha-dialog-title"
          aria-describedby="captcha-dialog-desc"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
        >
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 id="captcha-dialog-title" className="text-xl font-bold text-slate-800 mb-2">Solve Captcha</h3>
            <p id="captcha-dialog-desc" className="text-slate-600 mb-6 text-sm">
              A captcha is required by the journal platform to continue the autonomous submission process.
            </p>
            
            {captchaError && (
              <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" aria-hidden="true" />
                <span>{captchaError}</span>
              </div>
            )}

            <label htmlFor="captcha-solution-input" className="block text-sm font-semibold text-slate-700 mb-2">
              Captcha Solution
            </label>
            <input 
              id="captcha-solution-input"
              type="text" 
              value={captchaInput}
              onChange={(e) => {
                setCaptchaInput(e.target.value);
                if (captchaError) setCaptchaError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !submittingCaptcha && captchaInput.trim()) {
                  handleCaptchaSubmit();
                }
              }}
              disabled={submittingCaptcha}
              className="w-full border border-slate-300 rounded-lg px-4 py-2 mb-6 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter captcha text..."
              autoFocus
            />
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setRequiresCaptcha(false)}
                disabled={submittingCaptcha}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleCaptchaSubmit}
                disabled={submittingCaptcha || !captchaInput.trim()}
                aria-busy={submittingCaptcha}
                className="flex-1 bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {submittingCaptcha ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  "Submit Captcha"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-50/50 via-transparent to-sky-50/50 pointer-events-none" />
      <h2 className="text-2xl font-bold mb-8 text-slate-800">{t("workingProcess")}</h2>
      
      {/* Polling Error Notification */}
      {pollError && (
        <div role="alert" className="mb-6 p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="flex-1 text-sm">
            <p className="font-semibold">Notice regarding processing status</p>
            <p className="text-amber-700 mt-1">{pollError}</p>
          </div>
        </div>
      )}

      <div 
        role="list"
        aria-label={t("workingProcess")}
        className="flex flex-col gap-6 relative before:absolute before:inset-0 before:ml-[2.25rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent"
      >
        {FLOW_STEPS.map((step, index) => {
          const isCurrent = index === currentStepIndex;
          const isCompleted = completedSteps.has(index);
          const isFuture = index > currentStepIndex;
          const Icon = step.icon;

          if (isFuture) return null;

          return (
            <div 
              key={step.id} 
              role="listitem"
              aria-current={isCurrent ? "step" : undefined}
              ref={(el) => { stepRefs.current[index] = el; }}
              className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white z-10 
                  shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2
                  border-slate-300">
                <span className="sr-only">
                  {isCompleted ? "Completed step: " : isCurrent ? "Current active step: " : "Pending step: "}
                </span>
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-500" aria-hidden="true" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 text-sky-500 animate-spin" aria-hidden="true" />
                ) : (
                  <Icon className="w-5 h-5 text-slate-400" aria-hidden="true" />
                )}
              </div>
              
              <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl border transition-all duration-500 relative overflow-hidden backdrop-blur-md
                ${isCurrent 
                  ? 'bg-sky-50/80 border-blue-300 shadow-[0_8px_24px_rgba(59,130,246,0.12)] scale-[1.02]' 
                  : 'bg-white/40 border-white/60 hover:bg-white/60 shadow-[0_2px_12px_rgba(0,0,0,0.02)]'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${step.bgColor}`}>
                    <Icon className={`w-5 h-5 ${isCurrent ? step.color : 'text-slate-500'}`} aria-hidden="true" />
                  </div>
                  <h3 className={`font-bold text-lg ${isCurrent ? 'text-sky-800' : 'text-slate-700'}`}>
                    {t(step.titleKey)}
                  </h3>
                </div>
                
                <p className="text-slate-600 leading-relaxed">
                  {t(step.descKey)}
                </p>

                {isCurrent && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-sky-500 bg-sky-100/50 p-2 rounded-lg" aria-live="polite">
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
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
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-5 drop-shadow-sm" aria-hidden="true" />
          <h3 className="text-2xl font-bold text-green-800 mb-3">{t("processComplete")}</h3>
          <p className="text-green-700/90 mb-6">{t("processCompleteDesc")}</p>
          
          {submitError && (
            <div role="alert" className="mb-4 max-w-md mx-auto p-3 bg-red-100 text-red-800 rounded-lg text-sm flex items-center gap-2 justify-center">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleApproveAndSubmit}
            disabled={isSubmitting || isApproved}
            aria-busy={isSubmitting}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-sky-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:pointer-events-none inline-flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                <span>Initiating Submission...</span>
              </>
            ) : isApproved ? (
              <>
                <CheckCircle className="w-5 h-5 text-white" aria-hidden="true" />
                <span>Submission Initiated</span>
              </>
            ) : (
              "Approve & Submit"
            )}
          </button>
        </div>
      )}

      {isFinished && (
        <div className="mt-8">
          <ErrorBoundary name="Submission Panel">
            <SubmissionPanel paperId={paperId} />
          </ErrorBoundary>
        </div>
      )}
    </div>
  );
}

export default PaperProcessingUI;
