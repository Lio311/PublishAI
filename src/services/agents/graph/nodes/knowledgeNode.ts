import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, ToolMessage } from "@langchain/core/messages";
import { langfuseLangchainHandler } from "@/lib/langfuse";
import { PublishAIState } from "../state";
import { arxivTool } from "../../../ai/tools/arxivTool";
import { pubmedTool } from "../../../ai/tools/pubmedTool";

export const knowledgeNode = async (state: PublishAIState) => {
  const model = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0,
  }).bindTools([arxivTool, pubmedTool]);

  const docContent = state.documentContent || state.clarification || "";
  const messages = [
    new SystemMessage("You are an academic researcher. Search for related literature using the available tools to build a knowledge context based on the user's document."),
    new HumanMessage(`Document Content:\n${docContent}`)
  ];
  
  const response = await model.invoke(messages, {
    callbacks: [langfuseLangchainHandler],
  });

  let knowledgeContext = "";
  
  if (response.tool_calls && response.tool_calls.length > 0) {
    for (const toolCall of response.tool_calls) {
      if (toolCall.name === "arxiv_search") {
        const result = await arxivTool.invoke(toolCall);
        knowledgeContext += `\n\n[arXiv] ${toolCall.args.query}:\n${result}`;
      } else if (toolCall.name === "pubmed_search") {
        const result = await pubmedTool.invoke(toolCall);
        knowledgeContext += `\n\n[PubMed] ${toolCall.args.query}:\n${result}`;
      }
    }
  } else {
    knowledgeContext = "No tool calls made by the model.";
  }

  const tokensUsed = (response.response_metadata as any)?.usage?.total_tokens ?? 0;
  
  return {
    literature: knowledgeContext,
    knowledgeContext: knowledgeContext,
    previousStageOutputs: new Map([["knowledge", { output: "Literature search completed.", status: "completed", tokensUsed }]]),
    currentStage: "knowledge"
  };
};
