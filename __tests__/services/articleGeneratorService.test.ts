import { articleGeneratorService, GenerationInput } from '../../src/services/articleGeneratorService';

describe('ArticleGeneratorService', () => {
  it('should successfully generate an article', async () => {
    const input: GenerationInput = {
      statisticalConclusions: 'P-value < 0.05',
      graphs: ['graph1_base64', 'graph2_base64'],
      references: [
        {
          urlOrDoi: '123',
          title: 'Ref 1',
          fullText: 'text',
          authors: ['Author A'],
          publicationYear: 2023
        }
      ]
    };

    const article = await articleGeneratorService.generateArticle(input);

    expect(article.title).toBe('Synthesized Research Findings: A Comprehensive Study');
    expect(article.results).toContain('P-value < 0.05');
    expect(article.results).toContain('2 graphs');
    expect(article.references).toHaveLength(1);
    expect(article.references[0]).toContain('Author A (2023). Ref 1.');
  });

  it('should throw error if input is invalid', async () => {
    await expect(articleGeneratorService.generateArticle({} as any)).rejects.toThrow('Invalid generation input: missing references or graphs');
  });
});
