import { PublishAIState } from "../state";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { langfuseLangchainHandler } from "@/lib/langfuse";
import { OPENAI_MODELS } from "@/services/ai/modelIds";
import { errorMessage } from "@/services/utils/errors";
import { messageText } from "../messageUtils";

export const guardrailsNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const llm = new ChatOpenAI({
    modelName: OPENAI_MODELS.mini,
    temperature: 0,
  });

  const content = state.documentContent || "No manuscript content available.";
  const prompt = `You are a Guardrails AI checker for an academic journal. 
Your task is to review the following text for plagiarism, ethical concerns, or deviations from standard academic guidelines.
Return "PASS" if the text is completely fine.
If there are any issues, return a list of specific errors starting with "ERROR:".

Text to review:
${content}
`;

  try {
    const response = await llm.invoke([new SystemMessage(prompt)], {
      callbacks: [langfuseLangchainHandler],
    });

    const output = messageText(response.content);
    const validationErrors = output.trim() === "PASS" ? [] : [output];

    return {
      validationErrors,
      messages: [new AIMessage(`Guardrails check: ${output}`)],
    };
  } catch (error) {
    console.warn("[guardrailsNode] Guardrails check failed:", error);
    return {
      messages: [new AIMessage(`Guardrails check bypassed due to error: ${errorMessage(error) || "Unknown error"}`)],
    };
  }
};
