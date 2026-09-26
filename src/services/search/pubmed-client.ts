import { literatureService } from "@/services/literature/literatureService";

export async function searchPubMed(query: string, limit: number = 5) {
  try {
    const items = await literatureService.pubmed.search(query, { limit });
    return items.map(item => ({
      id: item.externalId,
      title: item.title,
      authors: item.authors.map(a => a.name).join(', '),
      year: item.year ? item.year.toString() : '',
      doi: item.doi || '',
      source: 'PubMed'
    }));
  } catch (error) {
    console.error('[PubMed Client] Error:', error);
    return [];
  }
}
