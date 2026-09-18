import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { literatureService, CrossrefClient } from '@/services/literature/literatureService';

const server = new Server(
  {
    name: "publishai-literature-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const crossrefClient = new CrossrefClient();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_literature",
        description: "Search PubMed and Crossref for literature based on a query.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query, keywords, or title",
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return (default: 5)",
            }
          },
          required: ["query"],
        },
      },
      {
        name: "get_citation_by_doi",
        description: "Fetch a specific citation by DOI",
        inputSchema: {
          type: "object",
          properties: {
            doi: {
              type: "string",
              description: "The DOI of the article",
            },
          },
          required: ["doi"],
        },
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "search_literature") {
    const query = request.params.arguments?.query as string;
    const limit = request.params.arguments?.limit as number | undefined;
    
    if (!query) {
      throw new Error("Query is required");
    }

    try {
      const results = await literatureService.search(query, { limit });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    } catch (error: any) {
       return {
         content: [{ type: "text", text: `Error: ${error.message}`}],
         isError: true,
       }
    }
  }

  if (request.params.name === "get_citation_by_doi") {
    const doi = request.params.arguments?.doi as string;
    
    if (!doi) {
      throw new Error("DOI is required");
    }

    try {
      const result = await crossrefClient.getByDoi(doi);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
         content: [{ type: "text", text: `Error: ${error.message}`}],
         isError: true,
      }
    }
  }

  throw new Error(`Tool not found: ${request.params.name}`);
});

export { server };
