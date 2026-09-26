import { MemoryClient } from "mem0ai";

function createMem0Client(): MemoryClient {
  const apiKey = process.env.MEM0_API_KEY;
  if (!apiKey && process.env.NODE_ENV === "production") {
    throw new Error("[Config Error] MEM0_API_KEY is required in production.");
  }
  return new MemoryClient({
    apiKey: apiKey || "disabled",
  });
}

let _mem0: MemoryClient | null = null;

export const mem0 = new Proxy({} as MemoryClient, {
  get(_target, prop) {
    if (!_mem0) _mem0 = createMem0Client();
    return (_mem0 as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const memoryClient = mem0;
