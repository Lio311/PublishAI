import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { PublishAIState } from "../state";
import { langfuseLangchainHandler } from "@/lib/langfuse";

export const draftNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const model = new ChatAnthropic({
    modelName: "claude-3-opus-20240229",
    callbacks: [langfuseLangchainHandler],
  });

  const review = state.scientificReview?.output || (typeof state.scientificReview === "string" ? state.scientificReview : "");
  const prompt = `Rewrite the text to elevate the academic tone, address the following review feedback, and remove any generic AI-sounding phrases.\n\nReview:\n${review}\n\nManuscript provided between <manuscript> tags:\n<manuscript>\n${state.documentContent || ""}\n</manuscript>`;

  try {
    const response = await model.invoke([new HumanMessage(prompt)]);
    const output = typeof response.content === "string" 
      ? response.content 
      : (Array.isArray(response.content) ? response.content.map(c => typeof c === "string" ? c : (c as any).text || "").join("") : String(response.content));

    return {
      draft: {
        output,
        status: "completed",
      },
      documentContent: output,
      currentStage: "writing"
    };
  } catch (error: any) {
    console.error("[draftNode] Execution failed:", error);
    return {
      draft: {
        output: `Draft generation failed: ${error?.message || "Unknown error"}`,
        status: "failed",
      },
      currentStage: "writing"
    };
  }
};
