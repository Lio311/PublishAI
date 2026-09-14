import { BaseAgent, AgentContext, AgentResult, Stage } from "./base-agent";
import { askClaude } from "./claude-client";

export class VerificationAgent extends BaseAgent {
  stage: Stage = "verification";
  model = "claude-3-7-sonnet-20250219";

  async execute(context: AgentContext): Promise<AgentResult> {
    const prompt = `Generate a simulated peer-review report for this final manuscript.\nManuscript:\n${context.manuscriptText.substring(0, 5000)}`;
    const { text, tokensUsed } = await askClaude(prompt, this.model as import("./claude-client").ClaudeModel);
    return this.formatOutput(text, "completed", tokensUsed);
  }
}
