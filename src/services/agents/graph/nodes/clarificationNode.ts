import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { langfuseLangchainHandler } from "@/lib/langfuse";
import { PublishAIState } from "../state";
import { AgentResult } from "../../base-agent";

export const clarificationNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const modelName = "claude-3-7-sonnet-20250219";
  const model = new ChatAnthropic({
    modelName,
    temperature: 0,
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

    const output = typeof response.content === "string" 
      ? response.content 
      : (Array.isArray(response.content) ? response.content.map(c => typeof c === "string" ? c : (c as any).text || "").join("") : String(response.content));
    const tokensUsed = (response.response_metadata as any)?.usage?.total_tokens ?? 0;

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
  } catch (error: any) {
    console.error("[clarificationNode] Failed to analyze manuscript:", error);
    const fallbackOutput = `Clarification analysis failed: ${error?.message || "Unknown error"}`;
    return {
      clarification: fallbackOutput,
      validationErrors: [`Clarification failed: ${error?.message || "Unknown error"}`],
      currentStage: "clarification"
    };
  }
};
