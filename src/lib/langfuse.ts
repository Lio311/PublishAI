import { Langfuse } from "langfuse-node";

export const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY || "sk-lf-dummy",
  publicKey: process.env.LANGFUSE_PUBLIC_KEY || "pk-lf-dummy",
  baseUrl: process.env.LANGFUSE_BASEURL || "https://cloud.langfuse.com",
});
