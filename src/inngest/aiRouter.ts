import { askClaude } from "@/services/agents/claude-client";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { Stage } from "@/services/agents/base-agent";
import { ANTHROPIC_MODELS, OPENAI_MODELS } from "@/services/ai/modelIds";

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
        ANTHROPIC_MODELS.reasoning,
        payload.system
      );
      return {
        modelUsed: ANTHROPIC_MODELS.reasoning,
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
        ANTHROPIC_MODELS.standard,
        payload.system
      );
      return {
        modelUsed: ANTHROPIC_MODELS.standard,
        output: text,
        tokensUsed,
      };
    } else {
      const { text, usage } = await generateText({
        model: openai(OPENAI_MODELS.standard),
        prompt: payload.prompt,
        system: payload.system,
      });
      return {
        modelUsed: OPENAI_MODELS.standard,
        output: text,
        tokensUsed: usage?.totalTokens ?? 0,
      };
    }
  } catch (error) {
    console.error(`AI Routing error for task ${taskType}:`, error);
    throw error;
  }
}
