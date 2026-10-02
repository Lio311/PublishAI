import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { langfuseLangchainHandler } from "@/lib/langfuse";
import { PublishAIState } from "../state";
import { AgentResult } from "../../base-agent";
import { ANTHROPIC_MODELS } from "@/services/ai/modelIds";
import { errorMessage } from "@/services/utils/errors";
import { messageText, totalTokens } from "../messageUtils";

export const scientificReviewNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const modelName = ANTHROPIC_MODELS.reasoning;
  const model = new ChatAnthropic({
    modelName,
  });

  const prompt = `Perform a rigorous peer review on the manuscript provided between <manuscript> tags. Highlight logical flaws, methodological issues, and unsubstantiated claims.\n\n<manuscript>\n${state.documentContent || "No manuscript content provided."}\n</manuscript>`;
  
  try {
    const response = await model.invoke([
      new HumanMessage(prompt)
    ], {
      callbacks: [langfuseLangchainHandler],
    });

    const output = messageText(response.content);
    const tokensUsed = totalTokens(response);

    const result: AgentResult = {
      stage: "scientific_review",
      model: modelName,
      output,
      status: "awaiting_approval",
      tokensUsed,
    };

    return {
      scientificReview: output,
      previousStageOutputs: new Map([["scientific_review", result]]),
      currentStage: "scientific_review"
    };
  } catch (error) {
    console.error("[scientificReviewNode] Execution failed:", error);
    const fallbackOutput = `Scientific review could not be completed: ${errorMessage(error) || "Unknown error"}`;
    return {
      scientificReview: fallbackOutput,
      validationErrors: [`Scientific review failed: ${errorMessage(error) || "Unknown error"}`],
      currentStage: "scientific_review"
    };
  }
};
