import { PublishAIState } from "../state";
import { SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { langfuseLangchainHandler } from "@/lib/langfuse";

export const planningNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.2,
  });

  const prompt = `You are a Planning Agent for an academic writing tool.
User Memory Context:
${state.memoryContext}

Based on the latest user request, create a detailed plan.`;

  const messages = [
    new SystemMessage(prompt),
    ...state.messages,
  ];

  const response = await llm.invoke(messages, {
    callbacks: [langfuseLangchainHandler],
  });

  return {
    messages: [response],
  };
};
