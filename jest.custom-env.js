/* eslint-disable @typescript-eslint/no-require-imports */
const JSDOMEnvironment = require('jest-environment-jsdom').default || require('jest-environment-jsdom');

class CustomEnvironment extends JSDOMEnvironment {
  async setup() {
    await super.setup();
    if (typeof fetch !== 'undefined') {
      this.global.fetch = fetch;
      this.global.Headers = Headers;
      this.global.Request = Request;
      this.global.Response = Response;
      if (typeof AbortController !== 'undefined') {
        this.global.AbortController = AbortController;
        this.global.AbortSignal = AbortSignal;
      }
    }
    if (typeof ReadableStream !== 'undefined') {
      this.global.ReadableStream = ReadableStream;
      this.global.WritableStream = WritableStream;
      this.global.TransformStream = TransformStream;
    }
    if (typeof TextEncoder !== 'undefined') {
      this.global.TextEncoder = TextEncoder;
      this.global.TextDecoder = TextDecoder;
    }
  }
}

module.exports = CustomEnvironment;
