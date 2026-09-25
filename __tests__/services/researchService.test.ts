import { researchService } from '../../src/services/researchService';

describe('ResearchService', () => {
  it('should mock fetching reference content', async () => {
    const dois = ['10.1000/xyz123', '10.1016/j.jcp.2020.109722'];
    const results = await researchService.fetchReferenceContent(dois);
    
    expect(results).toHaveLength(2);
    expect(results[0].urlOrDoi).toBe(dois[0]);
    expect(results[1].urlOrDoi).toBe(dois[1]);
    expect(results[0].title).toBe('Mocked Scientific Article Title 1');
    expect(results[0].authors).toEqual(['Author 1A', 'Author 1B']);
    expect(results[0].publicationYear).toBe(new Date().getFullYear());
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
