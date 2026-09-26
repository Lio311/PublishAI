export interface McpServerContext {
  userId?: string;
  requireAuth?: boolean;
  apiKey?: string;
  allowedConnectionIds?: number[];
}

export interface McpTextContent {
  type: "text";
  text: string;
  [key: string]: unknown;
}

export interface McpToolResult {
  content: McpTextContent[];
  isError?: boolean;
}
