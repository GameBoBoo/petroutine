import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCareDraft } from '../lib/services/ai-care-draft-service.js';

test('AI care draft accepts a bounded care entry without saving anything', () => {
  const result = parseCareDraft(JSON.stringify({ draft: { mode: 'care', title: 'พาโมจิเดินเล่น', activity_type: 'walk', notes: 'เดินเล่นหลังอาหาร' } }));
  assert.equal(result.mode, 'care');
  assert.equal(result.activity_type, 'walk');
  assert.equal(result.title, 'พาโมจิเดินเล่น');
});

test('AI care draft falls back from invalid weight and rejects malformed output', () => {
  const result = parseCareDraft(JSON.stringify({ draft: { mode: 'health', title: 'ชั่งน้ำหนัก', record_type: 'weight', numeric_value: -4 } }));
  assert.equal(result.record_type, 'observation');
  assert.throws(() => parseCareDraft('{broken'));
  assert.throws(() => parseCareDraft(JSON.stringify({ draft: { mode: 'unknown', title: 'x' } })));
});
