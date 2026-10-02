import { PublishAIState } from "../state";
import { mem0 } from "@/lib/mem0";

export const retrieveMemoryNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const messages = state.messages || [];
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  
  if (!lastMessage || typeof lastMessage.content !== "string") {
    return { memoryContext: "" };
  }

  try {
    // Sanitize user_id safely
    const validUserId = (state.userId || "default_user").replace(/[^a-zA-Z0-9_-]/g, "") || "default_user";
    
    // Sanitize input to prevent prompt injection
    let safeInput = String(lastMessage.content).replace(/<[^>]*>?/gm, "");
    // Remove system prompt attempts
    safeInput = safeInput.replace(/system prompt/ig, "").replace(/ignore previous instructions/ig, "");

    // mem0 v3 rejects top-level user ids in search(); scoping must go through filters,
    // otherwise the call throws (or, worse, searches every user's memories).
    const searchResponse = await mem0.search(safeInput, {
      filters: { user_id: validUserId },
    });

    const memoryContext = searchResponse.results.map((result) => `- ${result.memory}`).join("\n");

    return { memoryContext };
  } catch (e) {
    console.warn("[retrieveMemoryNode] Mem0 search failed:", e);
    return { memoryContext: "" };
  }
};

export const updateMemoryNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const messages = state.messages || [];
  const messagesCount = messages.length;
  
  if (messagesCount < 2) return {};

  const userMessage = messages[messagesCount - 2];
  const aiMessage = messages[messagesCount - 1];

  try {
    // Sanitize user_id safely
    const validUserId = (state.userId || "default_user").replace(/[^a-zA-Z0-9_-]/g, "") || "default_user";

    await mem0.add(
      [{ role: "user", content: String(userMessage.content).replace(/<[^>]*>?/gm, "").replace(/system prompt/ig, "").replace(/ignore previous instructions/ig, "") },
       { role: "assistant", content: String(aiMessage.content || "") }],
      { userId: validUserId }
    );
  } catch (e) {
    console.warn("[updateMemoryNode] Mem0 update failed:", e);
  }

  return {};
};
