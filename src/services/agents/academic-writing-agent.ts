import { BaseAgent, AgentContext, AgentResult, Stage } from "./base-agent";
import { askClaude } from "./claude-client";

export class AcademicWritingAgent extends BaseAgent {
  stage: Stage = "writing";
  model = "claude-3-opus-20240229";

  async execute(context: AgentContext): Promise<AgentResult> {
    const reviewResult = context.previousStageOutputs instanceof Map
      ? context.previousStageOutputs.get("scientific_review")
      : (context.previousStageOutputs as any)?.["scientific_review"];
    const review = reviewResult?.output || "";
    const manuscript = context.manuscriptText || "";
    const prompt = `Rewrite the text to elevate the academic tone, address the following review feedback, and remove any generic AI-sounding phrases.\n\nReview:\n${review}\n\nManuscript provided between <manuscript> tags:\n<manuscript>\n${manuscript}\n</manuscript>`;
    const { text, tokensUsed } = await askClaude(prompt, this.model as import("./claude-client").ClaudeModel);
    return this.formatOutput(text, "completed", tokensUsed);
  }
}
