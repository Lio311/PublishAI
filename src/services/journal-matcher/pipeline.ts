import { db } from "@/services/db";
import { journals } from "@/services/db/schema";
import { evaluateJournalFit, profileManuscript, proposeJournals, rankFinalists } from "./agents";
import {
  findSimilarWorksInJournal,
  findVenuesForQuery,
  getJournalMetrics,
  normalizeJournalName,
  resolveJournalByName,
  type VenueHit,
} from "./openalex";
import { compositeScore, evidenceScores, exclusionReason, impactScores, selectForEvaluation } from "./scoring";
import type {
  FinalRanking,
  JournalCandidate,
  JournalMatchResult,
  JournalMetrics,
  JournalRecommendation,
  ManuscriptProfile,
  MatchPreferences,
  MatchProgressEvent,
} from "./types";

/**
 * Journal matching pipeline:
 *
 *   Profiler agent ──► OpenAlex venue search (per query)  ─┐
 *                 └──► Editor agent proposals ─► verify ───┤
 *                                                          ▼
 *                              candidate pool + quality / preference gate
 *                                                          ▼
 *                     Fit evaluator agents (one per journal, in parallel)
 *                                                          ▼
 *                          composite score ─► Chief editor agent ─► top 3
 */

export class MatchError extends Error {
  constructor(message: string, public code: "LITERATURE_UNAVAILABLE" | "NO_CANDIDATES") {
    super(message);
    this.name = "MatchError";
  }
}

const MAX_VENUES_FOR_METRICS = 30;
const MAX_EVALUATIONS = 10;
const MAX_FINALISTS = 6;
const EVALUATION_CONCURRENCY = 5;

type ProgressFn = (event: MatchProgressEvent) => void;

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      try {
        results[index] = { status: "fulfilled", value: await fn(items[index]) };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

/** Merges venue hits from several queries, keeping each journal's strongest count. */
export function mergeVenueHits(lists: VenueHit[][]): Map<string, VenueHit> {
  const merged = new Map<string, VenueHit>();
  for (const list of lists) {
    for (const hit of list) {
      const existing = merged.get(hit.id);
      if (!existing || hit.count > existing.count) merged.set(hit.id, hit);
    }
  }
  return merged;
}

async function loadInternalJournals(): Promise<Map<string, number>> {
  try {
    const rows = await db.select({ id: journals.id, name: journals.name }).from(journals);
    return new Map(rows.map((r) => [normalizeJournalName(r.name), r.id]));
  } catch (error) {
    console.warn("[JournalMatcher] Could not load internal journals:", error);
    return new Map();
  }
}

async function buildCandidatePool(profile: ManuscriptProfile, prefs: MatchPreferences): Promise<JournalCandidate[]> {
  const queries = profile.searchQueries.filter(Boolean).slice(0, 3);
  const evidenceQuery = queries[1] ?? queries[0] ?? profile.keywords.slice(0, 4).join(" ");

  const [venueResults, proposals, internalJournals] = await Promise.all([
    Promise.allSettled(queries.map((q) => findVenuesForQuery(q))),
    proposeJournals(profile, prefs).catch((error) => {
      console.warn("[JournalMatcher] Editor agent failed, continuing with literature evidence only:", error);
      return { journals: [] };
    }),
    loadInternalJournals(),
  ]);

  const succeeded = venueResults.filter((r): r is PromiseFulfilledResult<VenueHit[]> => r.status === "fulfilled");
  if (succeeded.length === 0) {
    throw new MatchError("The literature database (OpenAlex) is unavailable", "LITERATURE_UNAVAILABLE");
  }

  const venues = mergeVenueHits(succeeded.map((r) => r.value));
  const topVenueIds = [...venues.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_VENUES_FOR_METRICS)
    .map((v) => v.id);

  const [literatureMetrics, resolvedProposals] = await Promise.all([
    getJournalMetrics(topVenueIds),
    Promise.allSettled(proposals.journals.slice(0, 12).map((p) => resolveJournalByName(p.name))),
  ]);

  const pool = new Map<string, JournalCandidate>();
  const addCandidate = (metrics: JournalMetrics, source: "literature" | "editor", note?: string) => {
    const existing = pool.get(metrics.openAlexId);
    if (existing) {
      if (!existing.sources.includes(source)) existing.sources.push(source);
      existing.editorNote ??= note;
      return;
    }
    pool.set(metrics.openAlexId, {
      id: metrics.openAlexId,
      metrics,
      similarArticleCount: venues.get(metrics.openAlexId)?.count ?? 0,
      sources: [source],
      editorNote: note,
      internalJournalId: internalJournals.get(normalizeJournalName(metrics.name)),
      exampleWorks: [],
    });
  };

  literatureMetrics.forEach((m) => addCandidate(m, "literature"));
  resolvedProposals.forEach((result, i) => {
    if (result.status === "fulfilled" && result.value) {
      addCandidate(result.value, "editor", proposals.journals[i].why);
    }
  });

  // Editor-only journals have no venue count yet; measure it with the same evidence query.
  const unmeasured = [...pool.values()].filter((c) => !venues.has(c.id));
  await mapWithConcurrency(unmeasured, EVALUATION_CONCURRENCY, async (c) => {
    const { count, works } = await findSimilarWorksInJournal(c.id, evidenceQuery);
    c.similarArticleCount = count;
    c.exampleWorks = works;
  });

  return [...pool.values()];
}

function fallbackRanking(finalists: JournalCandidate[]): FinalRanking {
  const strategies = ["target", "target", "safe"] as const;
  return {
    overview: "",
    recommendations: finalists.slice(0, 3).map((c, i) => ({
      candidateId: c.id,
      rank: i + 1,
      strategy: strategies[i],
      rationale: c.evaluation?.strengths.join(" ") ?? "",
      preparationTips: c.evaluation?.concerns ?? [],
    })),
  };
}

/** Accepts the chief editor's answer only if it names exactly three distinct finalists. */
export function validateRanking(ranking: FinalRanking, finalists: JournalCandidate[]): boolean {
  const ids = new Set(finalists.map((c) => c.id));
  const chosen = ranking.recommendations.map((r) => r.candidateId);
  return chosen.length === 3 && new Set(chosen).size === 3 && chosen.every((id) => ids.has(id));
}

export async function matchJournals(
  manuscriptText: string,
  prefs: MatchPreferences,
  locale: string,
  onProgress: ProgressFn = () => {}
): Promise<JournalMatchResult> {
  onProgress({ type: "stage", stage: "profiling" });
  const profile = await profileManuscript(manuscriptText);

  onProgress({ type: "stage", stage: "searching" });
  const pool = await buildCandidatePool(profile, prefs);
  const toEvaluate = selectForEvaluation(pool, prefs, MAX_EVALUATIONS);
  if (toEvaluate.length < 3) {
    throw new MatchError("Not enough suitable journals matched the manuscript and preferences", "NO_CANDIDATES");
  }

  onProgress({ type: "stage", stage: "evaluating", detail: String(toEvaluate.length) });
  const evidenceQuery = profile.searchQueries[1] ?? profile.searchQueries[0] ?? "";
  const outcomes = await mapWithConcurrency(toEvaluate, EVALUATION_CONCURRENCY, async (c) => {
    if (c.exampleWorks.length === 0 && evidenceQuery) {
      c.exampleWorks = (await findSimilarWorksInJournal(c.id, evidenceQuery).catch(() => ({ works: [] }))).works;
    }
    c.evaluation = await evaluateJournalFit(profile, c, locale);
  });

  const evaluated = toEvaluate.filter((c) => c.evaluation && exclusionReason(c, prefs) === null);
  if (evaluated.length < 3) {
    const failure = outcomes.find((o): o is PromiseRejectedResult => o?.status === "rejected");
    if (failure && toEvaluate.every((c) => !c.evaluation)) throw failure.reason;
    throw new MatchError("Not enough journals passed the fit evaluation", "NO_CANDIDATES");
  }

  const evidence = evidenceScores(evaluated);
  const impact = impactScores(evaluated);
  for (const c of evaluated) {
    c.score = compositeScore(c.evaluation!, evidence.get(c.id) ?? 0, impact.get(c.id) ?? 0, prefs.priority);
  }
  const finalists = evaluated.sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).slice(0, MAX_FINALISTS);

  onProgress({ type: "stage", stage: "ranking" });
  let ranking: FinalRanking;
  try {
    ranking = await rankFinalists(profile, finalists, prefs, locale);
    if (!validateRanking(ranking, finalists)) {
      console.warn("[JournalMatcher] Chief editor returned an invalid selection; using score order");
      ranking = fallbackRanking(finalists);
    }
  } catch (error) {
    console.warn("[JournalMatcher] Chief editor failed; using score order:", error);
    ranking = fallbackRanking(finalists);
  }

  const byId = new Map(finalists.map((c) => [c.id, c]));
  const recommendations: JournalRecommendation[] = [...ranking.recommendations]
    .sort((a, b) => a.rank - b.rank)
    .map((r, i) => {
      const candidate = byId.get(r.candidateId)!;
      return {
        rank: i + 1,
        strategy: r.strategy,
        rationale: r.rationale,
        preparationTips: r.preparationTips,
        score: candidate.score ?? 0,
        candidate,
      };
    });

  return {
    profile,
    overview: ranking.overview,
    recommendations,
    candidatesConsidered: pool.length,
    generatedAt: new Date().toISOString(),
  };
}
