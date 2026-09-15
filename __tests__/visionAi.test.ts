import { extractFiguresFromDocument, analyzeFigureWithVisionAi, suggestImprovedLegend } from '../src/services/visionAi.service';
import Anthropic from '@anthropic-ai/sdk';

jest.mock('@anthropic-ai/sdk', () => {
  const mCreate = jest.fn();
  const mockAnthropic = jest.fn().mockImplementation(() => ({
    messages: {
      create: mCreate
    }
  }));
  (mockAnthropic as any).mockCreate = mCreate;
  return mockAnthropic;
});

jest.mock('@/db', () => ({
  db: {}
}));

describe('visionAiService', () => {
  let mockCreate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreate = (Anthropic as any).mockCreate;
  });

  describe('extractFiguresFromDocument', () => {
    it('returns a mock array of figures', async () => {
      const figures = await extractFiguresFromDocument('http://example.com/doc.pdf');
      expect(figures.length).toBe(1);
      expect(figures[0].imageUrl).toBe('https://example.com/images/fig1.png');
    });
  });

  describe('analyzeFigureWithVisionAi', () => {
    it('analyzes figure and returns parsed json', async () => {
      const mockParsed = {
        accuracyScore: 90,
        claimVerificationStatus: 'verified',
        suggestedLegend: 'Better legend',
        issuesFound: ['none']
      };

      mockCreate.mockResolvedValue({
        content: [{ text: JSON.stringify(mockParsed) }]
      });

      const result = await analyzeFigureWithVisionAi('imgUrl', 'legend', ['claim1']);

      expect(result.legendAccuracyScore).toBe(90);
      expect(result.claimVerificationStatus).toBe('verified');
      expect(result.suggestedLegend).toBe('Better legend');
      expect(mockCreate).toHaveBeenCalled();
    });

    it('throws error if parsing fails', async () => {
      mockCreate.mockRejectedValue(new Error('API error'));

      await expect(analyzeFigureWithVisionAi('imgUrl', 'legend', ['claim1']))
        .rejects.toThrow('Failed to analyze figure');
    });
  });

  describe('suggestImprovedLegend', () => {
    it('returns improved legend', async () => {
      mockCreate.mockResolvedValue({
        content: [{ text: 'Improved legend text' }]
      });

      const result = await suggestImprovedLegend('imgUrl', 'current', 'context');
      expect(result).toBe('Improved legend text');
    });

    it('returns current legend on error', async () => {
      mockCreate.mockRejectedValue(new Error('API error'));

      const result = await suggestImprovedLegend('imgUrl', 'current', 'context');
      expect(result).toBe('current');
    });
  });
});
