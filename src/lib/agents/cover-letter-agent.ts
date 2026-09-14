import { BaseAgent, AgentContext, AgentResult } from "./base-agent";
import { askClaude, ClaudeModel } from "./claude-client";

export class CoverLetterAgent extends BaseAgent {
  stage = "compilation" as const; // Assuming it runs during compilation
  model: ClaudeModel = "claude-3-7-sonnet-20250219";

  async execute(context: AgentContext): Promise<AgentResult> {
    const journalName = context.journalRules?.name || "the target journal";
    
    const prompt = `You are an academic editor. Write a professional cover letter for the following manuscript being submitted to the journal "${journalName}".

Here is the manuscript abstract/intro to base it on:
${context.manuscriptText.substring(0, 2000)}

Ensure it follows this structure:
1. Address the Editor in Chief.
2. State the title of the manuscript and intent to submit.
3. Briefly highlight the main findings and significance (why it fits the journal).
4. Confirm it has not been published elsewhere.
5. Provide contact info.`;

    const { text, tokensUsed } = await askClaude(prompt, this.model);
    
    return this.formatOutput(text, "success", tokensUsed);
  }
}
