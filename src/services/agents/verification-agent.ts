import { BaseAgent, AgentContext, AgentResult, Stage } from "./base-agent";
import { askClaude } from "./claude-client";

export class VerificationAgent extends BaseAgent {
  stage: Stage = "verification";
  model = "claude-3-7-sonnet-20250219";

  async execute(context: AgentContext): Promise<AgentResult> {
    const manuscript = context.manuscriptText || "";
    const prompt = `Generate a simulated peer-review report for this final manuscript provided between <manuscript> tags.\n\n<manuscript>\n${manuscript}\n</manuscript>`;
    const { text, tokensUsed } = await askClaude(prompt, this.model as import("./claude-client").ClaudeModel);
    return this.formatOutput(text, "completed", tokensUsed);
  }
}
