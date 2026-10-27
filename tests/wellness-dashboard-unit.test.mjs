import assert from 'node:assert/strict';
import test from 'node:test';
import { computeWellnessDashboard } from '../lib/wellness-dashboard.js';

const atBangkok = (date, hour = 8) => `${date}T${String(hour).padStart(2, '0')}:00:00+07:00`;
const dateAfter = (start, offset) => {
  const value = new Date(`${start}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + offset); return value.toISOString().slice(0, 10);
};
const row = (date, index, values, hour = 8) => ({ id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`, recorded_at: atBangkok(date, hour), ...values });

test('dashboard reports insufficient, learning, stable and changes detected deterministically', () => {
  assert.equal(computeWellnessDashboard([], [], { asOf: '2026-10-12', rangeDays: 14 }).status, 'insufficient_data');
  assert.equal(computeWellnessDashboard([row('2026-10-12', 1, { mood: 'usual' })], [], { asOf: '2026-10-12', rangeDays: 14 }).status, 'learning');
  const rows = Array.from({ length: 14 }, (_, index) => row(dateAfter('2026-09-29', index), index, { activity_level: 'usual' }));
  const stable = computeWellnessDashboard(rows, [], { asOf: '2026-10-12', rangeDays: 14 });
  assert.equal(stable.status, 'stable');
  assert.equal(stable.ready_metrics, 1);
  const changed = computeWellnessDashboard(rows, [{ id: 'alert', metric: 'activity_level', status: 'monitoring', evidence: {} }], { asOf: '2026-10-12', rangeDays: 14 });
  assert.equal(changed.status, 'changes_detected');
  assert.equal(changed.metrics.find(metric => metric.key === 'activity_level').status, 'changes_detected');
});

test('trend uses latest non-null value per day, keeps missing-day gaps and respects range boundary', () => {
  const rows = [
    row('2026-10-05', 1, { food_intake: 'low' }),
    row('2026-10-06', 2, { food_intake: 'low' }),
    row('2026-10-06', 3, { food_intake: 'high' }, 18),
    row('2026-10-08', 4, { food_intake: 'usual' }),
    row('2026-10-12', 5, { food_intake: 'low' }),
  ];
  const dashboard = computeWellnessDashboard(rows, [], { asOf: '2026-10-12', rangeDays: 7 });
  const food = dashboard.metrics.find(metric => metric.key === 'food_intake');
  assert.equal(dashboard.window_start, '2026-10-06');
  assert.deepEqual(food.points.map(point => point.date), ['2026-10-06', '2026-10-08', '2026-10-12']);
  assert.equal(food.points[0].value, 'high');
  assert.equal(dashboard.observed_days, 3);
  assert.equal(dashboard.missing_days, 4);
});

test('categorical and numeric metrics expose chart scales and baseline bands', () => {
  const rows = Array.from({ length: 14 }, (_, index) => row(dateAfter('2026-09-29', index), index, {
    food_intake: index < 2 ? 'low' : index > 11 ? 'high' : 'usual',
    weight_kg: 10 + index / 10,
  }));
  const dashboard = computeWellnessDashboard(rows, [], { asOf: '2026-10-12', rangeDays: 30 });
  const food = dashboard.metrics.find(metric => metric.key === 'food_intake');
  const weight = dashboard.metrics.find(metric => metric.key === 'weight_kg');
  assert.deepEqual(food.baseline_band, { minimum: 1, maximum: 3, typical: 2, minimum_value: 'low', maximum_value: 'high', typical_value: 'usual' });
  assert.equal(food.points.at(-1).plot_value, 3);
  assert.equal(weight.baseline_band.minimum, 10);
  assert.equal(weight.baseline_band.maximum, 11.3);
  assert.equal(weight.points.at(-1).value, 11.3);
});
