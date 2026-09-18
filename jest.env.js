const { TextEncoder, TextDecoder } = // eslint-disable-next-line @typescript-eslint/no-require-imports
require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const { ReadableStream, WritableStream, TransformStream } = // eslint-disable-next-line @typescript-eslint/no-require-imports
require('stream/web');
global.ReadableStream = ReadableStream;
global.WritableStream = WritableStream;
global.TransformStream = TransformStream;

const { Request, Response, Headers, fetch } = // eslint-disable-next-line @typescript-eslint/no-require-imports
require('undici');
global.Request = Request;
global.Response = Response;
global.Headers = Headers;
global.fetch = fetch;
process.env.DATABASE_URL = "postgres://dummy:dummy@dummy/dummy";
process.env.HF_TOKEN = "dummy_token";
process.env.MASTER_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.OPENAI_API_KEY = "dummy_sk";
