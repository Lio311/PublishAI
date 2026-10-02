import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { langfuseLangchainHandler } from "@/lib/langfuse";
import { PublishAIState } from "../state";
import { AgentResult } from "../../base-agent";
import { ANTHROPIC_MODELS } from "@/services/ai/modelIds";
import { errorMessage } from "@/services/utils/errors";
import { messageText, totalTokens } from "../messageUtils";

export const clarificationNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const modelName = ANTHROPIC_MODELS.standard;
  const model = new ChatAnthropic({
    modelName,
  });

  const content = state.documentContent || "No manuscript content provided.";
  const prompt = `You are an expert academic editor.
Analyze the academic text provided between <manuscript> tags and extract:
1. The main thesis / objective
2. The primary field of study
3. Any obvious missing sections (e.g., no Conclusion)

<manuscript>
${content}
</manuscript>
`;

  try {
    const response = await model.invoke([
      new HumanMessage(prompt)
    ], {
      callbacks: [langfuseLangchainHandler],
    });

    const output = messageText(response.content);
    const tokensUsed = totalTokens(response);

    const result: AgentResult = {
      stage: "clarification",
      model: modelName,
      output,
      status: "awaiting_approval",
      tokensUsed,
    };

    return {
      clarification: output,
      previousStageOutputs: new Map([["clarification", result]]),
      currentStage: "clarification"
    };
  } catch (error) {
    console.error("[clarificationNode] Failed to analyze manuscript:", error);
    const fallbackOutput = `Clarification analysis failed: ${errorMessage(error) || "Unknown error"}`;
    return {
      clarification: fallbackOutput,
      validationErrors: [`Clarification failed: ${errorMessage(error) || "Unknown error"}`],
      currentStage: "clarification"
    };
  }
};
