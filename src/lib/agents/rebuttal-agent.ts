import { BaseAgent, AgentContext, AgentResult, Stage } from "./base-agent";
import { askClaude, ClaudeModel } from "./claude-client";

export class RebuttalAgent extends BaseAgent {
  stage: Stage = "planning"; // Reusing planning stage
  model = "claude-3-7-sonnet-20250219";

  async execute(context: AgentContext): Promise<AgentResult> {
    const reviewerComments = context.reviewerComments;
    
    if (!reviewerComments) {
      throw new Error("No reviewer comments provided to RebuttalAgent.");
    }

    const prompt = `You are a senior academic editor.
The author has received the following reviewer comments for their manuscript:
"""
${reviewerComments}
"""

The original manuscript text:
"""
${context.manuscriptText.substring(0, 5000)}... (truncated)
"""

Generate a "Response to Reviewers" strategy document.
For each distinct point made by the reviewers, propose a clear, actionable change to be made to the manuscript.
Format your output as a Markdown list or table, detailing:
1. Reviewer's Point
2. Proposed Change in the Manuscript
3. Draft Rebuttal Text (what to say to the reviewer).
`;

    const { text, tokensUsed } = await askClaude(prompt, this.model as ClaudeModel);

    return this.formatOutput(text, "completed", tokensUsed);
  }
}
