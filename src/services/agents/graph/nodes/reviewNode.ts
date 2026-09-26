import { PublishAIState } from "../state";
import { SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { langfuseLangchainHandler } from "@/lib/langfuse";

export const reviewNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.1,
  });

  const prompt = `You are a Review Agent. Review the final document content and provide feedback or confirm it is ready for publication.
  
Document:
${state.documentContent || "No document content provided."}`;

  const messages = [
    new SystemMessage(prompt),
    ...(state.messages || []),
  ];

  try {
    const response = await llm.invoke(messages, {
      callbacks: [langfuseLangchainHandler],
    });

    return {
      messages: [response],
    };
  } catch (error: any) {
    console.error("[reviewNode] Execution failed:", error);
    return {
      validationErrors: [`Review step failed: ${error?.message || "Unknown error"}`],
    };
  }
};
