/**
 * Research Service
 * Collects reference data by fetching literature details from the literature service.
 */

import { literatureService } from './literature/literatureService';

export interface ArticleReference {
  urlOrDoi: string;
  title: string;
  fullText: string;
  authors: string[];
  publicationYear: number;
}

export class ResearchService {
  /**
   * Fetches reference content given URLs or DOIs, using the LiteratureService.
   * 
   * @param urlsOrDois Array of URLs or DOIs to fetch.
   * @returns Promise resolving to an array of ArticleReference objects.
   */
  async fetchReferenceContent(urlsOrDois: string[]): Promise<ArticleReference[]> {
    if (!urlsOrDois || !Array.isArray(urlsOrDois)) {
      return [];
    }

    console.log(`[ResearchService] Fetching content for ${urlsOrDois.length} references...`);

    const references: ArticleReference[] = [];

    for (const id of urlsOrDois) {
      try {
        const result = await literatureService.search(id, { limit: 1 });
        if (result.items && result.items.length > 0) {
          const item = result.items[0];
          references.push({
            urlOrDoi: id,
            title: item.title || `Article ${id}`,
            fullText: item.abstract || `No abstract available for ${id}.`,
            authors: item.authors ? item.authors.map(a => a.name) : ['Unknown'],
            publicationYear: item.year || new Date().getFullYear(),
          });
        } else {
          // Fallback if not found
          references.push({
            urlOrDoi: id,
            title: `Article ${id}`,
            fullText: `No content found for ${id}.`,
            authors: ['Unknown'],
            publicationYear: new Date().getFullYear(),
          });
        }
      } catch (error) {
        console.error(`[ResearchService] Error fetching reference ${id}:`, error);
        references.push({
          urlOrDoi: id,
          title: `Article ${id}`,
          fullText: `Error fetching content for ${id}.`,
          authors: ['Unknown'],
          publicationYear: new Date().getFullYear(),
        });
      }
    }

    return references;
  }
}

export const researchService = new ResearchService();
