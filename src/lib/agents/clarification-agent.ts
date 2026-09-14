import { BaseAgent, AgentContext, AgentResult, Stage } from "./base-agent";
import { askClaude } from "./claude-client";

export class ClarificationAgent extends BaseAgent {
  stage: Stage = "clarification";
  model = "claude-3-7-sonnet-20250219";

  async execute(context: AgentContext): Promise<AgentResult> {
    const prompt = `You are an expert academic editor.
Analyze the following academic text and extract:
1. The main thesis / objective
2. The primary field of study
3. Any obvious missing sections (e.g., no Conclusion)

Text: ${context.manuscriptText.substring(0, 10000)}
`;

    const { text, tokensUsed } = await askClaude(prompt, this.model as import("./claude-client").ClaudeModel);

    return this.formatOutput(text, "awaiting_approval", tokensUsed);
  }
}
