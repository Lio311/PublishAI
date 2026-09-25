import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { langfuseLangchainHandler } from "@/lib/langfuse";
import { PublishAIState } from "../state";
import { gatherLiterature } from "@/services/search/search-orchestrator";

export const knowledgeNode = async (state: PublishAIState) => {
  const model = new ChatAnthropic({
    modelName: "claude-3-7-sonnet-20250219",
    temperature: 0,
  });

  const clarification = state.previousStageOutputs.get("clarification")?.output || state.clarification || "";
  const kwPrompt = `Extract 3 main search queries for academic literature based on this text:\n${clarification}\nOutput ONLY the 3 queries, separated by commas, with no additional text, numbering, or formatting.`;
  
  const response = await model.invoke([
    new HumanMessage(kwPrompt)
  ], {
    callbacks: [langfuseLangchainHandler],
  });

  const queries = response.content as string;
  const tokensUsed = (response.response_metadata as any)?.usage?.total_tokens ?? 0;
  
  let resultText = "No keywords generated.";
  let literatureResult = null;
  
  try {
    const literature = await gatherLiterature(queries);
    literatureResult = literature.combined;
    resultText = `Literature gathered for keywords: ${queries}. Found articles from PubMed, Semantic Scholar, and arXiv.`;
  } catch(e) {
    console.error(e);
  }

  return {
    literature: literatureResult,
    previousStageOutputs: new Map([["knowledge", { output: resultText, status: "completed", tokensUsed }]]),
    currentStage: "knowledge"
  };
};
