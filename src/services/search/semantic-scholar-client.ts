export async function searchSemanticScholar(query: string, limit: number = 5) {
  try {
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=title,authors,year,externalIds,abstract`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Semantic Scholar failed: ${res.statusText}`);
    
    const json = await res.json();
    const data = json.data || [];
    
    return data.map((item: any) => {
      const authors = item.authors ? item.authors.map((a: any) => a.name).join(', ') : 'Unknown';
      const doi = item.externalIds?.DOI || '';
      return {
        id: item.paperId || '',
        title: item.title || 'Untitled',
        authors,
        year: item.year ? item.year.toString() : '',
        doi,
        source: 'Semantic Scholar'
      };
    });
  } catch (error) {
    console.error('[Semantic Scholar Client] Error:', error);
    return [];
  }
}
