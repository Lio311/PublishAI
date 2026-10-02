import { BaseAgent, AgentContext, AgentResult, Stage } from "./base-agent";

import { askClaude } from "./claude-client";
import { ANTHROPIC_MODELS } from "@/services/ai/modelIds";

export class ExecutionAgent extends BaseAgent {
  stage: Stage = "execution";
  model = ANTHROPIC_MODELS.reasoning;

  async execute(context: AgentContext): Promise<AgentResult> {
    const writingResult = context.previousStageOutputs instanceof Map
      ? context.previousStageOutputs.get("writing")
      : (context.previousStageOutputs as any)?.["writing"];
    const writingOutput = writingResult?.output;
    if (!writingOutput) {
      return this.formatOutput("No writing output to execute.", "completed", 0);
    }

    const manuscript = context.manuscriptText || "";
    const prompt = `Create a structured summary of the changes made between the original manuscript and the rewritten version.\n\nOriginal:\n<manuscript>\n${manuscript}\n</manuscript>\n\nRewritten:\n<rewritten>\n${writingOutput}\n</rewritten>`;
    
    try {
      context.manuscriptText = writingOutput;
      const { text, tokensUsed } = await askClaude(prompt, this.model as import("./claude-client").ClaudeModel);

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
