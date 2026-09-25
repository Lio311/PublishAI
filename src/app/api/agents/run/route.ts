import { NextResponse } from "next/server";
import { publishAiGraph } from "@/services/agents/graph/workflow";
import { AIMessage, HumanMessage } from "@langchain/core/messages";

export async function POST(req: Request) {
  try {
    const { thread_id, documentContent, userId, humanFeedback } = await req.json();
    
    if (!thread_id) {
      return NextResponse.json({ error: "thread_id is required" }, { status: 400 });
    }

    const config = { configurable: { thread_id } };

    // Check if graph is interrupted
    const graphState = await publishAiGraph.getState(config);
    const isInterrupted = graphState.next.includes("humanReview");

    let result;

    if (isInterrupted && humanFeedback) {
      // Resume the graph with user feedback
      result = await publishAiGraph.invoke(
        { humanFeedback, messages: [new HumanMessage(humanFeedback)] }, 
        config
      );
    } else if (isInterrupted && !humanFeedback) {
      // Resume without feedback (Approve)
      result = await publishAiGraph.invoke({ humanFeedback: null }, config);
    } else {
      // Start fresh
      result = await publishAiGraph.invoke(
        { 
          documentContent, 
          userId, 
          messages: [new HumanMessage(`Please review and edit: ${documentContent}`)] 
        }, 
        config
      );
    }

    // Check if it paused again
    const newState = await publishAiGraph.getState(config);
    const requiresApproval = newState.next.includes("humanReview");

    return NextResponse.json({
      status: requiresApproval ? "awaiting_approval" : "completed",
      documentContent: result?.documentContent || newState.values.documentContent,
      validationErrors: result?.validationErrors || newState.values.validationErrors,
      thread_id
    });

  } catch (error: any) {
    console.error("Agent Run Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to run agent" },
      { status: 500 }
    );
  }
}
