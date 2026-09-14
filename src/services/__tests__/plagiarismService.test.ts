import { checkPlagiarism } from '../plagiarismService';
import test from 'node:test';
import assert from 'node:assert';

test('checkPlagiarism returns score', async () => {
    const res = await checkPlagiarism("original text");
    assert.strictEqual(typeof res.score, 'number');
});
