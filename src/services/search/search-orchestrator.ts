import { searchPubMed } from "./pubmed-client";
import { searchSemanticScholar } from "./semantic-scholar-client";

export async function gatherLiterature(query: string) {
  const [pubmedResults, scholarResults] = await Promise.all([
    searchPubMed(query).catch(e => { console.error(e); return []; }),
    searchSemanticScholar(query).catch(e => { console.error(e); return []; })
  ]);

  const allResults = [...pubmedResults, ...scholarResults];
  const combined: any[] = [];
  const seenDois = new Set<string>();
  const seenTitles = new Set<string>();

  for (const item of allResults) {
    const normalizedTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
    let duplicate = false;

    if (item.doi && seenDois.has(item.doi)) {
      duplicate = true;
    } else if (normalizedTitle && seenTitles.has(normalizedTitle)) {
      duplicate = true;
    }

    if (!duplicate) {
      if (item.doi) seenDois.add(item.doi);
      if (normalizedTitle) seenTitles.add(normalizedTitle);
      combined.push(item);
    }
  }

  return {
    pubmedResults,
    scholarResults,
    combined
  };
}
