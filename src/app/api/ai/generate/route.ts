import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getOpenAIModelInstance, resolveProvider } from "@/services/ai/aiService";
import { createAnthropic } from "@ai-sdk/anthropic";
import { auth } from "@/app/auth";
import { applyRateLimit } from "@/services/rate-limit";
import { ANTHROPIC_MODELS, OPENAI_MODELS } from "@/services/ai/modelIds";

const patchSchema = z.object({
  patches: z.array(
    z.object({
      action: z.enum(["insert", "delete"]),
      text: z.string().describe("The text to insert or delete"),
      position: z.number().describe("The zero-based character index position in the document where the change applies. For deletions, this is the index of the first character to delete. For insertions, this is the index where the new text should be inserted."),
    })
  ).describe("A list of patch operations to apply to the document in order to fulfill the requested changes"),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const rateLimitResponse = await applyRateLimit(req, "ai", session.user.id);
    if (rateLimitResponse) return rateLimitResponse;

    const body = await req.json();
    const { prompt, systemPrompt, model, temperature, maxTokens } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Clients may only choose among the configured tiers, never an arbitrary (costly) model id.
    const allowedModels = new Set<string>([...Object.values(ANTHROPIC_MODELS), OPENAI_MODELS.standard, OPENAI_MODELS.mini]);
    if (model !== undefined && (typeof model !== "string" || !allowedModels.has(model))) {
      return NextResponse.json({ error: "Unsupported model" }, { status: 400 });
    }

    const providerName = resolveProvider(undefined, model);
    let aiModel;

    if (providerName === "anthropic") {
      const anthropic = createAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY || "",
      });
      aiModel = anthropic(model || ANTHROPIC_MODELS.standard) as any;
    } else {
      aiModel = getOpenAIModelInstance(model || OPENAI_MODELS.standard) as any;
    }

    const enhancedSystemPrompt = `${systemPrompt || ""}
    
You are an advanced text editing assistant. 
Your task is to analyze the user's prompt (which may contain text to edit and instructions on what to change).
Instead of returning the full edited text, you MUST output your suggested changes as a structured list of patches (insertions and deletions).
Each patch must contain:
- action: 'insert' or 'delete'
- text: the exact text to insert or delete
- position: the character index where the change begins.

Analyze the prompt and provide the necessary patch operations to fulfill the request.`.trim();

    const { object, usage } = await generateObject({
      model: aiModel as any,
      schema: patchSchema,
      prompt,
      system: enhancedSystemPrompt,
      temperature: temperature ?? 0.2,
    });

    return NextResponse.json({
      patches: object.patches,
      provider: providerName,
      model: model || (providerName === "anthropic" ? ANTHROPIC_MODELS.standard : OPENAI_MODELS.standard),
      tokensUsed: usage?.totalTokens,
      usage,
    });
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI response" },
      { status: 500 }
    );
  }
}
