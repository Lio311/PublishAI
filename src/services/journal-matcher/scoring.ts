import { normalizeJournalName } from "./openalex";
import type { JournalCandidate, JournalEvaluation, MatchPreferences } from "./types";

/**
 * Deterministic, explainable scoring. The LLM agents judge fit; these functions
 * combine their judgement with hard evidence from the literature so that a single
 * optimistic model answer cannot dominate the ranking.
 */

/** Below this h-index a journal has too little track record to recommend. */
export const MIN_H_INDEX = 15;

const OUTLOOK_SCORE: Record<JournalEvaluation["acceptanceOutlook"], number> = {
  low: 25,
  moderate: 50,
  good: 75,
  high: 95,
};

export function clamp(value: number, min = 0, max = 100): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Hard constraints from the user's preferences and a basic quality gate.
 * Returns a reason string when the candidate must be excluded.
 */
export function exclusionReason(candidate: JournalCandidate, prefs: MatchPreferences): string | null {
  const m = candidate.metrics;
  if (prefs.excludeJournalNames?.some((name) => normalizeJournalName(name) === normalizeJournalName(m.name))) {
    return "excluded by request";
  }
  if ((m.hIndex ?? 0) < MIN_H_INDEX) return "insufficient track record";
  if (prefs.openAccessOnly && !m.isOpenAccess) return "not open access";
  if (prefs.maxApcUsd != null && m.apcUsd != null && m.apcUsd > prefs.maxApcUsd) return "APC above budget";
  if (candidate.evaluation && !candidate.evaluation.isReputable) return "flagged as not reputable";
  return null;
}

/**
 * Literature evidence (0-100): how strongly the journal publishes this topic.
 * Half absolute volume, half topical concentration so that mega-journals do not
 * win purely by size and focused specialty journals get credit.
 */
export function evidenceScores(candidates: JournalCandidate[]): Map<string, number> {
  const concentration = (c: JournalCandidate) =>
    c.metrics.worksCount > 0 ? (1000 * c.similarArticleCount) / c.metrics.worksCount : 0;

  const maxCount = Math.max(1, ...candidates.map((c) => c.similarArticleCount));
  const maxConcentration = Math.max(1e-6, ...candidates.map(concentration));

  const scores = new Map<string, number>();
  for (const c of candidates) {
    const volume = Math.log1p(c.similarArticleCount) / Math.log1p(maxCount);
    const focus = Math.log1p(concentration(c)) / Math.log1p(maxConcentration);
    scores.set(c.id, clamp(100 * (0.5 * volume + 0.5 * focus)));
  }
  return scores;
}

/** Relative impact (0-100) among the candidates, from 2-year mean citedness. */
export function impactScores(candidates: JournalCandidate[]): Map<string, number> {
  const maxCitedness = Math.max(1e-6, ...candidates.map((c) => c.metrics.citedness2yr ?? 0));
  const scores = new Map<string, number>();
  for (const c of candidates) {
    const citedness = c.metrics.citedness2yr ?? 0;
    scores.set(c.id, clamp((100 * Math.log1p(citedness)) / Math.log1p(maxCitedness)));
  }
  return scores;
}

/** Composite score (0-100) for an evaluated candidate. */
export function compositeScore(
  evaluation: JournalEvaluation,
  evidence: number,
  impact: number,
  priority: MatchPreferences["priority"]
): number {
  const scope = clamp(evaluation.scopeFit);
  const level = clamp(evaluation.levelFit);
  const outlook = OUTLOOK_SCORE[evaluation.acceptanceOutlook] ?? 50;

  const priorityComponent =
    priority === "impact" ? 0.6 * impact + 0.4 * outlook : priority === "speed" ? outlook : 0.5 * outlook + 0.5 * impact;

  return Math.round(0.4 * scope + 0.25 * level + 0.15 * evidence + 0.2 * priorityComponent);
}

/**
 * Chooses which candidates are worth a full (paid) agent evaluation: the strongest
 * by literature evidence, plus editor-proposed journals the search may have missed.
 */
export function selectForEvaluation(
  candidates: JournalCandidate[],
  prefs: MatchPreferences,
  limit = 10
): JournalCandidate[] {
  const eligible = candidates.filter((c) => exclusionReason(c, prefs) === null);
  const evidence = evidenceScores(eligible);
  const byEvidence = [...eligible].sort((a, b) => (evidence.get(b.id) ?? 0) - (evidence.get(a.id) ?? 0));

  const editorPicks = byEvidence.filter((c) => c.sources.includes("editor")).slice(0, Math.ceil(limit / 2));
  const selected = new Map(editorPicks.map((c) => [c.id, c]));
  for (const c of byEvidence) {
    if (selected.size >= limit) break;
    selected.set(c.id, c);
  }
  return Array.from(selected.values());
}
