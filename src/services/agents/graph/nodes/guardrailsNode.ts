import { PublishAIState } from "../state";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { langfuseLangchainHandler } from "@/lib/langfuse";

export const guardrailsNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
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

    const output = typeof response.content === "string" 
      ? response.content 
      : (Array.isArray(response.content) ? response.content.map(c => typeof c === "string" ? c : (c as any).text || "").join("") : String(response.content));
    const validationErrors = output.trim() === "PASS" ? [] : [output];

    return {
      validationErrors,
      messages: [new AIMessage(`Guardrails check: ${output}`)],
    };
  } catch (error: any) {
    console.warn("[guardrailsNode] Guardrails check failed:", error);
    return {
      messages: [new AIMessage(`Guardrails check bypassed due to error: ${error?.message || "Unknown error"}`)],
    };
  }
};
