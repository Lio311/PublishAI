import { generatePDF } from '../typesettingService';
import test from 'node:test';
import assert from 'node:assert';

test('generatePDF returns buffer', async () => {
    const res = await generatePDF("# Title");
    assert.strictEqual(Buffer.isBuffer(res), true);
});
