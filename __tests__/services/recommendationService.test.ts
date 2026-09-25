import { RecommendationService } from "../../src/services/recommendationService";
import { db } from "../../src/services/db";

// Mock DB
jest.mock("../../src/services/db", () => {
  const updateWhereMock = jest.fn();
  const updateSetMock = jest.fn(() => ({ where: updateWhereMock }));
  
  return {
    db: {
      query: {
        papers: {
          findFirst: jest.fn(),
        },
      },
      select: jest.fn(() => ({
        from: jest.fn(),
      })),
      update: jest.fn(() => ({
        set: updateSetMock,
      })),
    },
  };
});

describe("RecommendationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws error if paper not found", async () => {
    (db.query.papers.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(RecommendationService.recommendAlternatives(999)).rejects.toThrow("Paper with ID 999 not found");
  });

  it("returns alternative journals and updates the paper", async () => {
    const mockPaper = {
      id: 1,
      targetJournalId: 10,
    };
    (db.query.papers.findFirst as jest.Mock).mockResolvedValue(mockPaper);

    const mockJournals = [
      { id: 10, name: "Current Journal", field: "Biology" }, // Should be filtered out
      { id: 11, name: "Alt Journal 1", field: "Physics" },
      { id: 12, name: "Alt Journal 2", field: null },
    ];
    
    // We need to mock db.select().from() to resolve to mockJournals
    const mockFrom = jest.fn().mockResolvedValue(mockJournals);
    (db.select as jest.Mock).mockReturnValue({ from: mockFrom });

    // Ensure db.update(...).set(...).where(...) chain is mockable
    const mockWhere = jest.fn().mockResolvedValue([]);
    const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
    (db.update as jest.Mock).mockReturnValue({ set: mockSet });

    const alternatives = await RecommendationService.recommendAlternatives(1);

    expect(alternatives).toHaveLength(2);
    expect(alternatives[0].journalId).toBe(11);
    expect(alternatives[0].matchScore).toBe(95); // 95 - 0 * 5
    expect(alternatives[1].journalId).toBe(12);
    expect(alternatives[1].matchScore).toBe(90); // 95 - 1 * 5
    expect(alternatives[1].reason).toContain("general science");

    expect(db.update).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith({ suggestedJournals: alternatives });
    expect(mockWhere).toHaveBeenCalled();
  });
});
