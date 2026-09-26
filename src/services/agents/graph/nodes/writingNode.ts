import { PublishAIState, getPreviousStageOutput } from "../state";
import { askClaude, ClaudeModel } from "../../claude-client";
import { AIMessage } from "@langchain/core/messages";
import { AgentResult } from "../../base-agent";

export const writingNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const model: ClaudeModel = "claude-3-opus-20240229";
  const reviewResult = getPreviousStageOutput(state, "scientific_review");
  const review = reviewResult?.output || state.scientificReview || "";
  
  let memoryStr = "";
  if (state.memoryContext) {
    memoryStr = `\n\nAdditional context about the user's preferences:\n${state.memoryContext}`;
  }

  let prompt = `Rewrite the text to elevate the academic tone, address the following review feedback, and remove any generic AI-sounding phrases.\n\nReview:\n${review}${memoryStr}\n\nManuscript provided between <manuscript> tags:\n<manuscript>\n${state.documentContent || ""}\n</manuscript>`;
  
  if (state.validationErrors && state.validationErrors.length > 0) {
    prompt += `\n\nCRITICAL FIX REQUIRED. The previous output failed security/academic validation with these errors:\n${state.validationErrors.join('\n')}\nFix these errors immediately.`;
  }
  
  if (state.humanFeedback) {
    prompt += `\n\nUSER FEEDBACK:\nThe user reviewed your previous draft and provided the following feedback. Address it completely:\n${state.humanFeedback}`;
  }
  
  try {
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
      draft: { output: text, status: "completed" },
      previousStageOutputs: newOutputs,
      messages: [new AIMessage({ content: text, name: "writingNode" })],
      currentStage: "writing"
    };
  } catch (error: any) {
    console.error("[writingNode] Claude execution failed:", error);
    return {
      messages: [new AIMessage({ content: `Writing stage failed: ${error?.message || "Unknown error"}`, name: "writingNode" })],
      validationErrors: [`Writing node failed: ${error?.message || "Unknown error"}`],
      currentStage: "writing"
    };
  }
};
