import { BaseAgent, AgentContext, AgentResult, Stage } from "./base-agent";

import { askClaude } from "./claude-client";

export class ExecutionAgent extends BaseAgent {
  stage: Stage = "execution";
  model = "claude-3-opus-20240229";

  async execute(context: AgentContext): Promise<AgentResult> {
    const writingOutput = context.previousStageOutputs.get("writing")?.output;
    if (!writingOutput) {
      return this.formatOutput("No writing output to execute.", "completed", 0);
    }

    const prompt = `Create a structured summary of the changes made between the original manuscript and the rewritten version.\n\nOriginal:\n<manuscript>\n${context.manuscriptText}\n</manuscript>\n\nRewritten:\n<rewritten>\n${writingOutput}\n</rewritten>`;
    
    try {
      const { text, tokensUsed } = await askClaude(prompt, this.model as import("./claude-client").ClaudeModel);
      context.manuscriptText = writingOutput;

      return {
        stage: this.stage,
        model: this.model,
        output: text,
        status: "completed",
        tokensUsed,
        metadata: { updatedText: writingOutput }
      };
    } catch (e) {
      return this.formatOutput("Execution failed.", "failed", 0);
    }
  }
}
