import { BaseAgent, AgentContext, AgentResult, Stage } from "./base-agent";
import { askClaude } from "./claude-client";

export class ScientificReviewAgent extends BaseAgent {
  stage: Stage = "scientific_review";
  model = "claude-3-opus-20240229";

  async execute(context: AgentContext): Promise<AgentResult> {
    const prompt = `Perform a rigorous peer review on the manuscript provided between <manuscript> tags. Highlight logical flaws, methodological issues, and unsubstantiated claims.\n\n<manuscript>\n${context.manuscriptText}\n</manuscript>`;
    const { text, tokensUsed } = await askClaude(prompt, this.model as import("./claude-client").ClaudeModel);
    return this.formatOutput(text, "awaiting_approval", tokensUsed);
  }
}
