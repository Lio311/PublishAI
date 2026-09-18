export async function searchArxiv(query: string, limit: number = 5) {
  try {
    const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${limit}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`arXiv failed: ${res.statusText}`);
    
    const xml = await res.text();
    const results = [];
    
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    
    while ((match = entryRegex.exec(xml)) !== null) {
      const entryXML = match[1];
      
      const titleMatch = entryXML.match(/<title>([\s\S]*?)<\/title>/);
      const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : 'Untitled';
      
      const idMatch = entryXML.match(/<id>([\s\S]*?)<\/id>/);
      const id = idMatch ? idMatch[1].trim() : '';
      
      const publishedMatch = entryXML.match(/<published>([\s\S]*?)<\/published>/);
      const year = publishedMatch ? publishedMatch[1].substring(0, 4) : '';
      
      const authorRegex = /<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g;
      const authorsList = [];
      let authorMatch;
      while ((authorMatch = authorRegex.exec(entryXML)) !== null) {
        authorsList.push(authorMatch[1].trim());
      }
      const authors = authorsList.length > 0 ? authorsList.join(', ') : 'Unknown';
      
      const doiMatch = entryXML.match(/<arxiv:doi[^>]*>([\s\S]*?)<\/arxiv:doi>/) || entryXML.match(/<link[^>]*title="doi"[^>]*href="http:\/\/dx\.doi\.org\/([^"]+)"/);
      const doi = doiMatch ? doiMatch[1].trim() : '';

      results.push({
        id,
        title,
        authors,
        year,
        doi,
        source: 'arXiv'
      });
    }
    
    return results;
  } catch (error) {
    console.error('[arXiv Client] Error:', error);
    return [];
  }
}
