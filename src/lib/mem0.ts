import MemoryClient from 'mem0ai';

export const memoryClient = new MemoryClient({
  apiKey: process.env.MEM0_API_KEY || "dummy_key",
});
