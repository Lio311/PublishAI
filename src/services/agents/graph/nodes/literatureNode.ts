import { PublishAIState } from "../state";
import { literatureService } from "@/services/literature/literatureService";
import { AgentResult } from "../../base-agent";

export const literatureNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const query = state.documentContent?.slice(0, 150) || "scientific research publication";

  try {
    const searchResult = await literatureService.search(query, { limit: 5 });
    const formattedRefs = searchResult.items
      .map((item, idx) => `[${idx + 1}] ${literatureService.formatCitation(item, 'apa')}`)
      .join('\n\n');

    const literatureSummary = searchResult.items.length > 0
      ? `Found ${searchResult.total} references across PubMed, CrossRef, and Semantic Scholar:\n\n${formattedRefs}`
      : "No external literature references found for current document query.";

    const agentResult: AgentResult = {
      stage: "knowledge",
      model: "publishai-literature-service",
      output: literatureSummary,
      status: "completed",
      tokensUsed: 0,
    };

    return {
      literature: literatureSummary,
      knowledgeContext: literatureSummary,
      previousStageOutputs: new Map([["knowledge", agentResult]]),
      currentStage: "knowledge",
    };
  } catch (error: any) {
    console.error("[literatureNode] External literature query failed:", error);
    const fallbackText = `Literature search could not be completed: ${error?.message || "Unknown error"}`;
    return {
      literature: fallbackText,
      knowledgeContext: fallbackText,
      currentStage: "knowledge",
    };
  }
};
