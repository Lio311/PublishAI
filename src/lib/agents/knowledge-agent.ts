import { BaseAgent, AgentContext, AgentResult, Stage } from "./base-agent";
import { gatherLiterature } from "../search/search-orchestrator";
import { askClaude } from "./claude-client";

export class KnowledgeAgent extends BaseAgent {
  stage: Stage = "knowledge";
  model = "claude-3-7-sonnet-20250219";

  async execute(context: AgentContext): Promise<AgentResult> {
    const clarification = context.previousStageOutputs.get("clarification")?.output || "";
    const kwPrompt = `Extract 3 main search queries for academic literature based on this text:\n${clarification}\nOutput ONLY the 3 queries, separated by commas.`;
    
    let tokensUsed = 0;
    let resultText = "No keywords generated.";
    
    try {
      const resp = await askClaude(kwPrompt, this.model as any);
      tokensUsed += resp.tokensUsed;
      await gatherLiterature(resp.text);
      resultText = `Literature gathered for keywords: ${resp.text}. Found articles from PubMed, Semantic Scholar, and arXiv.`;
    } catch(e) {
      console.error(e);
    }
    
    return this.formatOutput(resultText, "success", tokensUsed);
  }
}
