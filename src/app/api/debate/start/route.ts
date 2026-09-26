import { NextResponse } from "next/server";

export async function POST(req: Request) {
  return NextResponse.json({
    turns: [
      { speaker: "PaperA (Smith et al. 2023)", message: "The user's findings corroborate our thesis that neural pathways adapt quickly." },
      { speaker: "PaperB (Johnson 2022)", message: "However, my model showed a delayed adaptation. The user's sample size might explain the variance." },
      { speaker: "PaperC (Lee 2024)", message: "If we synthesize both, the rapid adaptation might be specific to the stimuli used in the user's protocol." }
    ],
    synthesis: "The findings demonstrate a rapid neural adaptation consistent with Smith et al. (2023). While Johnson (2022) suggested delayed responses, our specific stimulus protocol appears to trigger the immediate pathway observed by Lee (2024), bridging the gap between both models."
  });
}
