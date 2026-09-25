import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { PublishAIState } from "../state";
import { langfuseLangchainHandler } from "@/lib/langfuse";

export const qaNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const model = new ChatAnthropic({
    modelName: "claude-3-7-sonnet-20250219",
    callbacks: [langfuseLangchainHandler],
  });

  const prompt = `Check the academic text provided between <manuscript> tags for spelling errors, inconsistency, and unreferenced figures/tables.\n\n<manuscript>\n${state.documentContent}\n</manuscript>`;

  const response = await model.invoke([new HumanMessage(prompt)]);

  return {
    qa: {
      output: response.content,
      status: "completed",
    },
  };
};
