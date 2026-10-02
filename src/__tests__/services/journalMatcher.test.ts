/**
 * @jest-environment node
 */
import type { JournalCandidate, JournalEvaluation, JournalMetrics, ManuscriptProfile } from "@/services/journal-matcher/types";

jest.mock("@/services/db", () => ({
  db: {
    select: jest.fn(() => ({
      from: jest.fn().mockResolvedValue([{ id: 7, name: "Ophthalmology" }]),
    })),
  },
}));

jest.mock("@/services/journal-matcher/agents", () => {
  const actual = jest.requireActual("@/services/journal-matcher/agents");
  return {
    ...actual,
    profileManuscript: jest.fn(),
    proposeJournals: jest.fn(),
    evaluateJournalFit: jest.fn(),
    rankFinalists: jest.fn(),
  };
});

jest.mock("@/services/journal-matcher/openalex", () => {
  const actual = jest.requireActual("@/services/journal-matcher/openalex");
  return {
    ...actual,
    findVenuesForQuery: jest.fn(),
    getJournalMetrics: jest.fn(),
    resolveJournalByName: jest.fn(),
    findSimilarWorksInJournal: jest.fn(),
  };
});

import * as agents from "@/services/journal-matcher/agents";
import * as openalex from "@/services/journal-matcher/openalex";
import { matchJournals, mergeVenueHits, validateRanking, MatchError } from "@/services/journal-matcher/pipeline";
import {
  compositeScore,
  evidenceScores,
  exclusionReason,
  selectForEvaluation,
} from "@/services/journal-matcher/scoring";
import { assertUsableText, ExtractionError, MIN_TEXT_CHARS } from "@/services/documents/extractText";

const mockedAgents = agents as jest.Mocked<typeof agents>;
const mockedOpenAlex = openalex as jest.Mocked<typeof openalex>;

function metrics(id: string, overrides: Partial<JournalMetrics> = {}): JournalMetrics {
  return {
    openAlexId: id,
    name: `Journal ${id}`,
    issn: null,
    publisher: "Publisher",
    homepageUrl: null,
    worksCount: 5000,
    citedness2yr: 4,
    hIndex: 80,
    isOpenAccess: true,
    isInDoaj: true,
    apcUsd: 2000,
    topics: ["Ophthalmology"],
    ...overrides,
  };
}

function candidate(id: string, overrides: Partial<JournalCandidate> = {}, metricOverrides: Partial<JournalMetrics> = {}): JournalCandidate {
  return {
    id,
    metrics: metrics(id, metricOverrides),
    similarArticleCount: 20,
    sources: ["literature"],
    exampleWorks: [],
    ...overrides,
  };
}

function evaluation(overrides: Partial<JournalEvaluation> = {}): JournalEvaluation {
  return {
    scopeFit: 80,
    levelFit: 70,
    acceptanceOutlook: "good",
    isReputable: true,
    strengths: ["Strong scope match"],
    concerns: [],
    ...overrides,
  };
}

const balanced = { priority: "balanced" as const, openAccessOnly: false, maxApcUsd: null };

const profile: ManuscriptProfile = {
  title: "Deep learning for diabetic retinopathy screening",
  field: "Medicine",
  subfield: "Ophthalmology",
  articleType: "Original Research",
  studyDesign: "Retrospective multicenter study",
  summary: "A CNN screens fundus images.",
  keyContributions: ["External validation"],
  keywords: ["diabetic retinopathy", "deep learning"],
  searchQueries: ["deep learning diabetic retinopathy", "fundus image classification", "AI ophthalmology"],
  audience: "Ophthalmologists",
  noveltyLevel: "solid",
  methodologicalRigor: "strong",
  wordCountEstimate: 4500,
  language: "English",
};

describe("journal matcher scoring", () => {
  it("excludes journals that fail the quality gate or the author's constraints", () => {
    expect(exclusionReason(candidate("S1", {}, { hIndex: 5 }), balanced)).toBe("insufficient track record");
    expect(exclusionReason(candidate("S1", {}, { isOpenAccess: false }), { ...balanced, openAccessOnly: true })).toBe("not open access");
    expect(exclusionReason(candidate("S1", {}, { apcUsd: 5000 }), { ...balanced, maxApcUsd: 3000 })).toBe("APC above budget");
    expect(exclusionReason(candidate("S1", { evaluation: evaluation({ isReputable: false }) }), balanced)).toBe("flagged as not reputable");
    expect(exclusionReason(candidate("S1"), balanced)).toBeNull();
  });

  it("credits a focused specialty journal over a mega-journal with the same article count", () => {
    const specialty = candidate("S1", { similarArticleCount: 40 }, { worksCount: 3000 });
    const mega = candidate("S2", { similarArticleCount: 40 }, { worksCount: 300000 });
    const scores = evidenceScores([specialty, mega]);
    expect(scores.get("S1")!).toBeGreaterThan(scores.get("S2")!);
  });

  it("weights impact more heavily when the author prioritizes impact", () => {
    const ev = evaluation({ acceptanceOutlook: "low" });
    expect(compositeScore(ev, 50, 100, "impact")).toBeGreaterThan(compositeScore(ev, 50, 100, "speed"));
  });

  it("keeps editor-proposed journals in the evaluation set even with weaker literature evidence", () => {
    const literature = Array.from({ length: 12 }, (_, i) => candidate(`L${i}`, { similarArticleCount: 100 - i }));
    const editorPick = candidate("E1", { similarArticleCount: 1, sources: ["editor"] });
    const selected = selectForEvaluation([...literature, editorPick], balanced, 10);
    expect(selected).toHaveLength(10);
    expect(selected.map((c) => c.id)).toContain("E1");
  });
});

describe("journal matcher helpers", () => {
  it("strips OpenAlex filter delimiters from search values", () => {
    expect(openalex.sanitizeFilterValue("cancer, immunotherapy | PD-1: trial")).toBe("cancer immunotherapy PD-1 trial");
  });

  it("normalizes journal names for comparison", () => {
    expect(openalex.normalizeJournalName("The Lancet Digital Health")).toBe(openalex.normalizeJournalName("Lancet Digital Health"));
    expect(openalex.normalizeJournalName("Science & Society")).toBe("science and society");
  });

  it("merges venue hits keeping the strongest count per journal", () => {
    const merged = mergeVenueHits([
      [{ id: "S1", name: "A", count: 5 }],
      [{ id: "S1", name: "A", count: 9 }, { id: "S2", name: "B", count: 3 }],
    ]);
    expect(merged.get("S1")!.count).toBe(9);
    expect(merged.size).toBe(2);
  });

  it("rejects text that is too short to analyze", () => {
    expect(() => assertUsableText("short")).toThrow(ExtractionError);
    expect(assertUsableText("a".repeat(MIN_TEXT_CHARS))).toHaveLength(MIN_TEXT_CHARS);
  });

  it("only accepts a ranking that names three distinct finalists", () => {
    const finalists = ["S1", "S2", "S3", "S4"].map((id) => candidate(id));
    const rec = (candidateId: string, rank: number) => ({ candidateId, rank, strategy: "target" as const, rationale: "", preparationTips: [] });
    expect(validateRanking({ overview: "", recommendations: [rec("S1", 1), rec("S2", 2), rec("S3", 3)] }, finalists)).toBe(true);
    expect(validateRanking({ overview: "", recommendations: [rec("S1", 1), rec("S1", 2), rec("S3", 3)] }, finalists)).toBe(false);
    expect(validateRanking({ overview: "", recommendations: [rec("S1", 1), rec("S2", 2), rec("S9", 3)] }, finalists)).toBe(false);
  });
});

describe("matchJournals pipeline", () => {
  const journalIds = ["S1", "S2", "S3", "S4", "S5"];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAgents.profileManuscript.mockResolvedValue(profile);
    mockedAgents.proposeJournals.mockResolvedValue({ journals: [{ name: "Ophthalmology", why: "Top clinical venue" }] });
    mockedOpenAlex.findVenuesForQuery.mockResolvedValue(journalIds.map((id, i) => ({ id, name: `Journal ${id}`, count: 50 - i * 5 })));
    mockedOpenAlex.getJournalMetrics.mockResolvedValue(journalIds.map((id) => metrics(id)));
    mockedOpenAlex.resolveJournalByName.mockResolvedValue(metrics("S99", { name: "Ophthalmology", hIndex: 300, citedness2yr: 9 }));
    mockedOpenAlex.findSimilarWorksInJournal.mockResolvedValue({ count: 30, works: [{ title: "Example", year: 2024, doi: null }] });
    mockedAgents.evaluateJournalFit.mockImplementation(async (_p, c) =>
      evaluation({ scopeFit: c.id === "S99" ? 95 : 60 + Number(c.id.slice(1)) })
    );
  });

  it("returns three ranked recommendations following the chief editor", async () => {
    mockedAgents.rankFinalists.mockResolvedValue({
      overview: "Plan",
      recommendations: [
        { candidateId: "S2", rank: 2, strategy: "target", rationale: "second", preparationTips: [] },
        { candidateId: "S99", rank: 1, strategy: "ambitious", rationale: "first", preparationTips: ["tip"] },
        { candidateId: "S1", rank: 3, strategy: "safe", rationale: "third", preparationTips: [] },
      ],
    });
    const stages: string[] = [];

    const result = await matchJournals("manuscript", balanced, "en", (e) => {
      if (e.type === "stage") stages.push(e.stage);
    });

    expect(stages).toEqual(["profiling", "searching", "evaluating", "ranking"]);
    expect(result.recommendations.map((r) => r.candidate.id)).toEqual(["S99", "S2", "S1"]);
    expect(result.recommendations.map((r) => r.rank)).toEqual([1, 2, 3]);
    expect(result.recommendations[0].candidate.sources).toContain("editor");
    expect(result.recommendations[0].candidate.internalJournalId).toBe(7);
    expect(result.candidatesConsidered).toBe(6);
  });

  it("falls back to composite-score order when the chief editor picks unknown journals", async () => {
    mockedAgents.rankFinalists.mockResolvedValue({
      overview: "",
      recommendations: [
        { candidateId: "nope", rank: 1, strategy: "target", rationale: "", preparationTips: [] },
        { candidateId: "S1", rank: 2, strategy: "target", rationale: "", preparationTips: [] },
        { candidateId: "S2", rank: 3, strategy: "safe", rationale: "", preparationTips: [] },
      ],
    });

    const result = await matchJournals("manuscript", balanced, "en");
    const scores = result.recommendations.map((r) => r.score);
    expect(result.recommendations[0].candidate.id).toBe("S99");
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it("fails with NO_CANDIDATES when preferences filter out almost everything", async () => {
    mockedOpenAlex.getJournalMetrics.mockResolvedValue(journalIds.map((id) => metrics(id, { isOpenAccess: false })));
    mockedOpenAlex.resolveJournalByName.mockResolvedValue(null);

    await expect(matchJournals("manuscript", { ...balanced, openAccessOnly: true }, "en")).rejects.toMatchObject({
      code: "NO_CANDIDATES",
    });
    expect(mockedAgents.evaluateJournalFit).not.toHaveBeenCalled();
  });

  it("fails with LITERATURE_UNAVAILABLE when every OpenAlex search fails", async () => {
    mockedOpenAlex.findVenuesForQuery.mockRejectedValue(new Error("network down"));
    await expect(matchJournals("manuscript", balanced, "en")).rejects.toBeInstanceOf(MatchError);
  });

  it("surfaces the agent error when no evaluation succeeds", async () => {
    mockedAgents.evaluateJournalFit.mockRejectedValue(new agents.AgentError("down", "AI_FAILED"));
    await expect(matchJournals("manuscript", balanced, "en")).rejects.toMatchObject({ code: "AI_FAILED" });
  });
});
