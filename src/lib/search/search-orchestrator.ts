import { searchPubMed } from "./pubmed-client";
import { searchSemanticScholar } from "./semantic-scholar-client";
import { searchArxiv } from "./arxiv-client";

export async function gatherLiterature(query: string) {
  const [pubmedResults, scholarResults, arxivResults] = await Promise.all([
    searchPubMed(query),
    searchSemanticScholar(query),
    searchArxiv(query)
  ]);

  // Deduplication and relevance ranking logic would go here.
  return {
    pubmedResults,
    scholarResults,
    arxivResults,
    combined: []
  };
}
