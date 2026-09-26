import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { WordPressAdapter } from '@/services/submission/adapters/wordpress-adapter';
import { SubmissionPayload } from '@/services/submission/connection-types';
import { McpServerContext } from './types';
import { formatMcpError, formatMcpSuccess } from './utils';
import { WordPressDraftSchema, WordPressTestConnectionSchema } from './validation';
import { resolveWordPressCredentials } from './connectionResolver';

export function createWordpressMcpServer(context?: McpServerContext) {
  const server = new Server(
    {
      name: "publishai-wordpress-mcp",
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
          name: "create_wp_draft",
          description: "Create a draft post or published article in WordPress using an authorized saved journal connection or direct credentials.",
          inputSchema: {
            type: "object",
            properties: {
              connectionId: {
                type: "number",
                description: "ID of an authorized saved WordPress connection belonging to the current user",
              },
              siteUrl: {
                type: "string",
                description: "Target WordPress base URL (required if connectionId is omitted)",
              },
              username: {
                type: "string",
                description: "WordPress username (required if connectionId is omitted)",
              },
              appPassword: {
                type: "string",
                description: "WordPress Application Password (required if connectionId is omitted)",
              },
              title: {
                type: "string",
                description: "Post title",
              },
              content: {
                type: "string",
                description: "Post HTML or markdown content",
              },
              excerpt: {
                type: "string",
                description: "Optional post excerpt or abstract",
              },
              status: {
                type: "string",
                enum: ["draft", "publish"],
                description: "Publish status (default: 'draft')",
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
                description: "Optional author list",
              },
              keywords: {
                type: "array",
                items: { type: "string" },
                description: "Optional post tags/keywords",
              },
              coverLetter: {
                type: "string",
                description: "Optional cover letter or editorial notes",
              },
            },
            required: ["title", "content"],
          },
        },
        {
          name: "test_wp_connection",
          description: "Test connectivity and authenticate with a WordPress REST API server.",
          inputSchema: {
            type: "object",
            properties: {
              connectionId: {
                type: "number",
                description: "ID of the saved WordPress connection to test",
              },
              siteUrl: {
                type: "string",
                description: "Target WordPress base URL",
              },
              username: {
                type: "string",
                description: "WordPress username",
              },
              appPassword: {
                type: "string",
                description: "WordPress Application Password",
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
        return formatMcpError("Unauthorized: Authentication is required to execute WordPress MCP tools.");
      }

      if (request.params.name === "create_wp_draft") {
        const parseResult = WordPressDraftSchema.safeParse(request.params.arguments || {});
        if (!parseResult.success) {
          const issueMsg = parseResult.error.issues.map((i) => i.message).join("; ");
          return formatMcpError(`Invalid parameters for 'create_wp_draft': ${issueMsg}`);
        }

        const data = parseResult.data;

        // Resolve credentials and enforce authorization & SSRF defense
        const credentials = await resolveWordPressCredentials(
          {
            connectionId: data.connectionId,
            siteUrl: data.siteUrl,
            username: data.username,
            appPassword: data.appPassword,
          },
          context
        );

        // Normalize authors into structured format
        const normalizedAuthors = (data.authors || []).map((author) => {
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
          abstract: data.excerpt || "",
          content: data.content,
          keywords: data.keywords || [],
          authors: normalizedAuthors,
          articleType: "Article",
          publishMode: data.status,
          coverLetter: data.coverLetter,
          attachments: [],
        };

        const adapter = new WordPressAdapter(
          credentials.siteUrl,
          credentials.username,
          credentials.appPassword
        );
        const result = await adapter.submit(payload);

        if (!result.success) {
          return formatMcpError(result.error || "Failed to create WordPress post.");
        }

        return formatMcpSuccess({
          success: true,
          message: "WordPress draft created successfully",
          postId: result.postId,
          postUrl: result.postUrl,
          confirmationId: result.confirmationId,
          details: result.rawResponse,
        });
      }

      if (request.params.name === "test_wp_connection") {
        const parseResult = WordPressTestConnectionSchema.safeParse(request.params.arguments || {});
        if (!parseResult.success) {
          const issueMsg = parseResult.error.issues.map((i) => i.message).join("; ");
          return formatMcpError(`Invalid parameters for 'test_wp_connection': ${issueMsg}`);
        }

        const data = parseResult.data;
        const credentials = await resolveWordPressCredentials(
          {
            connectionId: data.connectionId,
            siteUrl: data.siteUrl,
            username: data.username,
            appPassword: data.appPassword,
          },
          context
        );

        const adapter = new WordPressAdapter(
          credentials.siteUrl,
          credentials.username,
          credentials.appPassword
        );
        const testResult = await adapter.testConnection();

        if (!testResult.success) {
          return formatMcpError(`WordPress Connection Test Failed: ${testResult.message}`);
        }

        return formatMcpSuccess(testResult);
      }

      return formatMcpError(
        `Tool not found: '${request.params.name}'. Supported tools: 'create_wp_draft', 'test_wp_connection'.`
      );
    } catch (error: any) {
      return formatMcpError(error, "Failed to execute WordPress tool");
    }
  });

  return server;
}

export const server = createWordpressMcpServer();
