import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAnswer } from '../lib/services/ai-insight-service.js';

test('AI response accepts only known source IDs and returns unique citations', () => {
  const value = parseAnswer('{"answer":"บันทึกว่ากินตามปกติ","source_ids":["source-1","source-1"]}', new Set(['source-1']));
  assert.deepEqual(value, { answer: 'บันทึกว่ากินตามปกติ', source_ids: ['source-1'] });
});

test('AI response rejects fabricated source IDs', () => {
  assert.throws(() => parseAnswer('{"answer":"มีอาการป่วย","source_ids":["made-up"]}', new Set(['source-1'])), { code: 'AI_INVALID_RESPONSE' });
});

test('AI response rejects malformed JSON and oversized answers', () => {
  assert.throws(() => parseAnswer('not json', new Set()), { code: 'AI_INVALID_RESPONSE' });
  assert.throws(() => parseAnswer(JSON.stringify({ answer: 'x'.repeat(4001), source_ids: [] }), new Set()), { code: 'AI_INVALID_RESPONSE' });
});

test('AI response needs a known source when it makes a factual claim', () => {
  assert.throws(() => parseAnswer(JSON.stringify({ answer: 'กินอาหารปกติ', source_ids: [] }), new Set(['source-1'])), { code: 'AI_INVALID_RESPONSE' });
  assert.deepEqual(parseAnswer(JSON.stringify({ answer: 'ข้อมูลไม่เพียงพอ', source_ids: [] }), new Set(['source-1'])).source_ids, []);
});
