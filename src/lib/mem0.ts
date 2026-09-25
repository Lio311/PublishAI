import { MemoryClient } from "mem0ai";

export const mem0 = new MemoryClient({
  apiKey: process.env.MEM0_API_KEY || "dummy_key_for_build",
});

export const memoryClient = mem0;
