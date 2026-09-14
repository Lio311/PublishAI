import { searchSimilar } from '../ragService';
import test from 'node:test';
import assert from 'node:assert';

test('searchSimilar returns vectorized matches', async () => {
    const results = await searchSimilar('methodology', 1);
    assert.strictEqual(results.length, 1);
});
