import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { PublishAIState } from "../state";
import { langfuseLangchainHandler } from "@/lib/langfuse";

export const draftNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const model = new ChatAnthropic({
    modelName: "claude-3-opus-20240229",
    callbacks: [langfuseLangchainHandler],
  });

  const review = state.scientificReview?.output || "";
  const prompt = `Rewrite the text to elevate the academic tone, address the following review feedback, and remove any generic AI-sounding phrases.\n\nReview:\n${review}\n\nManuscript provided between <manuscript> tags:\n<manuscript>\n${state.documentContent}\n</manuscript>`;

  const response = await model.invoke([new HumanMessage(prompt)]);

  return {
    draft: {
      output: response.content,
      status: "completed",
    },
  };
};
