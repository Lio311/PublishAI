import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage } from "@langchain/core/messages";
import { langfuseLangchainHandler } from "@/lib/langfuse";
import { PublishAIState, getPreviousStageOutput } from "../state";
import { queryJournalTrends } from "@/services/ai/graphrag";
import { db } from "@/services/db";
import { eq } from "drizzle-orm";
import { papers } from "@/services/db/schema";
import { AgentResult } from "../../base-agent";
import { ANTHROPIC_MODELS } from "@/services/ai/modelIds";
import { errorMessage } from "@/services/utils/errors";
import { messageText, totalTokens } from "../messageUtils";

export const planningNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const modelName = ANTHROPIC_MODELS.reasoning;
  const model = new ChatAnthropic({
    modelName,
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

    const output = messageText(response.content);
    const tokensUsed = totalTokens(response);

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
  } catch (error) {
    console.error("[planningNode] Execution failed:", error);
    const fallbackOutput = `Planning failed: ${errorMessage(error) || "Unknown error"}`;
    return {
      plan: fallbackOutput,
      validationErrors: [`Planning failed: ${errorMessage(error) || "Unknown error"}`],
      currentStage: "planning"
    };
  }
};
