import { ChatOpenAI } from "@langchain/openai";
import { PublishAIState } from "../state";
import { AIMessage } from "@langchain/core/messages";

export const cascadeNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const llm = new ChatOpenAI({
    modelName: "gpt-4o",
    temperature: 0.2,
  });

  const prompt = `
You are an expert academic editor. We need to reformat an academic document for a new journal submission.
Previous Journal ID: ${state.previousJournalId || 'Unknown'}
Target Journal ID: ${state.targetJournalId || 'Unknown'}

Here is the current document content:
${state.documentContent || "No document content provided."}

Based on the target journal requirements, please provide the necessary formatting edits (e.g., word count cuts, citation style changes).
Respond with a JSON object containing a list of edits under the key "edits". Each edit should specify "section" and "instruction".
`;

  try {
    const response = await llm.invoke([
      { role: "system", content: "You are a helpful academic formatting assistant. Return only valid JSON." },
      { role: "user", content: prompt }
    ], {
      response_format: { type: "json_object" }
    });

    const contentStr = typeof response.content === "string" 
      ? response.content 
      : (Array.isArray(response.content) ? response.content.map(c => typeof c === "string" ? c : (c as any).text || "").join("") : String(response.content));

    let edits;
    try {
      const parsed = JSON.parse(contentStr);
      edits = parsed.edits || parsed;
    } catch (e) {
      edits = [{ section: "All", instruction: contentStr }];
    }

    return {
      edits,
      messages: [new AIMessage("Generated cascade edits based on target journal requirements.")],
    };
  } catch (error: any) {
    console.error("[cascadeNode] Execution failed:", error);
    return {
      edits: [{ section: "All", instruction: `Cascade analysis failed: ${error?.message || "Unknown error"}` }],
      messages: [new AIMessage(`Cascade analysis failed: ${error?.message || "Unknown error"}`)],
    };
  }
};
