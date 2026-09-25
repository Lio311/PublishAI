import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const arxivTool = tool(
  async ({ query }: { query: string }) => {
    try {
      const response = await fetch(`http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&max_results=3`);
      if (!response.ok) {
        return "Failed to fetch from arXiv API";
      }
      const data = await response.text();
      
      const entries = data.split('<entry>').slice(1);
      const results = entries.map(entry => {
        const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
        const summaryMatch = entry.match(/<summary>([\s\S]*?)<\/summary>/);
        const title = titleMatch ? titleMatch[1].trim() : "No Title";
        const summary = summaryMatch ? summaryMatch[1].trim() : "No Summary";
        return `Title: ${title}\nSummary: ${summary}`;
      });
      
      return results.join('\n\n---\n\n') || "No results found.";
    } catch (error) {
      return `Error searching arXiv: ${error}`;
    }
  },
  {
    name: "arxiv_search",
    description: "Search arXiv for academic papers and get abstracts",
    schema: z.object({
      query: z.string().describe("The search query for arXiv"),
    }),
  }
);
