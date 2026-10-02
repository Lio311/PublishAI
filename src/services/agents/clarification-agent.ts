import { BaseAgent, AgentContext, AgentResult, Stage } from "./base-agent";
import { askClaude } from "./claude-client";
import { ANTHROPIC_MODELS } from "@/services/ai/modelIds";

export class ClarificationAgent extends BaseAgent {
  stage: Stage = "clarification";
  model = ANTHROPIC_MODELS.standard;

  async execute(context: AgentContext): Promise<AgentResult> {
    const manuscript = context.manuscriptText || "";
    const prompt = `You are an expert academic editor.
Analyze the academic text provided between <manuscript> tags and extract:
1. The main thesis / objective
2. The primary field of study
3. Any obvious missing sections (e.g., no Conclusion)

<manuscript>
${manuscript}
</manuscript>
`;

    const { text, tokensUsed } = await askClaude(prompt, this.model as import("./claude-client").ClaudeModel);

    return this.formatOutput(text, "awaiting_approval", tokensUsed);
  }
}
