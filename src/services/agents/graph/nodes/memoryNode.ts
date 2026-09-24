import { PublishAIState } from "../state";
import { memoryClient } from "@/lib/mem0";

export const retrieveMemoryNode = async (state: PublishAIState): Promise<Partial<PublishAIState>> => {
  const lastMessage = state.messages[state.messages.length - 1];
  
  if (!lastMessage || typeof lastMessage.content !== "string") {
    return { memoryContext: "" };
  }

  try {
    const searchResponse = await memoryClient.search(lastMessage.content, {
      userId: state.userId,
      topK: 5,
    } as any);

    const memoryContext = searchResponse.results
      .map((result: any) => `- ${result.memory}`)
      .join("\n");

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
    await memoryClient.add([
      { role: "user", content: userMessage.content as string },
      { role: "assistant", content: aiMessage.content as string }
    ], {
      userId: state.userId
    });
  } catch (e) {
    console.warn("Mem0 update failed", e);
  }

  return {};
};
