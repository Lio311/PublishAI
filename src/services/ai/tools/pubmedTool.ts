import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { withRateLimitRetry } from "../rateLimiter";

export const pubmedTool = tool(
  async ({ query }: { query: string }) => {
    try {
      const apiKeyParam = process.env.NCBI_API_KEY ? `&api_key=${encodeURIComponent(process.env.NCBI_API_KEY)}` : "";

      const ids = await withRateLimitRetry(
        async () => {
          const searchRes = await fetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmode=json&retmax=3${apiKeyParam}`
          );
          if (searchRes.status === 429) {
            const err: any = new Error("PubMed API rate limit exceeded");
            err.status = 429;
            throw err;
          }
          if (!searchRes.ok) {
            throw new Error(`PubMed search error: HTTP ${searchRes.status}`);
          }
          const searchData = await searchRes.json();
          return searchData.esearchresult?.idlist || [];
        },
        { operationName: "pubmedTool:search", maxRetries: 2 }
      );

      if (!ids || ids.length === 0) return "No results found on PubMed.";

      const textData = await withRateLimitRetry(
        async () => {
          const fetchRes = await fetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(",")}&retmode=text&rettype=abstract${apiKeyParam}`
          );
          if (fetchRes.status === 429) {
            const err: any = new Error("PubMed API rate limit exceeded");
            err.status = 429;
            throw err;
          }
          if (!fetchRes.ok) {
            throw new Error(`PubMed fetch error: HTTP ${fetchRes.status}`);
          }
          return await fetchRes.text();
        },
        { operationName: "pubmedTool:fetchAbstracts", maxRetries: 2 }
      );

      return textData || "No abstracts available.";
    } catch (error) {
      console.warn("[pubmedTool] Search failed:", error);
      return `Error searching PubMed: ${error instanceof Error ? error.message : String(error)}`;
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
