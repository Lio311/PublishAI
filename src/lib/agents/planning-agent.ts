import { BaseAgent, AgentContext, AgentResult, Stage } from "./base-agent";
import { askClaude } from "./claude-client";

export class PlanningAgent extends BaseAgent {
  stage: Stage = "planning";
  model = "claude-3-opus-20240229";

  async execute(context: AgentContext): Promise<AgentResult> {
    const clarificationOutput = context.previousStageOutputs.get("clarification")?.output || "No clarification available.";
    
    const prompt = `You are an expert academic planner.
Based on the following clarification analysis:
${clarificationOutput}

And the following manuscript excerpt:
${context.manuscriptText.substring(0, 10000)}

Create a structural revision plan for this paper. Identify weaknesses, required citations, and sections to rewrite.
`;

    const { text, tokensUsed } = await askClaude(prompt, this.model as import("./claude-client").ClaudeModel);

    return this.formatOutput(text, "awaiting_approval", tokensUsed);
  }
}
