import { BaseAgent, AgentContext, AgentResult, Stage } from "./base-agent";
import { askClaude } from "./claude-client";

export class QaAgent extends BaseAgent {
  stage: Stage = "qa";
  model = "claude-3-7-sonnet-20250219";

  async execute(context: AgentContext): Promise<AgentResult> {
    const prompt = `Check this academic text for spelling errors, inconsistency, and unreferenced figures/tables.\nManuscript:\n${context.manuscriptText.substring(0, 5000)}`;
    const { text, tokensUsed } = await askClaude(prompt, this.model as any);
    return this.formatOutput(text, "completed", tokensUsed);
  }
}
