import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { OJSAdapter } from '@/services/submission/adapters/ojs-adapter';
import { SubmissionPayload } from '@/services/submission/connection-types';
import { McpServerContext } from './types';
import { formatMcpError, formatMcpSuccess } from './utils';
import { OjsSubmissionSchema, OjsTestConnectionSchema } from './validation';
import { resolveOjsCredentials } from './connectionResolver';

export function createOjsMcpServer(context?: McpServerContext) {
  const server = new Server(
    {
      name: "publishai-ojs-mcp",
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
          name: "create_ojs_submission",
          description: "Create a manuscript submission or draft in Open Journal Systems (OJS) using an authorized saved connection or direct API credentials.",
          inputSchema: {
            type: "object",
            properties: {
              connectionId: {
                type: "number",
                description: "ID of an authorized saved OJS journal connection belonging to the current user",
              },
              siteUrl: {
                type: "string",
                description: "Target OJS base URL (required if connectionId is omitted)",
              },
              apiToken: {
                type: "string",
                description: "OJS REST API personal access token (required if connectionId is omitted)",
              },
              title: {
                type: "string",
                description: "Manuscript title",
              },
              abstract: {
                type: "string",
                description: "Manuscript abstract text",
              },
              authors: {
                type: "array",
                items: {
                  oneOf: [
                    { type: "string" },
                    {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        email: { type: "string" },
                        affiliation: { type: "string" },
                      },
                      required: ["name"],
                    },
                  ],
                },
                description: "List of authors (names or structured objects)",
              },
              keywords: {
                type: "array",
                items: { type: "string" },
                description: "Optional list of manuscript keywords",
              },
              locale: {
                type: "string",
                description: "Submission locale (default: 'en_US')",
              },
              sectionId: {
                type: "number",
                description: "Target journal section ID (default: 1)",
              },
              content: {
                type: "string",
                description: "Optional full paper text or notes",
              },
            },
            required: ["title", "abstract", "authors"],
          },
        },
        {
          name: "test_ojs_connection",
          description: "Test connectivity and authenticate with an Open Journal Systems (OJS) server.",
          inputSchema: {
            type: "object",
            properties: {
              connectionId: {
                type: "number",
                description: "ID of the saved journal connection to test",
              },
              siteUrl: {
                type: "string",
                description: "Target OJS base URL",
              },
              apiToken: {
                type: "string",
                description: "OJS REST API personal access token",
              },
            },
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      if (context?.requireAuth && !context.userId && !context.apiKey) {
        return formatMcpError("Unauthorized: Authentication is required to execute OJS MCP tools.");
      }

      if (request.params.name === "create_ojs_submission") {
        const parseResult = OjsSubmissionSchema.safeParse(request.params.arguments || {});
        if (!parseResult.success) {
          const issueMsg = parseResult.error.issues.map((i) => i.message).join("; ");
          return formatMcpError(`Invalid parameters for 'create_ojs_submission': ${issueMsg}`);
        }

        const data = parseResult.data;

        // Resolve credentials and enforce authorization & SSRF defense
        const credentials = await resolveOjsCredentials(
          {
            connectionId: data.connectionId,
            siteUrl: data.siteUrl,
            apiToken: data.apiToken,
          },
          context
        );

        // Normalize authors into structured format
        const normalizedAuthors = data.authors.map((author) => {
          if (typeof author === "string") {
            return { name: author.trim(), email: "", affiliation: "" };
          }
          return {
            name: author.name.trim(),
            email: author.email || "",
            affiliation: author.affiliation || "",
          };
        });

        const payload: SubmissionPayload = {
          title: data.title,
          abstract: data.abstract,
          content: data.content || data.abstract,
          keywords: data.keywords || [],
          authors: normalizedAuthors,
          articleType: "Article",
          publishMode: "draft",
          attachments: [],
        };

        const adapter = new OJSAdapter(credentials.siteUrl, credentials.apiToken);
        const result = await adapter.submit(payload);

        if (!result.success) {
          return formatMcpError(result.error || "Failed to create OJS submission.");
        }

        return formatMcpSuccess({
          success: true,
          message: "OJS submission created successfully",
          submissionId: result.postId,
          confirmationId: result.confirmationId,
          details: result.rawResponse,
        });
      }

      if (request.params.name === "test_ojs_connection") {
        const parseResult = OjsTestConnectionSchema.safeParse(request.params.arguments || {});
        if (!parseResult.success) {
          const issueMsg = parseResult.error.issues.map((i) => i.message).join("; ");
          return formatMcpError(`Invalid parameters for 'test_ojs_connection': ${issueMsg}`);
        }

        const data = parseResult.data;
        const credentials = await resolveOjsCredentials(
          {
            connectionId: data.connectionId,
            siteUrl: data.siteUrl,
            apiToken: data.apiToken,
          },
          context
        );

        const adapter = new OJSAdapter(credentials.siteUrl, credentials.apiToken);
        const testResult = await adapter.testConnection();

        if (!testResult.success) {
          return formatMcpError(`OJS Connection Test Failed: ${testResult.message}`);
        }

        return formatMcpSuccess(testResult);
      }

      return formatMcpError(
        `Tool not found: '${request.params.name}'. Supported tools: 'create_ojs_submission', 'test_ojs_connection'.`
      );
    } catch (error: any) {
      return formatMcpError(error, "Failed to execute OJS tool");
    }
  });

  return server;
}

export const server = createOjsMcpServer();
