import { logFeedbackOutcome, exportDatasetForFineTuning, assignPromptStrategy, getJournalAnalytics } from '../src/services/rlhfService';
import { db } from '@/db';
import fs from 'fs/promises';

jest.mock('@/db', () => ({
  db: {
    execute: jest.fn(),
    insert: jest.fn(),
    select: jest.fn(),
  }
}));

jest.mock('fs/promises', () => ({
  writeFile: jest.fn()
}));

describe('rlhfService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logFeedbackOutcome', () => {
    it('throws if submission not found', async () => {
      (db.execute as jest.Mock).mockResolvedValue({ rows: [] });
      await expect(logFeedbackOutcome(1, 'accepted')).rejects.toThrow('Submission not found');
    });

    it('inserts a log if submission exists', async () => {
      (db.execute as jest.Mock).mockResolvedValue({
        rows: [{ paper_version_id: 10, journal_id: 20 }]
      });
      (db.insert as jest.Mock).mockReturnValue({ values: jest.fn() });

      await logFeedbackOutcome(1, 'accepted', 'good job');

      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('exportDatasetForFineTuning', () => {
    it('fetches logs and writes to file', async () => {
      const mockWhere = jest.fn().mockResolvedValue([
        { correctionData: { a: 1 }, outcome: 'accepted' }
      ]);
      const mockQuery = {
        where: mockWhere,
        then: jest.fn()
      };
      // For when conditions.length === 0
      mockQuery.then.mockImplementation((cb) => cb([{ correctionData: { a: 1 }, outcome: 'accepted' }]));
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue(mockQuery)
      });
      
      const filePath = await exportDatasetForFineTuning();

      expect(fs.writeFile).toHaveBeenCalled();
      expect(filePath).toMatch(/finetune_dataset_\d+\.jsonl/);
    });
  });

  describe('assignPromptStrategy', () => {
    it('throws if no active strategies', async () => {
      const mockWhere = jest.fn().mockResolvedValue([]);
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({ where: mockWhere })
      });

      await expect(assignPromptStrategy(1)).rejects.toThrow('No active prompt strategies available');
    });

    it('assigns a strategy', async () => {
      const mockWhere = jest.fn().mockResolvedValue([{ id: 'strategy-1' }]);
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({ where: mockWhere })
      });
      (db.insert as jest.Mock).mockReturnValue({ values: jest.fn() });

      const result = await assignPromptStrategy(1);

      expect(result).toBe('strategy-1');
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('getJournalAnalytics', () => {
    it('returns stats', async () => {
      const mockGroupBy = jest.fn().mockResolvedValue([
        { outcome: 'accepted', count: 2 },
        { outcome: 'rejected', count: 3 }
      ]);
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            groupBy: mockGroupBy
          })
        })
      });

      const stats = await getJournalAnalytics(1);
      expect(stats.totalSubmissions).toBe(5);
      expect(stats.outcomes.length).toBe(2);
      expect(stats.outcomes[0].percentage).toBe(40);
    });
  });
});
