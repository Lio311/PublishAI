export async function searchPubMed(query: string, limit: number = 5) {
  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=${limit}&term=${encodeURIComponent(query)}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) throw new Error(`PubMed search failed: ${searchRes.statusText}`);
    
    const searchData = await searchRes.json();
    const ids = searchData.esearchresult?.idlist || [];
    
    if (ids.length === 0) return [];
    
    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(',')}`;
    const fetchRes = await fetch(fetchUrl);
    if (!fetchRes.ok) throw new Error(`PubMed fetch failed: ${fetchRes.statusText}`);
    
    const fetchData = await fetchRes.json();
    const results = [];
    
    for (const id of ids) {
      const summary = fetchData.result?.[id];
      if (summary) {
        const authors = summary.authors ? summary.authors.map((a: any) => a.name).join(', ') : 'Unknown';
        const doiItem = summary.articleids ? summary.articleids.find((a: any) => a.idtype === 'doi') : null;
        const doi = doiItem ? doiItem.value : '';
        const year = summary.pubdate ? summary.pubdate.split(' ')[0] : '';
        
        results.push({
          id,
          title: summary.title || 'Untitled',
          authors,
          year,
          doi,
          source: 'PubMed'
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('[PubMed Client] Error:', error);
    return [];
  }
}
