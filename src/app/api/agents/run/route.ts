import { NextRequest, NextResponse } from "next/server";
import { publishAiGraph } from "@/services/agents/graph/workflow";

export async function POST(req: NextRequest) {
  try {
    const { paperId, action, feedback, reviewerComments } = await req.json();

    if (!paperId || !action) {
      return NextResponse.json(
        { error: "Missing required fields: paperId or action" },
        { status: 400 }
      );
    }

    const config = {
      configurable: { thread_id: paperId },
    };

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (action === "start") {
            // Start a new run with the initial state
            const streamEvents = await publishAiGraph.streamEvents(
              { paperId, reviewerComments: reviewerComments || "" }, // initial state
              { ...config, version: "v2" }
            );

            for await (const event of streamEvents) {
              controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
            }
          } else if (action === "resume") {
            if (feedback) {
              // Update state with feedback
              await publishAiGraph.updateState(config, { feedback });
            }

            // Resume the run by passing null as input
            const streamEvents = await publishAiGraph.streamEvents(
              null,
              { ...config, version: "v2" }
            );

            for await (const event of streamEvents) {
              controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
            }
          } else {
            controller.enqueue(
              encoder.encode(JSON.stringify({ error: "Invalid action" }) + "\n")
            );
          }
        } catch (error) {
          console.error("Agent error:", error);
          controller.enqueue(
            encoder.encode(
              JSON.stringify({ error: (error as Error).message || "Unknown error" }) + "\n"
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
