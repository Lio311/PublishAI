import { Langfuse } from "langfuse-node";
import { CallbackHandler } from "langfuse-langchain";

const publicKey = process.env.LANGFUSE_PUBLIC_KEY || "pk-dummy";
const secretKey = process.env.LANGFUSE_SECRET_KEY || "sk-dummy";
const baseUrl = process.env.LANGFUSE_BASEURL || "https://us.cloud.langfuse.com";

export const langfuse = new Langfuse({
  publicKey,
  secretKey,
  baseUrl,
});

export const langfuseLangchainHandler = new CallbackHandler({
  publicKey,
  secretKey,
  baseUrl,
});
