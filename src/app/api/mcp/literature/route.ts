import { NextRequest } from 'next/server';
import { server } from "@/mcp/literatureMcpServer";
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { JSONRPCMessage, JSONRPCMessageSchema } from '@modelcontextprotocol/sdk/types.js';

class NextSseTransport implements Transport {
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: <T extends JSONRPCMessage>(message: T, extra?: any) => void;
  
  sessionId: string;
  private controller: ReadableStreamDefaultController;
  
  constructor(sessionId: string, controller: ReadableStreamDefaultController) {
    this.sessionId = sessionId;
    this.controller = controller;
  }
  
  async start() {
    // Protocol.connect calls this. Connection is already established via GET.
  }
  
  async send(message: JSONRPCMessage) {
    try {
      const payload = `event: message\ndata: ${JSON.stringify(message)}\n\n`;
      this.controller.enqueue(new TextEncoder().encode(payload));
    } catch (err) {
      this.onerror?.(err as Error);
    }
  }
  
  async close() {
    try {
      this.controller.close();
    } catch (err) {
      // Stream might already be closed
    }
    this.onclose?.();
  }
  
  async handlePostMessage(body: any) {
    try {
      const parsedMessage = JSONRPCMessageSchema.parse(body);
      this.onmessage?.(parsedMessage);
    } catch (error) {
      this.onerror?.(error as Error);
      throw error;
    }
  }
}

// Global store to map session IDs to their active transports
const activeTransports = new Map<string, NextSseTransport>();

/**
 * Custom SSE Transport adapter for Next.js App Router.
 * This bridges the standard MCP Server object with Next.js web streams.
 */
export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sessionId = crypto.randomUUID();
      
      const transport = new NextSseTransport(sessionId, controller);
      activeTransports.set(sessionId, transport);
      
      // Connect this transport to the singleton server.
      await server.connect(transport);
      
      controller.enqueue(encoder.encode('event: endpoint\n'));
      const postUrl = new URL(`/api/mcp/literature?sessionId=${sessionId}`, req.url).toString();
      controller.enqueue(encoder.encode(`data: ${postUrl}\n\n`));
      
      // 2. Keep the connection alive
      const interval = setInterval(() => {
        try {
           controller.enqueue(encoder.encode(':\n\n'));
        } catch {
           clearInterval(interval);
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        activeTransports.delete(sessionId);
        transport.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('sessionId');
    
    if (!sessionId) {
      return Response.json({ error: "Missing session ID" }, { status: 400 });
    }

    const transport = activeTransports.get(sessionId);
    if (!transport) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    const body = await req.json();
    
    // Pass incoming message directly into the SDK's Server instance via Transport
    await transport.handlePostMessage(body);
    
    return new Response("Accepted", { status: 202 });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
