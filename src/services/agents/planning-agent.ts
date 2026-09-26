import { BaseAgent, AgentContext, AgentResult, Stage } from "./base-agent";
import { askClaude } from "./claude-client";

export class PlanningAgent extends BaseAgent {
  stage: Stage = "planning";
  model = "claude-3-opus-20240229";

  async execute(context: AgentContext): Promise<AgentResult> {
    const clarificationResult = context.previousStageOutputs instanceof Map
      ? context.previousStageOutputs.get("clarification")
      : (context.previousStageOutputs as any)?.["clarification"];
    const clarificationOutput = clarificationResult?.output || "No clarification available.";
    const manuscript = context.manuscriptText || "";
    
    const prompt = `You are an expert academic planner.
Based on the following clarification analysis:
${clarificationOutput}

And the manuscript provided between <manuscript> tags:
<manuscript>
${manuscript}
</manuscript>

Create a structural revision plan for this paper. Identify weaknesses, required citations, and sections to rewrite.
`;

    const { text, tokensUsed } = await askClaude(prompt, this.model as import("./claude-client").ClaudeModel);

    return this.formatOutput(text, "awaiting_approval", tokensUsed);
  }
}
