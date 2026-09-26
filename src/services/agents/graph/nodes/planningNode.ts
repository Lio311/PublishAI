import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { langfuseLangchainHandler } from "@/lib/langfuse";
import { PublishAIState, getPreviousStageOutput } from "../state";
import { queryJournalTrends } from "@/services/ai/graphrag";
import { db } from "@/services/db";
import { eq } from "drizzle-orm";
import { papers } from "@/services/db/schema";
import { AgentResult } from "../../base-agent";

export const planningNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const modelName = "claude-3-opus-20240229";
  const model = new ChatAnthropic({
    modelName,
    temperature: 0,
  });

  const clarificationOutput = getPreviousStageOutput(state, "clarification")?.output || state.clarification || "No clarification available.";

  let trendContext = "";
  if (state.paperId) {
    const parsedId = parseInt(state.paperId, 10);
    if (!isNaN(parsedId)) {
      try {
        const paper = await db.query.papers.findFirst({
          where: eq(papers.id, parsedId),
        });
        if (paper?.targetJournalId) {
          trendContext = await queryJournalTrends(paper.targetJournalId, "academic trends");
        }
      } catch (err) {
        console.warn("[planningNode] Failed to query journal trends:", err);
      }
    }
  }

  const prompt = `You are an expert academic planner.
Based on the following clarification analysis:
${clarificationOutput}

And the manuscript provided between <manuscript> tags:
<manuscript>
${state.documentContent || "No manuscript content provided."}
</manuscript>

${trendContext ? `Relevant Journal Trends from GraphRAG:\n<trends>\n${trendContext}\n</trends>\n` : ""}
Create a structural revision plan for this paper. Identify weaknesses, required citations, and sections to rewrite.
`;

  try {
    const response = await model.invoke([
      new HumanMessage(prompt)
    ], {
      callbacks: [langfuseLangchainHandler],
    });

    const output = typeof response.content === "string" 
      ? response.content 
      : (Array.isArray(response.content) ? response.content.map(c => typeof c === "string" ? c : (c as any).text || "").join("") : String(response.content));
    const tokensUsed = (response.response_metadata as any)?.usage?.total_tokens ?? 0;

    const result: AgentResult = {
      stage: "planning",
      model: modelName,
      output,
      status: "awaiting_approval",
      tokensUsed,
    };

    return {
      plan: output,
      previousStageOutputs: new Map([["planning", result]]),
      currentStage: "planning"
    };
  } catch (error: any) {
    console.error("[planningNode] Execution failed:", error);
    const fallbackOutput = `Planning failed: ${error?.message || "Unknown error"}`;
    return {
      plan: fallbackOutput,
      validationErrors: [`Planning failed: ${error?.message || "Unknown error"}`],
      currentStage: "planning"
    };
  }
};
