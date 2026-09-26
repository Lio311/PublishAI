import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export interface McpServerContext {
  userId?: string;
  requireAuth?: boolean;
  apiKey?: string;
  allowedConnectionIds?: number[];
}

export type McpToolResult = CallToolResult;
