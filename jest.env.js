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
