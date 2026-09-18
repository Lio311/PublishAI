export const mockGenerateText = jest.fn();
export const mockGenerateObject = jest.fn();
jest.mock("ai", () => ({
  generateText: (...args: any[]) => mockGenerateText(...args),
  generateObject: (...args: any[]) => mockGenerateObject(...args)
}));

import { extractFiguresFromDocument, analyzeFigureWithVisionAi, suggestImprovedLegend } from '../src/services/visionAi.service';

global.fetch = jest.fn();
globalThis.fetch = global.fetch;
if (typeof window !== 'undefined') window.fetch = global.fetch;

jest.mock('@/db', () => ({
  db: {}
}));

describe('visionAiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      mockGenerateObject.mockResolvedValue({
        object: {
          accuracyScore: 90,
          claimVerificationStatus: 'verified',
          suggestedLegend: 'Better legend'
        }
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
      });

      const result = await analyzeFigureWithVisionAi('imgUrl', 'legend', ['claim1']);

      expect(result.legendAccuracyScore).toBe(90);
      expect(result.claimVerificationStatus).toBe('verified');
      expect(result.suggestedLegend).toBe('Better legend');
      expect(mockGenerateObject).toHaveBeenCalled();
    });

    it('throws error if parsing fails', async () => {
      mockGenerateObject.mockRejectedValue(new Error('API error'));

      await expect(analyzeFigureWithVisionAi('imgUrl', 'legend', ['claim1']))
        .rejects.toThrow('Failed to analyze figure');
    });
  });

  describe('suggestImprovedLegend', () => {
    it('returns improved legend', async () => {
      mockGenerateText.mockResolvedValue({ text: 'Improved legend text' });

      const result = await suggestImprovedLegend('imgUrl', 'current', 'context');
      expect(result).toBe('Improved legend text');
    });

    it('throws error on error', async () => {
      mockGenerateText.mockRejectedValue(new Error('API error'));
      
      await expect(suggestImprovedLegend('imgUrl', 'current', 'context')).rejects.toThrow('Failed to suggest improved legend.');
    });
  });
});
