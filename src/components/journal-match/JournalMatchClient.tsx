"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  ClipboardType,
  ExternalLink,
  FileText,
  Loader2,
  RotateCcw,
  Search,
  Sparkles,
  Target,
  UploadCloud,
  Users,
  X,
} from "lucide-react";
import { Link } from "@/app/i18n/routing";
import type {
  JournalMatchResult,
  JournalRecommendation,
  MatchPriority,
  MatchProgressEvent,
  MatchStage,
} from "@/services/journal-matcher/types";

const AGENT_STAGES: { stage: MatchStage; icon: typeof Search }[] = [
  { stage: "profiling", icon: FileText },
  { stage: "searching", icon: Search },
  { stage: "evaluating", icon: Users },
  { stage: "ranking", icon: Target },
];

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt", ".md"];

type Phase = "input" | "running" | "done";

export default function JournalMatchClient() {
  const t = useTranslations("JournalMatch");
  const locale = useLocale();

  const [phase, setPhase] = useState<Phase>("input");
  const [inputMode, setInputMode] = useState<"upload" | "paste">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [priority, setPriority] = useState<MatchPriority>("balanced");
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [maxApc, setMaxApc] = useState("");

  const [currentStage, setCurrentStage] = useState<MatchStage | null>(null);
  const [evaluatingCount, setEvaluatingCount] = useState<number | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [result, setResult] = useState<JournalMatchResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const canSubmit = inputMode === "upload" ? Boolean(file) : pastedText.trim().length > 0;

  const pickFile = useCallback((candidate: File | undefined) => {
    if (!candidate) return;
    const lower = candidate.name.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
      setErrorCode("UNSUPPORTED_TYPE");
      return;
    }
    setErrorCode(null);
    setFile(candidate);
  }, []);

  const handleEvent = useCallback((event: MatchProgressEvent) => {
    if (event.type === "stage") {
      setCurrentStage(event.stage);
      if (event.stage === "evaluating" && event.detail) setEvaluatingCount(Number(event.detail));
    } else if (event.type === "result") {
      setResult(event.result);
      setPhase("done");
    } else {
      setErrorCode(event.code ?? "generic");
      setPhase("input");
    }
  }, []);

  const runMatch = useCallback(async () => {
    if (!canSubmit) return;
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase("running");
    setErrorCode(null);
    setResult(null);
    setCurrentStage(null);
    setEvaluatingCount(null);

    const body = new FormData();
    if (inputMode === "upload" && file) body.append("file", file);
    else body.append("text", pastedText);
    body.append("priority", priority);
    body.append("openAccessOnly", String(openAccessOnly));
    if (maxApc.trim()) body.append("maxApcUsd", maxApc.trim());
    body.append("locale", locale);

    try {
      const res = await fetch("/api/journal-match", { method: "POST", body, signal: controller.signal });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        const code =
          res.status === 429 ? "RATE_LIMITED" : res.status === 401 ? "UNAUTHORIZED" : (data?.code as string | undefined);
        setErrorCode(code ?? "generic");
        setPhase("input");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finished = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as MatchProgressEvent;
          if (event.type !== "stage") finished = true;
          handleEvent(event);
        }
      }
      if (!finished) {
        setErrorCode("generic");
        setPhase("input");
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        setPhase("input");
        return;
      }
      console.error("[JournalMatch] Request failed:", error);
      setErrorCode("generic");
      setPhase("input");
    } finally {
      abortRef.current = null;
    }
  }, [canSubmit, inputMode, file, pastedText, priority, openAccessOnly, maxApc, locale, handleEvent]);

  const reset = () => {
    setPhase("input");
    setResult(null);
    setFile(null);
    setPastedText("");
    setErrorCode(null);
  };

  const errorMessage = errorCode
    ? t.has(`errors.${errorCode}`)
      ? t(`errors.${errorCode}`)
      : t("errors.generic")
    : null;

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-sky-50 text-sky-600 p-2.5 rounded-xl border border-sky-100">
            <Target className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{t("title")}</h1>
        </div>
        <p className="text-slate-600 text-sm leading-relaxed max-w-3xl">{t("subtitle")}</p>
      </header>

      {errorMessage && (
        <div role="alert" className="flex items-start gap-3 p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      {phase === "input" && (
        <section className="bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          {/* Input mode switch */}
          <div role="tablist" className="inline-flex p-1 bg-slate-100 rounded-xl">
            {(["upload", "paste"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={inputMode === mode}
                onClick={() => setInputMode(mode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  inputMode === mode ? "bg-white text-sky-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {mode === "upload" ? <UploadCloud className="w-4 h-4" aria-hidden="true" /> : <ClipboardType className="w-4 h-4" aria-hidden="true" />}
                {mode === "upload" ? t("input.uploadTab") : t("input.pasteTab")}
              </button>
            ))}
          </div>

          {inputMode === "upload" ? (
            file ? (
              <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-sky-200 bg-sky-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-8 h-8 text-sky-500 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  aria-label={t("input.removeFile")}
                  className="p-2 rounded-lg text-slate-500 hover:bg-white hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <div
                role="button"
                tabIndex={0}
                aria-label={t("input.dropTitle")}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  pickFile(e.dataTransfer.files?.[0]);
                }}
                className={`border-2 border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 ${
                  isDragging ? "border-sky-500 bg-sky-50/50" : "border-slate-300/60 bg-white/40 hover:bg-white/70 hover:border-sky-400/60"
                }`}
              >
                <div className="p-4 rounded-full mb-3 bg-sky-100">
                  <UploadCloud className="w-8 h-8 text-sky-500" aria-hidden="true" />
                </div>
                <p className="text-lg font-bold text-slate-800">{t("input.dropTitle")}</p>
                <p className="text-sm text-slate-500 mt-1">{t("input.dropHint")}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_EXTENSIONS.join(",")}
                  className="hidden"
                  onChange={(e) => {
                    pickFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </div>
            )
          ) : (
            <div>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder={t("input.pastePlaceholder")}
                rows={10}
                dir="auto"
                className="w-full rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <p className="text-xs text-slate-400 mt-1">{t("input.chars", { count: pastedText.length })}</p>
            </div>
          )}

          {/* Preferences */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-bold text-slate-800 mb-3">{t("prefs.title")}</legend>
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">{t("prefs.priority")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["balanced", "impact", "speed"] as const).map((option) => (
                  <label
                    key={option}
                    className={`flex flex-col gap-0.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                      priority === option ? "border-sky-400 bg-sky-50 ring-1 ring-sky-300" : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={option}
                      checked={priority === option}
                      onChange={() => setPriority(option)}
                      className="sr-only"
                    />
                    <span className="text-sm font-semibold text-slate-800">{t(`prefs.${option}`)}</span>
                    <span className="text-xs text-slate-500">{t(`prefs.${option}Hint`)}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={openAccessOnly}
                  onChange={(e) => setOpenAccessOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                {t("prefs.openAccessOnly")}
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                <span>{t("prefs.maxApc")}</span>
                <input
                  type="number"
                  min={0}
                  step={100}
                  inputMode="numeric"
                  value={maxApc}
                  onChange={(e) => setMaxApc(e.target.value)}
                  placeholder={t("prefs.maxApcPlaceholder")}
                  className="w-32 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </label>
            </div>
          </fieldset>

          <button
            type="button"
            onClick={runMatch}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 via-sky-500 to-sky-400 hover:from-sky-600 hover:via-sky-600 hover:to-sky-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            {t("submit")}
          </button>
        </section>
      )}

      {phase === "running" && (
        <section
          aria-live="polite"
          aria-busy="true"
          className="bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-xs"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Loader2 className="w-5 h-5 text-sky-500 animate-spin" aria-hidden="true" />
              {t("running")}
            </h2>
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="text-sm text-slate-500 hover:text-rose-600 px-3 py-1.5 rounded-lg hover:bg-rose-50"
            >
              {t("cancel")}
            </button>
          </div>
          <ol className="space-y-3">
            {AGENT_STAGES.map(({ stage, icon: Icon }, index) => {
              const activeIndex = currentStage ? AGENT_STAGES.findIndex((s) => s.stage === currentStage) : -1;
              const state = index < activeIndex ? "done" : index === activeIndex ? "active" : "pending";
              const label =
                stage === "evaluating" && evaluatingCount
                  ? t("stages.evaluatingCount", { count: evaluatingCount })
                  : t(`stages.${stage}`);
              return (
                <li
                  key={stage}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    state === "active"
                      ? "border-sky-200 bg-sky-50/70"
                      : state === "done"
                        ? "border-emerald-100 bg-emerald-50/40"
                        : "border-slate-100 bg-slate-50/40"
                  }`}
                >
                  <span className="shrink-0">
                    {state === "done" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" aria-hidden="true" />
                    ) : state === "active" ? (
                      <Loader2 className="w-5 h-5 text-sky-500 animate-spin" aria-hidden="true" />
                    ) : (
                      <Icon className="w-5 h-5 text-slate-300" aria-hidden="true" />
                    )}
                  </span>
                  <span className={`text-sm ${state === "pending" ? "text-slate-400" : "text-slate-800 font-medium"}`}>{label}</span>
                </li>
              );
            })}
          </ol>
          <p className="text-xs text-slate-400 mt-4">{t("durationHint")}</p>
        </section>
      )}

      {phase === "done" && result && <MatchResults result={result} onReset={reset} />}
    </div>
  );
}

function MatchResults({ result, onReset }: { result: JournalMatchResult; onReset: () => void }) {
  const t = useTranslations("JournalMatch");
  const { profile } = result;

  return (
    <div className="space-y-6">
      <section className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <h2 className="text-lg font-bold text-slate-900">{t("profile.title")}</h2>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 px-3 py-1.5 rounded-lg"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            {t("newSearch")}
          </button>
        </div>
        <p className="font-semibold text-slate-800 mb-2" dir="auto">{profile.title}</p>
        <p className="text-sm text-slate-600 leading-relaxed mb-4" dir="auto">{profile.summary}</p>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <ProfileItem label={t("profile.field")} value={`${profile.field} · ${profile.subfield}`} />
          <ProfileItem label={t("profile.articleType")} value={profile.articleType} />
          <ProfileItem label={t("profile.novelty")} value={t(`profile.noveltyLevels.${profile.noveltyLevel}`)} />
          <ProfileItem label={t("profile.rigor")} value={t(`profile.rigorLevels.${profile.methodologicalRigor}`)} />
        </dl>
        <div className="mt-4 flex flex-wrap gap-1.5" aria-label={t("profile.keywords")}>
          {profile.keywords.map((keyword) => (
            <span key={keyword} className="px-2.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 border border-slate-200" dir="auto">
              {keyword}
            </span>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
          <h2 className="text-xl font-bold text-slate-900">{t("results.title")}</h2>
          <span className="text-xs text-slate-500">{t("results.considered", { count: result.candidatesConsidered })}</span>
        </div>
        {result.overview && <p className="text-sm text-slate-700 leading-relaxed mb-4">{result.overview}</p>}
        <ol className="space-y-5">
          {result.recommendations.map((rec) => (
            <RecommendationCard key={rec.candidate.id} rec={rec} />
          ))}
        </ol>
      </section>

      <p className="text-xs text-slate-400 leading-relaxed">{t("results.disclaimer")}</p>
    </div>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800 mt-0.5" dir="auto">{value}</dd>
    </div>
  );
}

const STRATEGY_STYLES: Record<JournalRecommendation["strategy"], string> = {
  ambitious: "bg-violet-50 text-violet-700 border-violet-200",
  target: "bg-sky-50 text-sky-700 border-sky-200",
  safe: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function RecommendationCard({ rec }: { rec: JournalRecommendation }) {
  const t = useTranslations("JournalMatch.results");
  const { candidate } = rec;
  const m = candidate.metrics;
  const evaluation = candidate.evaluation;

  return (
    <li className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white text-xl font-bold shrink-0" aria-label={t("rank", { rank: rec.rank })}>
          {rec.rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-slate-900" dir="ltr">{m.name}</h3>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${STRATEGY_STYLES[rec.strategy]}`}>
              {t(`strategies.${rec.strategy}`)}
            </span>
          </div>
          {m.publisher && <p className="text-xs text-slate-500" dir="ltr">{m.publisher}</p>}
          <div className="flex flex-wrap gap-3 mt-2 text-xs">
            {m.homepageUrl && (
              <a href={m.homepageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 font-medium">
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                {t("website")}
              </a>
            )}
            {candidate.internalJournalId && (
              <Link href="/journals" className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium">
                <BookOpenCheck className="w-3.5 h-3.5" aria-hidden="true" />
                {t("rulesAvailable")}
              </Link>
            )}
            {candidate.sources.includes("editor") && candidate.sources.includes("literature") && (
              <span className="inline-flex items-center gap-1 text-slate-500">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                {t("editorPick")}
              </span>
            )}
          </div>
        </div>
        <div className="sm:text-end shrink-0">
          <p className="text-xs text-slate-500">{t("score")}</p>
          <p className="text-2xl font-bold text-slate-900">{rec.score}<span className="text-sm text-slate-400">/100</span></p>
          <div className="w-28 h-1.5 rounded-full bg-slate-100 mt-1 overflow-hidden sm:ms-auto">
            <div className="h-full bg-sky-500 rounded-full" style={{ width: `${rec.score}%` }} />
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Metric label={t("impact")} value={m.citedness2yr?.toFixed(1) ?? "—"} />
          <Metric label={t("hIndex")} value={m.hIndex?.toString() ?? "—"} />
          <Metric
            label={m.isOpenAccess ? t("openAccess") : t("subscription")}
            value={m.apcUsd != null ? `${t("apc")}: $${m.apcUsd.toLocaleString()}` : "—"}
          />
          <Metric label={t("similar")} value={candidate.similarArticleCount.toLocaleString()} />
        </dl>

        {evaluation && (
          <div className="flex flex-wrap gap-2 text-xs">
            <Pill label={t("scopeFit")} value={`${Math.round(evaluation.scopeFit)}`} />
            <Pill label={t("levelFit")} value={`${Math.round(evaluation.levelFit)}`} />
            <Pill label={t("outlook")} value={t(`outlooks.${evaluation.acceptanceOutlook}`)} />
          </div>
        )}

        <div>
          <h4 className="text-sm font-bold text-slate-800 mb-1.5">{t("why")}</h4>
          <p className="text-sm text-slate-700 leading-relaxed">{rec.rationale}</p>
        </div>

        {evaluation && (evaluation.strengths.length > 0 || evaluation.concerns.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BulletList title={t("strengths")} items={evaluation.strengths} tone="positive" />
            <BulletList title={t("concerns")} items={evaluation.concerns} tone="warning" />
          </div>
        )}

        {rec.preparationTips.length > 0 && <BulletList title={t("tips")} items={rec.preparationTips} tone="neutral" />}

        {candidate.exampleWorks.length > 0 && (
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-1.5">{t("examples")}</h4>
            <ul className="space-y-1">
              {candidate.exampleWorks.map((work) => (
                <li key={work.title} className="text-xs text-slate-600" dir="ltr">
                  {work.doi ? (
                    <a href={work.doi} target="_blank" rel="noopener noreferrer" className="hover:text-sky-600 hover:underline">
                      {work.title}
                    </a>
                  ) : (
                    work.title
                  )}
                  {work.year && <span className="text-slate-400"> ({work.year})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </li>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="font-semibold text-slate-800 mt-0.5">{value}</dd>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600">
      {label}: <span className="font-semibold text-slate-800">{value}</span>
    </span>
  );
}

function BulletList({ title, items, tone }: { title: string; items: string[]; tone: "positive" | "warning" | "neutral" }) {
  if (items.length === 0) return null;
  const dot = tone === "positive" ? "bg-emerald-500" : tone === "warning" ? "bg-amber-500" : "bg-sky-500";
  return (
    <div>
      <h4 className="text-sm font-bold text-slate-800 mb-1.5">{title}</h4>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
            <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${dot}`} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
