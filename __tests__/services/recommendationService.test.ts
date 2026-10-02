import { RecommendationService } from "../../src/services/recommendationService";
import { db } from "../../src/services/db";
import { matchJournals } from "../../src/services/journal-matcher/pipeline";
import { loadManuscriptText } from "../../src/services/documents/manuscriptStore";

jest.mock("../../src/services/db", () => {
  const updateWhereMock = jest.fn();
  const updateSetMock = jest.fn(() => ({ where: updateWhereMock }));

  return {
    db: {
      query: {
        papers: { findFirst: jest.fn() },
        journals: { findFirst: jest.fn() },
      },
      update: jest.fn(() => ({ set: updateSetMock })),
    },
  };
});

jest.mock("../../src/services/documents/manuscriptStore", () => ({
  loadManuscriptText: jest.fn(),
}));

jest.mock("../../src/services/journal-matcher/pipeline", () => ({
  matchJournals: jest.fn(),
}));

jest.mock("../../src/inngest/client", () => ({ inngest: { createFunction: jest.fn(() => ({})) } }));

const recommendation = (id: string, name: string, score: number, internalJournalId?: number) => ({
  rank: 1,
  strategy: "target",
  rationale: `Why ${name}`,
  preparationTips: [],
  score,
  candidate: {
    id,
    internalJournalId,
    metrics: { name, citedness2yr: 4.2, homepageUrl: null },
  },
});

describe("RecommendationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws error if paper not found", async () => {
    (db.query.papers.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(RecommendationService.recommendAlternatives(999)).rejects.toThrow("Paper with ID 999 not found");
  });

  it("throws if the paper has no manuscript text", async () => {
    (db.query.papers.findFirst as jest.Mock).mockResolvedValue({ id: 1, targetJournalId: null });
    (loadManuscriptText as jest.Mock).mockResolvedValue(null);
    await expect(RecommendationService.recommendAlternatives(1)).rejects.toThrow("no manuscript text");
  });

  it("recommends journals with the matcher, excluding the current journal, and stores them", async () => {
    (db.query.papers.findFirst as jest.Mock).mockResolvedValue({ id: 1, targetJournalId: 10 });
    (db.query.journals.findFirst as jest.Mock).mockResolvedValue({ id: 10, name: "Nature" });
    (loadManuscriptText as jest.Mock).mockResolvedValue("manuscript text");
    (matchJournals as jest.Mock).mockResolvedValue({
      recommendations: [recommendation("S1", "Cell", 84, 5), recommendation("S2", "eLife", 78)],
    });

    const alternatives = await RecommendationService.recommendAlternatives(1, "he");

    expect(matchJournals).toHaveBeenCalledWith(
      "manuscript text",
      expect.objectContaining({ excludeJournalNames: ["Nature"] }),
      "he"
    );
    expect(alternatives.map((a) => [a.name, a.matchScore, a.journalId])).toEqual([
      ["Cell", 84, 5],
      ["eLife", 78, null],
    ]);
    const setMock = (db.update as jest.Mock).mock.results[0].value.set;
    expect(setMock).toHaveBeenCalledWith({ suggestedJournals: alternatives });
  });
});
