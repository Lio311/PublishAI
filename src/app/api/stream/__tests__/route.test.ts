import { GET } from '../route';
import test from 'node:test';
import assert from 'node:assert';

test('GET returns SSE headers', () => {
    const response = GET(new Request('http://localhost/api/stream'));
    assert.strictEqual(response.headers.get('Content-Type'), 'text/event-stream');
});
