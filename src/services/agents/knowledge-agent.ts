import { BaseAgent, AgentContext, AgentResult, Stage } from "./base-agent";
import { gatherLiterature } from "../search/search-orchestrator";
import { askClaude } from "./claude-client";

export class KnowledgeAgent extends BaseAgent {
  stage: Stage = "knowledge";
  model = "claude-3-7-sonnet-20250219";

  async execute(context: AgentContext): Promise<AgentResult> {
    const clarificationResult = context.previousStageOutputs instanceof Map
      ? context.previousStageOutputs.get("clarification")
      : (context.previousStageOutputs as any)?.["clarification"];
    const clarification = clarificationResult?.output || "";
    const kwPrompt = `Extract 3 main search queries for academic literature based on this text:\n${clarification}\nOutput ONLY the 3 queries, separated by commas, with no additional text, numbering, or formatting.`;
    
    let tokensUsed = 0;
    let resultText = "No keywords generated.";
    
    try {
      const resp = await askClaude(kwPrompt, this.model as import("./claude-client").ClaudeModel);
      tokensUsed += resp.tokensUsed;
      const literature = await gatherLiterature(resp.text);
      context.references = literature.combined;
      resultText = `Literature gathered for keywords: ${resp.text}. Found articles from PubMed and Semantic Scholar.`;
    } catch(e) {
      console.error(e);
    }
    
    return this.formatOutput(resultText, "completed", tokensUsed);
  }
}
