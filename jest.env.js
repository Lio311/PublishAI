/* eslint-disable @typescript-eslint/no-require-imports */
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { ReadableStream, WritableStream, TransformStream } = require('stream/web');
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;
global.TransformStream = TransformStream;

// Node 18+ has native fetch API
if (typeof fetch !== 'undefined') {
  global.fetch = fetch;
  global.Request = Request;
  global.Response = Response;
  global.Headers = Headers;
} else {
  // Fallback for older environments if needed
  try {
    const undici = require('undici');
    global.fetch = undici.fetch;
    global.Request = undici.Request;
    global.Response = undici.Response;
    global.Headers = undici.Headers;
  } catch (e) {
    console.warn('Could not load undici fallback');
  }
}

process.env.DATABASE_URL = "postgres://dummy:dummy@dummy/dummy";
process.env.HF_TOKEN = "dummy_token";
process.env.MASTER_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.OPENAI_API_KEY = "dummy_sk";
