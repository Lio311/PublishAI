import Anthropic from "@anthropic-ai/sdk";

export const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

export type ClaudeModel = "claude-3-opus-20240229" | "claude-3-7-sonnet-20250219" | "claude-3-5-sonnet-20241022";

export async function askClaude(
  prompt: string, 
  model: ClaudeModel = "claude-3-7-sonnet-20250219",
  system?: string
): Promise<{ text: string; tokensUsed: number }> {
  try {
    const msg = await claude.messages.create({
      model,
      max_tokens: 8192,
      system,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = msg.content.find(
      (c): c is Anthropic.TextBlock => c.type === "text"
    );
    const text = textBlock?.text || "";
    
    return {
      text,
      tokensUsed: msg.usage.input_tokens + msg.usage.output_tokens,
    };
  } catch (error) {
    console.error("Claude API Error:", error);
    throw error;
  }
}
