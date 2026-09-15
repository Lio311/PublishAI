import { askClaude } from "@/lib/agents/claude-client";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

export async function routeAIRequest(taskType: string, payload: { prompt: string; system?: string }) {
    try {
        if (taskType === 'scientific_review' || taskType === 'writing') {
            const { text, tokensUsed } = await askClaude(payload.prompt, 'claude-3-opus-20240229', payload.system);
            return { modelUsed: 'claude-3-opus-20240229', output: text, tokensUsed };
        } else if (['clarification', 'qa', 'verification', 'compilation'].includes(taskType)) {
            const { text, tokensUsed } = await askClaude(payload.prompt, 'claude-3-7-sonnet-20250219', payload.system);
            return { modelUsed: 'claude-3-7-sonnet-20250219', output: text, tokensUsed };
        } else {
            const { text, usage } = await generateText({
                model: openai('gpt-4o'),
                prompt: payload.prompt,
                system: payload.system
            });
            return { modelUsed: 'gpt-4o', output: text, tokensUsed: usage.totalTokens };
        }
    } catch (error) {
        console.error(`AI Routing error for task ${taskType}:`, error);
        throw error;
    }
}
