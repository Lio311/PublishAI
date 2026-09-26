import { Langfuse } from "langfuse-node";
import { CallbackHandler } from "langfuse-langchain";

function getLangfuseConfig() {
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const baseUrl = process.env.LANGFUSE_BASEURL || "https://us.cloud.langfuse.com";

  if (process.env.NODE_ENV === "production" && (!publicKey || !secretKey)) {
    throw new Error("[Config Error] LANGFUSE_PUBLIC_KEY and LANGFUSE_SECRET_KEY are required in production.");
  }

  return {
    publicKey: publicKey || "pk-disabled",
    secretKey: secretKey || "sk-disabled",
    baseUrl,
  };
}

let _langfuse: Langfuse | null = null;
let _handler: CallbackHandler | null = null;

export const langfuse = new Proxy({} as Langfuse, {
  get(_target, prop) {
    if (!_langfuse) _langfuse = new Langfuse(getLangfuseConfig());
    return (_langfuse as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const langfuseLangchainHandler = new Proxy({} as CallbackHandler, {
  get(_target, prop) {
    if (!_handler) _handler = new CallbackHandler(getLangfuseConfig());
    return (_handler as unknown as Record<string | symbol, unknown>)[prop];
  },
});
