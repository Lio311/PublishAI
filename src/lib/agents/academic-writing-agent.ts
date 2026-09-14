import { BaseAgent, AgentContext, AgentResult, Stage } from "./base-agent";
import { askClaude } from "./claude-client";

export class AcademicWritingAgent extends BaseAgent {
  stage: Stage = "writing";
  model = "claude-3-opus-20240229";

  async execute(context: AgentContext): Promise<AgentResult> {
    const review = context.previousStageOutputs.get("scientific_review")?.output || "";
    const prompt = `Rewrite the text to elevate the academic tone, address the following review feedback, and remove any generic AI-sounding phrases.\n\nReview:\n${review}\n\nManuscript:\n${context.manuscriptText.substring(0, 10000)}`;
    const { text, tokensUsed } = await askClaude(prompt, this.model as any);
    return this.formatOutput(text, "completed", tokensUsed);
  }
}
