import { PublishAIState } from "../state";
import { AIMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { langfuseLangchainHandler } from "@/lib/langfuse";

export const guardrailsNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  // We can use an LLM or an external Guardrails service here.
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
  });

  const prompt = `You are a Guardrails AI. Check the following content for plagiarism or deviation from academic guidelines:
  
Content:
${state.documentContent}

Respond with exactly "PASS" if it looks fine, or list the errors if it fails.`;

  const response = await llm.invoke(prompt, {
    callbacks: [langfuseLangchainHandler],
  });

  const output = response.content as string;
  const validationErrors = output.trim() === "PASS" ? [] : [output];

  return {
    validationErrors,
    messages: [new AIMessage(`Guardrails check: ${output}`)],
  };
};
