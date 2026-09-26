import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { langfuseLangchainHandler } from "@/lib/langfuse";
import { PublishAIState } from "../state";
import { pubmedTool } from "../../../ai/tools/pubmedTool";
import { AgentResult } from "../../base-agent";

export const knowledgeNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const modelName = "gpt-4o";
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
              query = (toolCall.args as any).query || "";
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
      const responseText = typeof response.content === "string" 
        ? response.content 
        : (Array.isArray(response.content) ? response.content.map(c => typeof c === "string" ? c : (c as any).text || "").join("") : "");
      knowledgeContext = responseText || "Literature search completed. No direct PubMed references required.";
    }

    const tokensUsed = (response.response_metadata as any)?.usage?.total_tokens ?? 0;
    
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
  } catch (error: any) {
    console.error("[knowledgeNode] Execution failed:", error);
    const fallbackText = `Knowledge search could not be completed: ${error?.message || "Unknown error"}`;
    return {
      literature: fallbackText,
      knowledgeContext: fallbackText,
      currentStage: "knowledge"
    };
  }
};
