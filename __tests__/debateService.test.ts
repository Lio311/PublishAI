import { initializeDebate, addDebateMessage, checkConsensus } from '../src/services/debateService';
import { db } from '@/db';
import { debates, debateAgents, debateMessages } from '@/db/schema';
import { eq } from 'drizzle-orm';

jest.mock('@/db', () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
  }
}));

describe('debateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initializeDebate', () => {
    it('initializes a debate and agents', async () => {
      const mockInsertReturning = jest.fn().mockResolvedValue([{ id: 'debate-123' }]);
      (db.insert as jest.Mock).mockReturnValue({
        values: mockInsertReturning
      });

      const debateId = await initializeDebate(1);

      expect(debateId).toBe('debate-123');
      expect(db.insert).toHaveBeenCalledTimes(2);
    });
  });

  describe('addDebateMessage', () => {
    it('adds a message to the debate', async () => {
      const mockInsertReturning = jest.fn().mockResolvedValue([{ id: 'msg-1' }]);
      (db.insert as jest.Mock).mockReturnValue({
        values: mockInsertReturning
      });

      const msgId = await addDebateMessage('debate-123', 'agent-1', 'content', 1);

      expect(msgId).toBe('msg-1');
    });
  });

  describe('checkConsensus', () => {
    it('returns false if no consensus proposal', async () => {
      const mockSelectWhere = jest.fn().mockResolvedValue([
        { id: 'msg-1', isConsensusProposal: false }
      ]);
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: mockSelectWhere
        })
      });

      const result = await checkConsensus('debate-123');

      expect(result.reached).toBe(false);
    });

    it('returns true if consensus proposal exists', async () => {
      const mockSelectWhere = jest.fn().mockResolvedValue([
        { id: 'msg-1', isConsensusProposal: true }
      ]);
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: mockSelectWhere
        })
      });

      const result = await checkConsensus('debate-123');

      expect(result.reached).toBe(true);
      expect(result.summary).toBeDefined();
    });
  });
});
