import { NextRequest, NextResponse } from "next/server";
import { publishAiGraph } from "@/services/agents/graph/workflow";
import { auth } from "@/app/auth";
import { db } from "@/services/db";
import { papers } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "@/services/security/rateLimit";

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, RATE_LIMITS.agentRun);
  if (!rl.allowed) return rateLimitResponse(rl.resetMs);
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { paperId, action, feedback, reviewerComments, dataSchema } = await req.json();

    if (!paperId || !action) {
      return NextResponse.json(
        { error: "Missing required fields: paperId or action" },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    // Verify paper authorization if paper exists in DB
    const parsedPaperId = parseInt(paperId, 10);
    if (!isNaN(parsedPaperId)) {
      const paper = await db.query.papers.findFirst({
        where: eq(papers.id, parsedPaperId),
      });
      if (paper && paper.userId && paper.userId !== userId) {
        return NextResponse.json({ error: "Forbidden: You do not own this manuscript" }, { status: 403 });
      }
    }

    const config = {
      configurable: { thread_id: paperId },
    };

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (["start", "start_rebuttal", "cascade"].includes(action)) {
            // Start a new run with the initial state and user context
            const streamEvents = await publishAiGraph.streamEvents(
              { paperId, action, reviewerComments: reviewerComments || "", dataSchema, userId }, // initial state
              { ...config, version: "v2" }
            );

            for await (const event of streamEvents) {
              controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
            }
          } else if (action === "resume") {
            if (feedback) {
              // Update state with feedback
              await publishAiGraph.updateState(config, { humanFeedback: feedback });
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
