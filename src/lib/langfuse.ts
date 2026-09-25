import { Langfuse } from "langfuse-node";
import { CallbackHandler } from "langfuse-langchain";

export const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASEURL || "https://us.cloud.langfuse.com",
});

export const langfuseLangchainHandler = new CallbackHandler({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASEURL || "https://us.cloud.langfuse.com",
});
