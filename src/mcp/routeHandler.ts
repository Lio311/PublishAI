import { NextRequest } from "next/server";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { authenticateMcpRequest } from "./auth";
import { McpServerContext } from "./types";
import { McpSessionRegistry, NextSseTransport } from "./sseTransport";

export type McpServerFactory = (context?: McpServerContext) => Server;

export function createMcpRouteHandler(factory: McpServerFactory, serverName: string) {
  const registry = new McpSessionRegistry();

  async function GET(req: NextRequest) {
    const authResult = await authenticateMcpRequest(req);
    if (!authResult.authenticated) {
      return Response.json(
        { error: authResult.error || "Unauthorized" },
        { status: 401 }
      );
    }

    const encoder = new TextEncoder();
    const sessionId = crypto.randomUUID();

    const stream = new ReadableStream({
      async start(controller) {
        const transport = new NextSseTransport(sessionId, controller, authResult.userId);
        registry.register(transport);

        const server = factory({
          userId: authResult.userId,
          requireAuth: true,
          apiKey: authResult.isService ? "service" : undefined,
        });

        await server.connect(transport);

        // SSE endpoint handshake
        controller.enqueue(encoder.encode("event: endpoint\n"));
        const postUrl = new URL(`/api/mcp/${serverName}?sessionId=${sessionId}`, req.url).toString();
        controller.enqueue(encoder.encode(`data: ${postUrl}\n\n`));

        // Keep-alive heartbeat every 15 seconds
        const interval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(":\n\n"));
          } catch {
            clearInterval(interval);
          }
        }, 15000);

        req.signal.addEventListener("abort", () => {
          clearInterval(interval);
          registry.delete(sessionId);
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  async function POST(req: NextRequest) {
    try {
      const authResult = await authenticateMcpRequest(req);
      if (!authResult.authenticated) {
        return Response.json(
          { error: authResult.error || "Unauthorized" },
          { status: 401 }
        );
      }

      const url = new URL(req.url);
      const sessionId = url.searchParams.get("sessionId");

      if (!sessionId) {
        return Response.json({ error: "Missing required 'sessionId' parameter" }, { status: 400 });
      }

      const transport = registry.get(sessionId);
      if (!transport) {
        return Response.json({ error: "Session not found or expired" }, { status: 404 });
      }

      // Check session ownership (user can only post to their own session unless service client)
      if (
        !authResult.isService &&
        transport.userId &&
        authResult.userId &&
        transport.userId !== authResult.userId
      ) {
        return Response.json(
          { error: "Forbidden: You do not have permission to post to this session" },
          { status: 403 }
        );
      }

      const body = await req.json();
      await transport.handlePostMessage(body);

      return new Response("Accepted", { status: 202 });
    } catch (error: any) {
      return Response.json({ error: error.message || "Internal error processing message" }, { status: 500 });
    }
  }

  return { GET, POST, registry };
}
