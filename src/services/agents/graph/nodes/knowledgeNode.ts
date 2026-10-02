import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { langfuseLangchainHandler } from "@/lib/langfuse";
import { PublishAIState } from "../state";
import { pubmedTool } from "../../../ai/tools/pubmedTool";
import { AgentResult } from "../../base-agent";
import { OPENAI_MODELS } from "@/services/ai/modelIds";
import { errorMessage } from "@/services/utils/errors";
import { messageText, totalTokens } from "../messageUtils";

export const knowledgeNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const modelName = OPENAI_MODELS.standard;
  const model = new ChatOpenAI({
    modelName,
    temperature: 0,
  }).bindTools([pubmedTool]);

  const docContent = state.documentContent || state.clarification || "Academic manuscript research";
  const messages = [
    new SystemMessage("You are an academic researcher. Search for related literature using the available tools to build a knowledge context based on the user's document."),
    new HumanMessage(`Document Content:\n${docContent}`)
  ];
  
  try {
    const response = await model.invoke(messages, {
      callbacks: [langfuseLangchainHandler],
    });

    let knowledgeContext = "";
    
    if (response.tool_calls && response.tool_calls.length > 0) {
      for (const toolCall of response.tool_calls) {
        if (toolCall.name === "pubmed_search") {
          try {
            let query = "";
            if (typeof toolCall.args === "string") {
              const parsed = JSON.parse(toolCall.args);
              query = parsed.query || "";
            } else if (toolCall.args && typeof toolCall.args === "object") {
              query = String((toolCall.args as { query?: unknown }).query ?? "");
            }
            if (query) {
              const result = await pubmedTool.invoke({ query });
              knowledgeContext += `\n\n[PubMed Search: "${query}"]:\n${result}`;
            }
          } catch (toolErr) {
            console.warn("[knowledgeNode] pubmedTool invoke failed:", toolErr);
            knowledgeContext += `\n\n[PubMed Search Error]: ${toolErr instanceof Error ? toolErr.message : String(toolErr)}`;
          }
        }
      }
    }

    if (!knowledgeContext.trim()) {
      const responseText = messageText(response.content);
      knowledgeContext = responseText || "Literature search completed. No direct PubMed references required.";
    }

    const tokensUsed = totalTokens(response);
    
    const result: AgentResult = {
      stage: "knowledge",
      model: modelName,
      output: knowledgeContext,
      status: "completed",
      tokensUsed,
    };

    return {
      literature: knowledgeContext,
      knowledgeContext: knowledgeContext,
      previousStageOutputs: new Map([["knowledge", result]]),
      currentStage: "knowledge"
    };
  } catch (error) {
    console.error("[knowledgeNode] Execution failed:", error);
    const fallbackText = `Knowledge search could not be completed: ${errorMessage(error) || "Unknown error"}`;
    return {
      literature: fallbackText,
      knowledgeContext: fallbackText,
      currentStage: "knowledge"
    };
  }
};
