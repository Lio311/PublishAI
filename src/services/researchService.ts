/**
 * Research Service
 * Mocks the process of collecting full-text articles and references.
 */

export interface ArticleReference {
  urlOrDoi: string;
  title: string;
  fullText: string;
  authors: string[];
  publicationYear: number;
}

export class ResearchService {
  /**
   * Mocks fetching reference content given URLs or DOIs, simulating
   * the collection of full-text articles.
   * 
   * @param urlsOrDois Array of URLs or DOIs to fetch.
   * @returns Promise resolving to an array of ArticleReference objects.
   */
  async fetchReferenceContent(urlsOrDois: string[]): Promise<ArticleReference[]> {
    console.log(`[ResearchService] Mocking fetch for ${urlsOrDois.length} references...`);
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!urlsOrDois || !Array.isArray(urlsOrDois)) {
      return [];
    }

    return urlsOrDois.map((id, index) => ({
      urlOrDoi: id,
      title: `Mocked Scientific Article Title ${index + 1}`,
      fullText: `This is the mocked full-text content for the article referenced by ${id}. It contains a comprehensive overview of the research methodology, results, and conclusions.`,
      authors: [`Author ${index + 1}A`, `Author ${index + 1}B`],
      publicationYear: new Date().getFullYear(),
    }));
  }
}

export const researchService = new ResearchService();
