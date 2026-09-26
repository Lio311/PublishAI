import { askClaude } from "@/services/agents/claude-client";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { Stage } from "@/services/agents/base-agent";

export interface AIRoutePayload {
  prompt: string;
  system?: string;
}

export interface AIRouteResult {
  modelUsed: string;
  output: string;
  tokensUsed: number;
}

export async function routeAIRequest(
  taskType: Stage | string,
  payload: AIRoutePayload
): Promise<AIRouteResult> {
  try {
    if (taskType === "scientific_review" || taskType === "writing") {
      const { text, tokensUsed } = await askClaude(
        payload.prompt,
        "claude-3-opus-20240229",
        payload.system
      );
      return {
        modelUsed: "claude-3-opus-20240229",
        output: text,
        tokensUsed,
      };
    } else if (
      ["clarification", "qa", "verification", "compilation", "cover_letter"].includes(
        taskType
      )
    ) {
      const { text, tokensUsed } = await askClaude(
        payload.prompt,
        "claude-3-7-sonnet-20250219",
        payload.system
      );
      return {
        modelUsed: "claude-3-7-sonnet-20250219",
        output: text,
        tokensUsed,
      };
    } else {
      const { text, usage } = await generateText({
        model: openai("gpt-4o"),
        prompt: payload.prompt,
        system: payload.system,
      });
      return {
        modelUsed: "gpt-4o",
        output: text,
        tokensUsed: usage?.totalTokens ?? 0,
      };
    }
  } catch (error) {
    console.error(`AI Routing error for task ${taskType}:`, error);
    throw error;
  }
}
