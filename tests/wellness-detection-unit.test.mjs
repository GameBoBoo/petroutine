import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateAlertResolution, evaluateMetricChange } from '../lib/wellness-detection.js';

const atBangkok = date => `${date}T08:00:00+07:00`;
const dates = (start, count) => Array.from({ length: count }, (_, index) => {
  const value = new Date(`${start}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + index);
  return value.toISOString().slice(0, 10);
});
const sample = (date, index, values) => ({ id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`, recorded_at: atBangkok(date), ...values });

function baselineRows(metric, value) {
  return dates('2026-09-20', 14).map((date, index) => sample(date, index, { [metric]: value }));
}

test('one or two abnormal days do not create an alert; three consecutive days do', () => {
  const baseline = baselineRows('activity_level', 'usual');
  const first = sample('2026-10-04', 14, { activity_level: 'low' });
  const second = sample('2026-10-05', 15, { activity_level: 'low' });
  const third = sample('2026-10-06', 16, { activity_level: 'low' });
  assert.equal(evaluateMetricChange([...baseline, first], 'activity_level'), null);
  assert.equal(evaluateMetricChange([...baseline, first, second], 'activity_level'), null);
  const alert = evaluateMetricChange([...baseline, first, second, third], 'activity_level');
  assert.equal(alert.direction, 'below');
  assert.equal(alert.observation_start, '2026-10-04');
  assert.equal(alert.observation_end, '2026-10-06');
  assert.equal(alert.source_log_ids.length, 17);
});

test('a missing observation day breaks the consecutive sequence', () => {
  const rows = [
    ...baselineRows('food_intake', 'usual'),
    sample('2026-10-04', 14, { food_intake: 'low' }),
    sample('2026-10-06', 15, { food_intake: 'low' }),
    sample('2026-10-07', 16, { food_intake: 'low' }),
  ];
  assert.equal(evaluateMetricChange(rows, 'food_intake'), null);
});

test('weight needs a ten percent change and resolves after two normal days', () => {
  const baseline = baselineRows('weight_kg', 10);
  const changed = ['2026-10-04', '2026-10-05', '2026-10-06'].map((date, index) => sample(date, index + 14, { weight_kg: 11 }));
  const detected = evaluateMetricChange([...baseline, ...changed], 'weight_kg');
  assert.equal(detected.direction, 'above');
  const alert = { ...detected, observation_end: new Date('2026-10-05T17:00:00.000Z') };
  const normal = [sample('2026-10-07', 17, { weight_kg: 10.2 }), sample('2026-10-08', 18, { weight_kg: 9.9 })];
  const resolution = evaluateAlertResolution([...baseline, ...changed, ...normal], alert);
  assert.deepEqual(resolution.dates, ['2026-10-07', '2026-10-08']);
});

test('category alerts require the same new category for all three days', () => {
  const baseline = baselineRows('mood', 'usual');
  const mixed = [sample('2026-10-04', 14, { mood: 'quiet' }), sample('2026-10-05', 15, { mood: 'irritable' }), sample('2026-10-06', 16, { mood: 'quiet' })];
  assert.equal(evaluateMetricChange([...baseline, ...mixed], 'mood'), null);
  const same = mixed.map(row => ({ ...row, mood: 'quiet' }));
  assert.equal(evaluateMetricChange([...baseline, ...same], 'mood').direction, 'changed');
});
