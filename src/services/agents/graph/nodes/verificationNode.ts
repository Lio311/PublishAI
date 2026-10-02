import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { PublishAIState } from "../state";
import { langfuseLangchainHandler } from "@/lib/langfuse";
import { ANTHROPIC_MODELS } from "@/services/ai/modelIds";
import { errorMessage } from "@/services/utils/errors";
import { messageText } from "../messageUtils";

export const verificationNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const model = new ChatAnthropic({
    modelName: ANTHROPIC_MODELS.standard,
    callbacks: [langfuseLangchainHandler],
  });

  const prompt = `Generate a simulated peer-review report for this final manuscript provided between <manuscript> tags.\n\n<manuscript>\n${state.documentContent || "No manuscript content provided."}\n</manuscript>`;

  try {
    const response = await model.invoke([new HumanMessage(prompt)]);
    const output = messageText(response.content);

    return {
      verification: {
        output,
        status: "completed",
      },
      currentStage: "verification"
    };
  } catch (error) {
    console.error("[verificationNode] Execution failed:", error);
    return {
      verification: {
        output: `Verification report failed: ${errorMessage(error) || "Unknown error"}`,
        status: "failed",
      },
      currentStage: "verification"
    };
  }
};
