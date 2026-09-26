import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { PublishAIState } from "../state";
import { langfuseLangchainHandler } from "@/lib/langfuse";

export const verificationNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const model = new ChatAnthropic({
    modelName: "claude-3-7-sonnet-20250219",
    callbacks: [langfuseLangchainHandler],
  });

  const prompt = `Generate a simulated peer-review report for this final manuscript provided between <manuscript> tags.\n\n<manuscript>\n${state.documentContent || "No manuscript content provided."}\n</manuscript>`;

  try {
    const response = await model.invoke([new HumanMessage(prompt)]);
    const output = typeof response.content === "string" 
      ? response.content 
      : (Array.isArray(response.content) ? response.content.map(c => typeof c === "string" ? c : (c as any).text || "").join("") : String(response.content));

    return {
      verification: {
        output,
        status: "completed",
      },
      currentStage: "verification"
    };
  } catch (error: any) {
    console.error("[verificationNode] Execution failed:", error);
    return {
      verification: {
        output: `Verification report failed: ${error?.message || "Unknown error"}`,
        status: "failed",
      },
      currentStage: "verification"
    };
  }
};
