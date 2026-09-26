import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { literatureService } from '@/services/literature/literatureService';
import { McpServerContext } from './types';
import { formatMcpError, formatMcpSuccess } from './utils';
import { CitationByDoiSchema, LiteratureSearchSchema } from './validation';

export function createLiteratureMcpServer(context?: McpServerContext) {
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

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "search_literature",
          description: "Search PubMed, Crossref, and Semantic Scholar for literature based on a query.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query, keywords, or title",
              },
              limit: {
                type: "number",
                description: "Maximum number of results to return (1-50, default: 5)",
              },
              offset: {
                type: "number",
                description: "Offset index for pagination (default: 0)",
              },
              sources: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["pubmed", "crossref", "semanticscholar"],
                },
                description: "Sources to search. Defaults to all.",
              },
            },
            required: ["query"],
          },
        },
        {
          name: "get_citation_by_doi",
          description: "Fetch a specific citation and paper metadata by DOI.",
          inputSchema: {
            type: "object",
            properties: {
              doi: {
                type: "string",
                description: "The DOI of the article (e.g., '10.1038/s41586-020-2649-2')",
              },
            },
            required: ["doi"],
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      if (context?.requireAuth && !context.userId && !context.apiKey) {
        return formatMcpError("Unauthorized: Authentication is required to execute literature MCP tools.");
      }

      if (request.params.name === "search_literature") {
        const parseResult = LiteratureSearchSchema.safeParse(request.params.arguments || {});
        if (!parseResult.success) {
          const issueMsg = parseResult.error.issues.map((i) => i.message).join("; ");
          return formatMcpError(`Invalid parameters for 'search_literature': ${issueMsg}`);
        }

        const { query, limit, offset, sources } = parseResult.data;
        const results = await literatureService.search(query, {
          limit,
          offset,
          sources: sources as ("pubmed" | "crossref" | "semanticscholar")[],
        });

        return formatMcpSuccess(results);
      }

      if (request.params.name === "get_citation_by_doi") {
        const parseResult = CitationByDoiSchema.safeParse(request.params.arguments || {});
        if (!parseResult.success) {
          const issueMsg = parseResult.error.issues.map((i) => i.message).join("; ");
          return formatMcpError(`Invalid parameters for 'get_citation_by_doi': ${issueMsg}`);
        }

        const { doi } = parseResult.data;
        const result = await literatureService.getByDoi(doi);
        return formatMcpSuccess(result);
      }

      return formatMcpError(
        `Tool not found: '${request.params.name}'. Supported tools: 'search_literature', 'get_citation_by_doi'.`
      );
    } catch (error: unknown) {
      return formatMcpError(error, "Failed to execute literature tool");
    }
  });

  return server;
}

export const server = createLiteratureMcpServer();
