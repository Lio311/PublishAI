import { NextRequest } from "next/server";
import { db } from "@/services/db";
import { debateMessages } from "@/services/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ debateId: string }> }) {
  const { debateId } = await params;

  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      req.signal.addEventListener("abort", () => {
        isClosed = true;
      });

      let lastMessageId = "";

      while (!isClosed) {
        const msgs = await db.select()
          .from(debateMessages)
          .where(eq(debateMessages.debateId, debateId));
        
        const newMsgs = msgs.filter(m => m.id !== lastMessageId);
        
        if (newMsgs.length > 0) {
          const latest = newMsgs[newMsgs.length - 1];
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(latest)}\n\n`));
          lastMessageId = latest.id;
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
      }
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
