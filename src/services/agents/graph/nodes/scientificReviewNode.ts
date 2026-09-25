import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { langfuseLangchainHandler } from "@/lib/langfuse";
import { PublishAIState } from "../state";

export const scientificReviewNode = async (state: PublishAIState) => {
  const model = new ChatAnthropic({
    modelName: "claude-3-opus-20240229",
    temperature: 0,
  });

  const prompt = `Perform a rigorous peer review on the manuscript provided between <manuscript> tags. Highlight logical flaws, methodological issues, and unsubstantiated claims.\n\n<manuscript>\n${state.documentContent}\n</manuscript>`;
  
  const response = await model.invoke([
    new HumanMessage(prompt)
  ], {
    callbacks: [langfuseLangchainHandler],
  });

  const output = response.content as string;
  const tokensUsed = (response.response_metadata as any)?.usage?.total_tokens ?? 0;

  return {
    scientificReview: output,
    previousStageOutputs: new Map([["scientific_review", { output, status: "awaiting_approval", tokensUsed }]]),
    currentStage: "scientific_review"
  };
};
