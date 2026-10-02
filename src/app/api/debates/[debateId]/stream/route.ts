import { NextRequest } from "next/server";
import { db } from "@/services/db";
import { debateMessages, debates } from "@/services/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requirePaperOwner } from "@/services/api/route-auth";

const POLL_INTERVAL_MS = 2000;
const MAX_STREAM_MS = 10 * 60 * 1000;

export async function GET(req: NextRequest, { params }: { params: Promise<{ debateId: string }> }) {
  const { debateId } = await params;

  const [owner] = await db
    .select({ paperId: debates.paperId })
    .from(debates)
    .where(eq(debates.id, debateId))
    .catch(() => []);
  if (!owner) {
    return NextResponse.json({ error: "Debate not found" }, { status: 404 });
  }
  const guard = await requirePaperOwner(owner.paperId);
  if (guard instanceof NextResponse) return guard;

  let isClosed = false;
  const startedAt = Date.now();

  const stream = new ReadableStream({
    async start(controller) {
      req.signal.addEventListener("abort", () => {
        isClosed = true;
      });

      const seenIds = new Set<string>();

      while (!isClosed && Date.now() - startedAt < MAX_STREAM_MS) {
        const [debate] = await db.select().from(debates).where(eq(debates.id, debateId));
        if (!debate) {
            isClosed = true;
            controller.close();
            break;
        }

        const msgs = await db.select()
          .from(debateMessages)
          .where(eq(debateMessages.debateId, debateId));
        
        const newMsgs = msgs.filter(m => !seenIds.has(m.id));
        
        for (const msg of newMsgs) {
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(msg)}\n\n`));
          seenIds.add(msg.id);
        }

        if (debate.status === "consensus_reached" || debate.status === "failed") {
          isClosed = true;
          controller.close();
          break;
        }

        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      }
      if (!isClosed) controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
