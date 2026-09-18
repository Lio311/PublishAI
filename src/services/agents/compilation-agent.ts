import { BaseAgent, AgentContext, AgentResult, Stage } from "./base-agent";

import { askClaude } from "./claude-client";

export class CompilationAgent extends BaseAgent {
  stage: Stage = "compilation";
  model = "claude-3-7-sonnet-20250219";

  async execute(context: AgentContext): Promise<AgentResult> {
    const prompt = `Produce a clean, final version of the following manuscript, ensuring formatting is consistent and removing any internal notes or XML tags.\n\n<manuscript>\n${context.manuscriptText}\n</manuscript>`;
    
    try {
      const { text, tokensUsed } = await askClaude(prompt, this.model as import("./claude-client").ClaudeModel);
      return this.formatOutput(text, "completed", tokensUsed);
    } catch (e) {
      return this.formatOutput("Compilation failed.", "failed", 0);
    }
  }
}
