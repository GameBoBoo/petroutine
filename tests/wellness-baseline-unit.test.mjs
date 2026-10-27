import assert from 'node:assert/strict';
import test from 'node:test';
import { baselineWindow, computeWellnessBaseline } from '../lib/wellness-baseline.js';

const atBangkok = (date, hour = 8) => `${date}T${String(hour).padStart(2, '0')}:00:00+07:00`;

test('baseline window contains exactly 14 Bangkok calendar days', () => {
  assert.deepEqual(baselineWindow('2026-10-10'), { from: '2026-09-27', to: '2026-10-10' });
});

test('missing values stay absent and multiple logs use the latest non-null metric per day', () => {
  const rows = [
    { id: 'a', recorded_at: atBangkok('2026-10-10', 8), food_intake: 'low', water_intake: null },
    { id: 'b', recorded_at: atBangkok('2026-10-10', 12), food_intake: null, water_intake: 'usual' },
    { id: 'c', recorded_at: atBangkok('2026-10-10', 18), food_intake: 'high', water_intake: null },
  ];
  const result = computeWellnessBaseline(rows, { asOf: '2026-10-10' });
  const food = result.metrics.find(metric => metric.key === 'food_intake');
  const water = result.metrics.find(metric => metric.key === 'water_intake');
  assert.equal(food.observed_days, 1);
  assert.deepEqual(food.source_log_ids, ['c']);
  assert.equal(water.observed_days, 1);
  assert.deepEqual(water.source_log_ids, ['b']);
  assert.equal(result.metrics.find(metric => metric.key === 'weight_kg').observed_days, 0);
});

test('ready categorical and numeric baselines are deterministic regardless of input order', () => {
  const rows = Array.from({ length: 14 }, (_, index) => {
    const day = new Date(Date.UTC(2026, 8, 27 + index)).toISOString().slice(0, 10);
    return {
      id: `log-${String(index).padStart(2, '0')}`,
      recorded_at: atBangkok(day),
      food_intake: index < 7 ? 'low' : 'usual',
      weight_kg: 10 + index,
    };
  });
  const first = computeWellnessBaseline(rows, { asOf: '2026-10-10' });
  const second = computeWellnessBaseline([...rows].reverse(), { asOf: '2026-10-10' });
  assert.deepEqual(first, second);
  const food = first.metrics.find(metric => metric.key === 'food_intake');
  const weight = first.metrics.find(metric => metric.key === 'weight_kg');
  assert.equal(food.status, 'ready');
  assert.equal(food.baseline.typical_value, 'low');
  assert.equal(weight.baseline.typical_value, 16.5);
  assert.equal(weight.baseline.minimum, 10);
  assert.equal(weight.baseline.maximum, 23);
});
