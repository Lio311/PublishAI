import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { PublishAIState } from "../state";
import { langfuseLangchainHandler } from "@/lib/langfuse";

export const qaNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const model = new ChatAnthropic({
    modelName: "claude-3-7-sonnet-20250219",
    callbacks: [langfuseLangchainHandler],
  });

  const prompt = `Check the academic text provided between <manuscript> tags for spelling errors, inconsistency, and unreferenced figures/tables.\n\n<manuscript>\n${state.documentContent || "No manuscript content provided."}\n</manuscript>`;

  try {
    const response = await model.invoke([new HumanMessage(prompt)]);
    const output = typeof response.content === "string" 
      ? response.content 
      : (Array.isArray(response.content) ? response.content.map(c => typeof c === "string" ? c : (c as any).text || "").join("") : String(response.content));

    return {
      qa: {
        output,
        status: "completed",
      },
      currentStage: "qa"
    };
  } catch (error: any) {
    console.error("[qaNode] Execution failed:", error);
    return {
      qa: {
        output: `QA check failed: ${error?.message || "Unknown error"}`,
        status: "failed",
      },
      currentStage: "qa"
    };
  }
};
