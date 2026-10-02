import Anthropic from "@anthropic-ai/sdk";
import { ANTHROPIC_MODELS, claudeAcceptsSamplingParams } from "@/services/ai/modelIds";

const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
if (!anthropicApiKey && process.env.NODE_ENV === "production") {
  console.warn("[claude-client] ANTHROPIC_API_KEY is not configured in production.");
}

export const claude = new Anthropic({
  apiKey: anthropicApiKey || "placeholder-key-for-dev",
  dangerouslyAllowBrowser: process.env.NODE_ENV === "test",
});

export type ClaudeModel = string;

export interface AskClaudeOptions {
  maxTokens?: number;
  temperature?: number;
  system?: string;
}

export async function askClaude(
  prompt: string, 
  model: ClaudeModel = ANTHROPIC_MODELS.standard,
  systemOrOptions?: string | AskClaudeOptions
): Promise<{ text: string; tokensUsed: number }> {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn("[claude-client] ANTHROPIC_API_KEY is not set. API request may fail.");
    }

    const options: AskClaudeOptions = typeof systemOrOptions === "string" 
      ? { system: systemOrOptions } 
      : (systemOrOptions || {});

    // Agents return whole manuscripts, so allow long outputs; streaming avoids HTTP timeouts.
    const max_tokens = options.maxTokens ?? 64000;
    const usesServerFallbacks = /claude-(opus-5-5|sonnet-5-5)/.test(model);

    const msg = await claude.beta.messages
      .stream({
        model,
        max_tokens,
        system: options.system,
        ...(options.temperature !== undefined && claudeAcceptsSamplingParams(model)
          ? { temperature: options.temperature }
          : {}),
        // On a safety-classifier decline, retry on a fallback model instead of failing the stage.
        ...(usesServerFallbacks ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
        messages: [{ role: "user", content: prompt }],
      })
      .finalMessage();

    if (msg.stop_reason === "refusal") {
      throw new Error(`Claude declined the request (${msg.stop_details?.category ?? "unspecified"})`);
    }
    if (msg.stop_reason === "max_tokens") {
      console.warn(`[claude-client] Output truncated at max_tokens=${max_tokens} (model ${model}).`);
    }

    const text = msg.content
      .filter((c): c is Anthropic.Beta.BetaTextBlock => c.type === "text")
      .map((c) => c.text)
      .join("");
    
    return {
      text,
      tokensUsed: (msg.usage?.input_tokens ?? 0) + (msg.usage?.output_tokens ?? 0),
    };
  } catch (error) {
    console.error("Claude API Error:", error);
    throw error;
  }
}
