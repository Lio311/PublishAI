/** Plain text of a LangChain message's content (a string or an array of content parts). */
export function messageText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : typeof part?.text === "string" ? part.text : ""))
      .join("");
  }
  return content == null ? "" : String(content);
}

/**
 * Total tokens of a chat-model response. LangChain normalizes usage into
 * `usage_metadata`; provider `response_metadata` shapes differ (Anthropic has no total).
 */
export function totalTokens(response: { usage_metadata?: { total_tokens?: number } }): number {
  return response.usage_metadata?.total_tokens ?? 0;
}
