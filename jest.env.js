/* eslint-disable @typescript-eslint/no-require-imports */
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { ReadableStream, WritableStream, TransformStream } = require('stream/web');
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;
global.TransformStream = TransformStream;

const { MessageChannel, MessagePort } = require('worker_threads');
global.MessageChannel = MessageChannel;
global.MessagePort = MessagePort;

const undici = require('undici');
global.fetch = undici.fetch;
global.Request = undici.Request;
global.Response = undici.Response;
global.Headers = undici.Headers;
global.FormData = undici.FormData;

process.env.DATABASE_URL = "postgres://dummy:dummy@dummy/dummy";
process.env.HF_TOKEN = "dummy_token";
process.env.MASTER_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.OPENAI_API_KEY = "dummy_sk";
