import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { PublishAIState } from "../state";
import { langfuseLangchainHandler } from "@/lib/langfuse";
import { ANTHROPIC_MODELS } from "@/services/ai/modelIds";
import { errorMessage } from "@/services/utils/errors";
import { messageText } from "../messageUtils";

export const qaNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const model = new ChatAnthropic({
    modelName: ANTHROPIC_MODELS.standard,
    callbacks: [langfuseLangchainHandler],
  });

  const prompt = `Check the academic text provided between <manuscript> tags for spelling errors, inconsistency, and unreferenced figures/tables.\n\n<manuscript>\n${state.documentContent || "No manuscript content provided."}\n</manuscript>`;

  try {
    const response = await model.invoke([new HumanMessage(prompt)]);
    const output = messageText(response.content);

    return {
      qa: {
        output,
        status: "completed",
      },
      currentStage: "qa"
    };
  } catch (error) {
    console.error("[qaNode] Execution failed:", error);
    return {
      qa: {
        output: `QA check failed: ${errorMessage(error) || "Unknown error"}`,
        status: "failed",
      },
      currentStage: "qa"
    };
  }
};
