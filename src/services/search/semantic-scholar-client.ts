import { literatureService } from "@/services/literature/literatureService";

export async function searchSemanticScholar(query: string, limit: number = 5) {
  try {
    const items = await literatureService.semanticScholar.search(query, { limit });
    return items.map(item => ({
      id: item.externalId,
      title: item.title,
      authors: item.authors.map(a => a.name).join(', '),
      year: item.year ? item.year.toString() : '',
      doi: item.doi || '',
      source: 'Semantic Scholar'
    }));
  } catch (error) {
    console.error('[Semantic Scholar Client] Error:', error);
    return [];
  }
}
