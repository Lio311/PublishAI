import { PublishAIState } from "../state";
import { SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { langfuseLangchainHandler } from "@/lib/langfuse";

export const knowledgeNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.1,
  });

  const prompt = `You are a Knowledge Agent. Retrieve necessary academic context and facts to support the writing plan.
User Memory Context:
${state.memoryContext}
`;

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
