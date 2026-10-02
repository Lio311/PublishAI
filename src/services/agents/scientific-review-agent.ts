import { BaseAgent, AgentContext, AgentResult, Stage } from "./base-agent";
import { askClaude } from "./claude-client";
import { ANTHROPIC_MODELS } from "@/services/ai/modelIds";

export class ScientificReviewAgent extends BaseAgent {
  stage: Stage = "scientific_review";
  model = ANTHROPIC_MODELS.reasoning;

  async execute(context: AgentContext): Promise<AgentResult> {
    const manuscript = context.manuscriptText || "";
    const prompt = `Perform a rigorous peer review on the manuscript provided between <manuscript> tags. Highlight logical flaws, methodological issues, and unsubstantiated claims.\n\n<manuscript>\n${manuscript}\n</manuscript>`;
    const { text, tokensUsed } = await askClaude(prompt, this.model as import("./claude-client").ClaudeModel);
    return this.formatOutput(text, "awaiting_approval", tokensUsed);
  }
}
