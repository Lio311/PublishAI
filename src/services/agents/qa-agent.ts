import { BaseAgent, AgentContext, AgentResult, Stage } from "./base-agent";
import { askClaude } from "./claude-client";

export class QaAgent extends BaseAgent {
  stage: Stage = "qa";
  model = "claude-3-7-sonnet-20250219";

  async execute(context: AgentContext): Promise<AgentResult> {
    const manuscript = context.manuscriptText || "";
    const prompt = `Check the academic text provided between <manuscript> tags for spelling errors, inconsistency, and unreferenced figures/tables.\n\n<manuscript>\n${manuscript}\n</manuscript>`;
    const { text, tokensUsed } = await askClaude(prompt, this.model as import("./claude-client").ClaudeModel);
    return this.formatOutput(text, "completed", tokensUsed);
  }
}
