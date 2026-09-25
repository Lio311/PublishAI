import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const pubmedTool = tool(
  async ({ query }: { query: string }) => {
    try {
      const searchRes = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=3`);
      if (!searchRes.ok) return "Failed to fetch from PubMed API";
      const searchData = await searchRes.json();
      const ids = searchData.esearchresult?.idlist;
      
      if (!ids || ids.length === 0) return "No results found on PubMed.";
      
      const fetchRes = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=text&rettype=abstract`);
      if (!fetchRes.ok) return "Failed to fetch abstracts from PubMed";
      
      const textData = await fetchRes.text();
      return textData || "No abstracts available.";
    } catch (error) {
      return `Error searching PubMed: ${error}`;
    }
  },
  {
    name: "pubmed_search",
    description: "Search PubMed for medical and life science literature abstracts",
    schema: z.object({
      query: z.string().describe("The search query for PubMed"),
    }),
  }
);
