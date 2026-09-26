import Anthropic from "@anthropic-ai/sdk";

export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "dummy-key-for-initialization",
  dangerouslyAllowBrowser: true,
});

export type ClaudeModel =
  | "claude-3-opus-20240229"
  | "claude-3-7-sonnet-20250219"
  | "claude-3-5-sonnet-20241022"
  | (string & {});

export interface AskClaudeOptions {
  maxTokens?: number;
  temperature?: number;
  system?: string;
}

export async function askClaude(
  prompt: string, 
  model: ClaudeModel = "claude-3-7-sonnet-20250219",
  systemOrOptions?: string | AskClaudeOptions
): Promise<{ text: string; tokensUsed: number }> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("[claude-client] ANTHROPIC_API_KEY is not set. API request may fail.");
    }

    const options: AskClaudeOptions = typeof systemOrOptions === "string" 
      ? { system: systemOrOptions } 
      : (systemOrOptions || {});

    const max_tokens = options.maxTokens ?? (typeof model === "string" && model.includes("opus") ? 4096 : 8192);

    const msg = await claude.messages.create({
      model,
      max_tokens,
      system: options.system,
      temperature: options.temperature,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = msg.content.find(
      (c): c is Anthropic.TextBlock => c.type === "text"
    );
    const text = textBlock?.text || "";
    
    return {
      text,
      tokensUsed: (msg.usage?.input_tokens ?? 0) + (msg.usage?.output_tokens ?? 0),
    };
  } catch (error) {
    console.error("Claude API Error:", error);
    throw error;
  }
}
