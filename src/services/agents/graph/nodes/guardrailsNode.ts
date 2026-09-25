import { PublishAIState } from "../state";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { langfuseLangchainHandler } from "@/lib/langfuse";

export const guardrailsNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
  });

  const prompt = `You are a Guardrails AI checker for an academic journal. 
Your task is to review the following text for plagiarism, ethical concerns, or deviations from standard academic guidelines.
Return "PASS" if the text is completely fine.
If there are any issues, return a list of specific errors starting with "ERROR:".

Text to review:
${state.documentContent}
`;

  const response = await llm.invoke([new SystemMessage(prompt)], {
    callbacks: [langfuseLangchainHandler],
  });

  const output = response.content as string;
  const validationErrors = output.includes("PASS") ? [] : [output];

  return {
    validationErrors,
    messages: [new AIMessage(`Guardrails check: ${output}`)],
  };
};
