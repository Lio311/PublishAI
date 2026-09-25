import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { langfuseLangchainHandler } from "@/lib/langfuse";
import { PublishAIState } from "../state";
import { queryJournalTrends } from "@/services/ai/graphrag";
import { db } from "@/services/db";
import { eq } from "drizzle-orm";
import { papers } from "@/services/db/schema";

export const planningNode = async (state: PublishAIState) => {
  const model = new ChatAnthropic({
    modelName: "claude-3-opus-20240229",
    temperature: 0,
  });

  const clarificationOutput = state.previousStageOutputs.get("clarification")?.output || state.clarification || "No clarification available.";

  let trendContext = "";
  if (state.paperId) {
    const paper = await db.query.papers.findFirst({
      where: eq(papers.id, parseInt(state.paperId, 10)),
    });
    if (paper?.targetJournalId) {
      trendContext = await queryJournalTrends(paper.targetJournalId, "academic trends");
    }
  }

  const prompt = `You are an expert academic planner.
Based on the following clarification analysis:
${clarificationOutput}

And the manuscript provided between <manuscript> tags:
<manuscript>
${state.documentContent}
</manuscript>

${trendContext ? `Relevant Journal Trends from GraphRAG:\n<trends>\n${trendContext}\n</trends>\n` : ""}
Create a structural revision plan for this paper. Identify weaknesses, required citations, and sections to rewrite.
`;

  const response = await model.invoke([
    new HumanMessage(prompt)
  ], {
    callbacks: [langfuseLangchainHandler],
  });

  const output = response.content as string;
  const tokensUsed = (response.response_metadata as any)?.usage?.total_tokens ?? 0;

  return {
    plan: output,
    previousStageOutputs: new Map([["planning", { output, status: "awaiting_approval", tokensUsed }]]),
    currentStage: "planning"
  };
};
