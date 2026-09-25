import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { langfuseLangchainHandler } from "@/lib/langfuse";
import { PublishAIState } from "../state";

export const clarificationNode = async (state: PublishAIState) => {
  const model = new ChatAnthropic({
    modelName: "claude-3-7-sonnet-20250219",
    temperature: 0,
  });

  const prompt = `You are an expert academic editor.
Analyze the academic text provided between <manuscript> tags and extract:
1. The main thesis / objective
2. The primary field of study
3. Any obvious missing sections (e.g., no Conclusion)

<manuscript>
${state.documentContent}
</manuscript>
`;

  const response = await model.invoke([
    new HumanMessage(prompt)
  ], {
    callbacks: [langfuseLangchainHandler],
  });

  const output = response.content as string;
  const tokensUsed = (response.response_metadata as any)?.usage?.total_tokens ?? 0;

  return {
    clarification: output,
    previousStageOutputs: new Map([["clarification", { output, status: "awaiting_approval", tokensUsed }]]),
    currentStage: "clarification"
  };
};
