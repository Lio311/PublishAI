import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { PublishAIState } from "../state";
import { langfuseLangchainHandler } from "@/lib/langfuse";

export const verificationNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const model = new ChatAnthropic({
    modelName: "claude-3-7-sonnet-20250219",
    callbacks: [langfuseLangchainHandler],
  });

  const prompt = `Generate a simulated peer-review report for this final manuscript provided between <manuscript> tags.\n\n<manuscript>\n${state.documentContent}\n</manuscript>`;

  const response = await model.invoke([new HumanMessage(prompt)]);

  return {
    verification: {
      output: response.content,
      status: "completed",
    },
  };
};
