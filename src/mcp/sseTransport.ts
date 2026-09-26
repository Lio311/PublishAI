import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import { JSONRPCMessage, JSONRPCMessageSchema } from "@modelcontextprotocol/sdk/types.js";

export class NextSseTransport implements Transport {
  onclose?: () => void;
  onerror?: (error: Error) => void;
  onmessage?: <T extends JSONRPCMessage>(message: T, extra?: unknown) => void;

  sessionId: string;
  userId?: string;
  createdAt: number;
  lastActiveAt: number;

  private controller: ReadableStreamDefaultController;
  private isClosed = false;

  constructor(sessionId: string, controller: ReadableStreamDefaultController, userId?: string) {
    this.sessionId = sessionId;
    this.controller = controller;
    this.userId = userId;
    this.createdAt = Date.now();
    this.lastActiveAt = Date.now();
  }

  async start() {
    this.lastActiveAt = Date.now();
  }

  async send(message: JSONRPCMessage) {
    if (this.isClosed) return;
    try {
      this.lastActiveAt = Date.now();
      const payload = `event: message\ndata: ${JSON.stringify(message)}\n\n`;
      this.controller.enqueue(new TextEncoder().encode(payload));
    } catch (err) {
      this.onerror?.(err as Error);
    }
  }

  async close() {
    if (this.isClosed) return;
    this.isClosed = true;
    try {
      this.controller.close();
    } catch {
      // Stream controller might already be closed by client abort
    }
    this.onclose?.();
  }

  async handlePostMessage(body: unknown) {
    this.lastActiveAt = Date.now();
    try {
      const parsedMessage = JSONRPCMessageSchema.parse(body);
      this.onmessage?.(parsedMessage);
    } catch (error) {
      this.onerror?.(error as Error);
      throw error;
    }
  }
}

/**
 * Registry to manage active SSE transports with memory leak protection and idle TTL pruning.
 */
export class McpSessionRegistry {
  private transports = new Map<string, NextSseTransport>();
  private readonly ttlMs: number;
  private readonly maxSessions: number;

  constructor(ttlMs = 30 * 60 * 1000, maxSessions = 100) {
    this.ttlMs = ttlMs;
    this.maxSessions = maxSessions;
  }

  register(transport: NextSseTransport): void {
    this.prune();

    if (this.transports.size >= this.maxSessions) {
      // Evict oldest session to prevent unbounded memory growth
      const oldestKey = this.transports.keys().next().value;
      if (oldestKey) {
        const oldTransport = this.transports.get(oldestKey);
        oldTransport?.close();
        this.transports.delete(oldestKey);
      }
    }

    this.transports.set(transport.sessionId, transport);
  }

  get(sessionId: string): NextSseTransport | undefined {
    const transport = this.transports.get(sessionId);
    if (!transport) return undefined;

    // Check expiration
    if (Date.now() - transport.lastActiveAt > this.ttlMs) {
      transport.close();
      this.transports.delete(sessionId);
      return undefined;
    }

    return transport;
  }

  delete(sessionId: string): boolean {
    const transport = this.transports.get(sessionId);
    if (transport) {
      transport.close();
      return this.transports.delete(sessionId);
    }
    return false;
  }

  prune(): void {
    const now = Date.now();
    for (const [id, transport] of this.transports.entries()) {
      if (now - transport.lastActiveAt > this.ttlMs) {
        transport.close();
        this.transports.delete(id);
      }
    }
  }

  get size(): number {
    return this.transports.size;
  }
}
