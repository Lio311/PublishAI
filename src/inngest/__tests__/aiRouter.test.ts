import { routeAIRequest } from '../aiRouter';
import test from 'node:test';
import assert from 'node:assert';

test('routes scientific review to OpenAI o1', async () => {
    const res = await routeAIRequest('scientific_review', { text: "data" });
    assert.strictEqual(res.modelUsed, 'o1-preview');
});
