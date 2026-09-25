import { PublishAIState } from "../state";
import { mem0 } from "@/lib/mem0";

export const retrieveMemoryNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const lastMessage = state.messages[state.messages.length - 1];
  
  if (!lastMessage || typeof lastMessage.content !== "string") {
    return { memoryContext: "" };
  }

  try {
    // Sanitize user_id
    const validUserId = state.userId.replace(/[^a-zA-Z0-9_-]/g, "") || "default_user";
    
    // Sanitize input to prevent prompt injection
    let safeInput = String(lastMessage.content).replace(/<[^>]*>?/gm, "");
    // Remove system prompt attempts
    safeInput = safeInput.replace(/system prompt/ig, "").replace(/ignore previous instructions/ig, "");

    const searchResponse = await mem0.search(safeInput, {
      user_id: validUserId,
    } as any);

    const results = (searchResponse as any).results || searchResponse;
    const memoryContext = Array.isArray(results) 
      ? results.map((result: any) => `- ${result.memory}`).join("\n")
      : "";

    return { memoryContext };
  } catch (e) {
    console.warn("Mem0 search failed", e);
    return { memoryContext: "" };
  }
};

export const updateMemoryNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const messagesCount = state.messages.length;
  
  if (messagesCount < 2) return {};

  const userMessage = state.messages[messagesCount - 2];
  const aiMessage = state.messages[messagesCount - 1];

  try {
    // Sanitize user_id
    const validUserId = state.userId.replace(/[^a-zA-Z0-9_-]/g, "") || "default_user";

    await mem0.add(
      [{ role: "user", content: String(userMessage.content).replace(/<[^>]*>?/gm, "").replace(/system prompt/ig, "").replace(/ignore previous instructions/ig, "") },
       { role: "assistant", content: aiMessage.content as string }],
      { user_id: validUserId } as any
    );
  } catch (e) {
    console.warn("Mem0 update failed", e);
  }

  return {};
};
