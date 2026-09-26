import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { withRateLimitRetry, withTimeout } from "../rateLimiter";
import { sanitizePromptInput, redactApiKeys } from "../promptSanitizer";

export const pubmedTool = tool(
  async ({ query }: { query: string }) => {
    try {
      const sanitizedQuery = sanitizePromptInput(query).slice(0, 200);
      if (!sanitizedQuery) return "Empty search query provided.";

      const apiKey = process.env.NCBI_API_KEY;
      const apiKeyParam = apiKey ? `&api_key=${encodeURIComponent(apiKey)}` : "";
      const timeoutMs = 8000;

      const ids = await withRateLimitRetry(
        async () => {
          return withTimeout(
            (async () => {
              const searchRes = await fetch(
                `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
                  sanitizedQuery
                )}&retmode=json&retmax=3${apiKeyParam}`
              );
              if (searchRes.status === 429) {
                const err: any = new Error("PubMed API rate limit exceeded (429)");
                err.status = 429;
                throw err;
              }
              if (!searchRes.ok) {
                throw new Error(`PubMed search error: HTTP ${searchRes.status}`);
              }
              const searchData = await searchRes.json();
              return searchData.esearchresult?.idlist || [];
            })(),
            timeoutMs,
            "PubMed esearch"
          );
        },
        { operationName: "pubmedTool:search", maxRetries: 2 }
      );

      if (!ids || ids.length === 0) return "No results found on PubMed.";

      const textData = await withRateLimitRetry(
        async () => {
          return withTimeout(
            (async () => {
              const fetchRes = await fetch(
                `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(
                  ","
                )}&retmode=text&rettype=abstract${apiKeyParam}`
              );
              if (fetchRes.status === 429) {
                const err: any = new Error("PubMed API rate limit exceeded (429)");
                err.status = 429;
                throw err;
              }
              if (!fetchRes.ok) {
                throw new Error(`PubMed fetch error: HTTP ${fetchRes.status}`);
              }
              return await fetchRes.text();
            })(),
            timeoutMs,
            "PubMed efetch"
          );
        },
        { operationName: "pubmedTool:fetchAbstracts", maxRetries: 2 }
      );

      // Sanitize abstracts to defend against indirect prompt injection in PubMed results
      return sanitizePromptInput(textData) || "No abstracts available.";
    } catch (error) {
      const safeErrMsg = redactApiKeys(error instanceof Error ? error.message : String(error));
      console.warn("[pubmedTool] Search failed:", safeErrMsg);
      return `Error searching PubMed: ${safeErrMsg}`;
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
