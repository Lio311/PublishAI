import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { langfuseLangchainHandler } from "@/lib/langfuse";
import { PublishAIState } from "../state";
import { AgentResult } from "../../base-agent";

export const scientificReviewNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const modelName = "claude-3-opus-20240229";
  const model = new ChatAnthropic({
    modelName,
    temperature: 0,
  });

  const prompt = `Perform a rigorous peer review on the manuscript provided between <manuscript> tags. Highlight logical flaws, methodological issues, and unsubstantiated claims.\n\n<manuscript>\n${state.documentContent || "No manuscript content provided."}\n</manuscript>`;
  
  try {
    const response = await model.invoke([
      new HumanMessage(prompt)
    ], {
      callbacks: [langfuseLangchainHandler],
    });

    const output = typeof response.content === "string" 
      ? response.content 
      : (Array.isArray(response.content) ? response.content.map(c => typeof c === "string" ? c : (c as any).text || "").join("") : String(response.content));
    const tokensUsed = (response.response_metadata as any)?.usage?.total_tokens ?? 0;

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
  } catch (error: any) {
    console.error("[scientificReviewNode] Execution failed:", error);
    const fallbackOutput = `Scientific review could not be completed: ${error?.message || "Unknown error"}`;
    return {
      scientificReview: fallbackOutput,
      validationErrors: [`Scientific review failed: ${error?.message || "Unknown error"}`],
      currentStage: "scientific_review"
    };
  }
};
