import { ReformattingService } from "../../src/services/reformattingService";
import { db } from "../../src/services/db";

jest.mock("../../src/services/db", () => {
  return {
    db: {
      query: {
        papers: { findFirst: jest.fn() },
        journals: { findFirst: jest.fn() },
        journalCitationRules: { findFirst: jest.fn() },
        journalAbstractRules: { findFirst: jest.fn() },
        journalArticleTypes: { findMany: jest.fn() },
      },
      select: jest.fn(),
      update: jest.fn(),
      insert: jest.fn(),
    },
  };
});

describe("ReformattingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("throws if paper not found", async () => {
    (db.query.papers.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(ReformattingService.reformatForJournal(1, 2)).rejects.toThrow("Paper with ID 1 not found");
  });

  it("throws if new journal not found", async () => {
    (db.query.papers.findFirst as jest.Mock).mockResolvedValue({ id: 1 });
    (db.query.journals.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(ReformattingService.reformatForJournal(1, 2)).rejects.toThrow("Target journal with ID 2 not found");
  });

  it("reformats for a new journal, creating a new paper version", async () => {
    const paperId = 1;
    const newJournalId = 2;

    (db.query.papers.findFirst as jest.Mock).mockResolvedValue({ 
      id: paperId, 
      originalFileUrl: "http://example.com/file.docx",
      originalFormat: "docx" 
    });
    
    (db.query.journals.findFirst as jest.Mock).mockResolvedValue({ 
      id: newJournalId, 
      name: "New Journal" 
    });
    
    (db.query.journalCitationRules.findFirst as jest.Mock).mockResolvedValue({
      styleName: "APA",
      inTextFormat: "parentheses"
    });
    
    (db.query.journalAbstractRules.findFirst as jest.Mock).mockResolvedValue({
      abstractType: "structured"
    });

    (db.query.journalArticleTypes.findMany as jest.Mock).mockResolvedValue([
      { isPrimary: true, typeName: "Research Article", wordLimit: 5000 }
    ]);

    // Mock update paper
    const mockUpdateWhere = jest.fn().mockResolvedValue([]);
    const mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere });
    (db.update as jest.Mock).mockReturnValue({ set: mockUpdateSet });

    // Mock select existing versions
    const mockOrderBy = jest.fn().mockResolvedValue([{ versionNumber: 2 }]);
    const mockWhereSelect = jest.fn().mockReturnValue({ orderBy: mockOrderBy });
    const mockFromSelect = jest.fn().mockReturnValue({ where: mockWhereSelect });
    (db.select as jest.Mock).mockReturnValue({ from: mockFromSelect });

    // Mock insert new version
    const mockReturning = jest.fn().mockResolvedValue([{ id: 10, versionNumber: 3 }]);
    const mockValues = jest.fn().mockReturnValue({ returning: mockReturning });
    (db.insert as jest.Mock).mockReturnValue({ values: mockValues });

    const result = await ReformattingService.reformatForJournal(paperId, newJournalId);

    expect(result.paperId).toBe(paperId);
    expect(result.newJournalId).toBe(newJournalId);
    expect(result.newVersion.versionNumber).toBe(3);
    
    expect(db.update).toHaveBeenCalled();
    expect(mockUpdateSet).toHaveBeenCalledWith({
      targetJournalId: newJournalId,
      suggestedJournals: null
    });
    
    expect(db.insert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
      paperId,
      versionNumber: 3,
      changesSummary: expect.stringContaining("Reformatted for New Journal"),
    }));
    
    // Check that rules are parsed into changes summary
    const insertedValues = mockValues.mock.calls[0][0];
    expect(insertedValues.changesSummary).toContain("Updated citations to APA style");
    expect(insertedValues.changesSummary).toContain("Reformatted abstract to structured");
    expect(insertedValues.changesSummary).toContain("Adjusted length to meet the 5000 word limit");
  });
});
