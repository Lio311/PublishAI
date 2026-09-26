"use client";

import { useTranslations, useLocale } from "next-intl";
import { CheckCircle2, Circle, Clock } from "lucide-react";

type Stage = {
  id: string;
  labelEn: string;
  labelHe: string;
};

const STAGES: Stage[] = [
  { id: "draft", labelEn: "Draft", labelHe: "טיוטה" },
  { id: "submitted", labelEn: "Submitted", labelHe: "הוגש" },
  { id: "with_editor", labelEn: "With Editor", labelHe: "אצל העורך" },
  { id: "under_review", labelEn: "Under Review", labelHe: "בסקירה" },
  { id: "revision_requested", labelEn: "Revisions Required", labelHe: "נדרשים תיקונים" },
  { id: "accepted", labelEn: "Accepted", labelHe: "התקבל" },
  { id: "published", labelEn: "Published", labelHe: "פורסם" }
];

export default function SubmissionProgressBar({ currentStatus }: { currentStatus: string }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const isHe = locale === "he";

  // Quick mapping from submission_status enum to our visual stages
  const getStageIndex = (status: string) => {
    switch (status) {
      case "draft":
      case "preparing": return 0;
      case "submitting":
      case "submitted": return 1;
      case "with_editor": return 2;
      case "under_review": return 3;
      case "reviews_received":
      case "revision_requested": return 4;
      case "revised_submitted": return 3; // loop back to review
      case "accepted":
      case "in_proofs": return 5;
      case "published": return 6;
      case "rejected":
      case "withdrawn":
      case "failed": return -1;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(currentStatus);

  if (currentIndex === -1) {
    return (
      <div role="status" className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
        <span className="font-semibold">{isHe ? "סטטוס הגשה:" : "Status:"}</span>{" "}
        {currentStatus.replace("_", " ").toUpperCase()}
      </div>
    );
  }

  const currentStageLabel = isHe ? STAGES[currentIndex]?.labelHe : STAGES[currentIndex]?.labelEn;

  return (
    <div 
      className="w-full py-6"
      role="region"
      aria-label={isHe ? "מעקב שלבי הגשה" : "Submission progress tracker"}
    >
      <div 
        className="flex items-center justify-between relative"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={STAGES.length}
        aria-valuetext={currentStageLabel}
      >
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full z-0" aria-hidden="true"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-sky-500 rounded-full z-0 transition-all duration-500" 
          style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
          aria-hidden="true"
        ></div>
        
        <ol className="flex items-center justify-between w-full relative z-10 list-none m-0 p-0" aria-label={isHe ? "שלבי התקדמות ההגשה" : "Submission progress stages"}>
          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex;
            const stageLabel = isHe ? stage.labelHe : stage.labelEn;
            const stateText = isCompleted ? (isHe ? "הושלם" : "Completed") : isCurrent ? (isHe ? "נוכחי" : "Current") : (isHe ? "ממתין" : "Pending");
            
            return (
              <li 
                key={stage.id} 
                className="flex flex-col items-center gap-2"
                aria-current={isCurrent ? "step" : undefined}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted 
                      ? 'bg-sky-500 border-sky-500 text-white' 
                      : isCurrent 
                      ? 'bg-white border-sky-500 text-sky-500' 
                      : 'bg-white border-slate-300 text-slate-300'
                  }`}
                  aria-hidden="true"
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : isCurrent ? <Clock className="w-5 h-5 animate-pulse" /> : <Circle className="w-4 h-4" />}
                </div>
                <span className={`text-xs font-medium max-w-[80px] text-center ${isCurrent ? 'text-sky-700 font-bold' : isCompleted ? 'text-slate-700' : 'text-slate-400'}`}>
                  {stageLabel}
                </span>
                <span className="sr-only">({stateText})</span>
              </li>
            );
          })}
        </ol>
      </div>
      
      {currentStatus === "submitted" || currentStatus === "with_editor" ? (
        <div role="note" className="mt-6 p-4 bg-amber-50 text-amber-800 text-sm rounded-xl border border-amber-200">
          <strong>{isHe ? "הערה חשובה:" : (t("note") || "Note:")}</strong>{" "}
          {isHe 
            ? "עיתונים אינם שולחים תמיד דוא\"ל עבור כל שינוי סטטוס, והודעות החלטה עלולות להגיע לתיקיית הספאם. אנא בדוק את תיקיית הספאם מדי פעם." 
            : (t("spam_warning") || "Journals may not send emails for every status change, and decision emails sometimes go to spam. Please check your spam folder if you haven't received an update in a while.")}
        </div>
      ) : null}
    </div>
  );
}
