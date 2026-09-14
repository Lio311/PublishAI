import { BaseAgent, AgentContext, AgentResult, Stage } from "./base-agent";
import { askClaude } from "./claude-client";

export class ScientificReviewAgent extends BaseAgent {
  stage: Stage = "scientific_review";
  model = "claude-3-opus-20240229";

  async execute(context: AgentContext): Promise<AgentResult> {
    const prompt = `Perform a rigorous peer review on the following manuscript. Highlight logical flaws, methodological issues, and unsubstantiated claims.\n\nManuscript:\n${context.manuscriptText.substring(0, 10000)}`;
    const { text, tokensUsed } = await askClaude(prompt, this.model as any);
    return this.formatOutput(text, "awaiting_approval", tokensUsed);
  }
}
