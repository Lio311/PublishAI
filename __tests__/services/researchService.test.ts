import { researchService } from '../../src/services/researchService';
import { literatureService } from '../../src/services/literature/literatureService';

jest.mock('../../src/services/literature/literatureService', () => ({
  literatureService: {
    getByDoi: jest.fn().mockImplementation((doi: string) => {
      return Promise.resolve({
        id: `crossref-${doi}`,
        externalId: doi,
        source: 'crossref',
        title: `Scientific Article for ${doi}`,
        authors: [{ name: 'Author 1A' }, { name: 'Author 1B' }],
        year: 2024,
        abstract: `Abstract content for ${doi}`,
      });
    }),
    search: jest.fn().mockImplementation((query: string) => {
      return Promise.resolve({
        query,
        total: 1,
        items: [{
          id: `pubmed-${query}`,
          externalId: query,
          source: 'pubmed',
          title: `Scientific Article for ${query}`,
          authors: [{ name: 'Author 1A' }, { name: 'Author 1B' }],
          year: 2024,
          abstract: `Abstract content for ${query}`,
        }],
        sources: { pubmed: 1, crossref: 0 },
      });
    }),
  },
}));

describe('ResearchService', () => {
  it('should fetch reference content using literature service', async () => {
    const dois = ['10.1000/xyz123', '10.1016/j.jcp.2020.109722'];
    const results = await researchService.fetchReferenceContent(dois);
    
    expect(results).toHaveLength(2);
    expect(results[0].urlOrDoi).toBe(dois[0]);
    expect(results[1].urlOrDoi).toBe(dois[1]);
    expect(results[0].title).toBe('Scientific Article for 10.1000/xyz123');
    expect(results[0].authors).toEqual(['Author 1A', 'Author 1B']);
    expect(results[0].publicationYear).toBe(2024);
    expect(literatureService.getByDoi).toHaveBeenCalledWith('10.1000/xyz123');
  });

  it('should return empty array if no DOIs provided', async () => {
    const results = await researchService.fetchReferenceContent([]);
    expect(results).toHaveLength(0);
  });

  it('should handle undefined or null gracefully', async () => {
    const results = await researchService.fetchReferenceContent(null as any);
    expect(results).toHaveLength(0);
  });
});
