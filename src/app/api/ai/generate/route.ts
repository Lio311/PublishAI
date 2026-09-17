import { NextResponse } from "next/server";
import { callLLM } from "@/services/ai/aiService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, systemPrompt, model, temperature, maxTokens } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const response = await callLLM({
      prompt,
      systemPrompt,
      model,
      temperature,
      maxTokens,
    });

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI response" },
      { status: 500 }
    );
  }
}
