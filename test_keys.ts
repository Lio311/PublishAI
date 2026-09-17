import { generateText } from "ai";
async function test() {
  generateText({ maxSteps: 1, maxTokens: 1, max_tokens: 1 } as any);
}
