import { PublishAIState } from "../state";
import { askClaude, ClaudeModel } from "../../claude-client";
import { AIMessage } from "@langchain/core/messages";
import { AgentResult } from "../../base-agent";

export const writingNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const model: ClaudeModel = "claude-3-opus-20240229";
  const reviewResult = state.previousStageOutputs.get("scientific_review");
  const review = reviewResult?.output || "";
  
  let memoryStr = "";
  if (state.memoryContext) {
    memoryStr = `\n\nAdditional context about the user's preferences:\n${state.memoryContext}`;
  }

  const prompt = `Rewrite the text to elevate the academic tone, address the following review feedback, and remove any generic AI-sounding phrases.\n\nReview:\n${review}${memoryStr}\n\nManuscript provided between <manuscript> tags:\n<manuscript>\n${state.documentContent}\n</manuscript>`;
  
  const { text, tokensUsed } = await askClaude(prompt, model);
  
  const result: AgentResult = {
    stage: "writing",
    status: "completed",
    output: text,
    tokensUsed,
    model,
  };
  
  const newOutputs = new Map<import("../../base-agent").Stage, AgentResult>();
  newOutputs.set("writing", result);

  return {
    documentContent: text,
    previousStageOutputs: newOutputs,
    messages: [new AIMessage({ content: text, name: "writingNode" })],
    currentStage: "writing"
  };
};
