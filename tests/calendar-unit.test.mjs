import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bangkokDate, datesInRange, formatBangkokTime, occursOn, scheduledAt } from '../lib/calendar.js';

test('Bangkok date and timestamp cross the UTC day boundary correctly', () => {
  assert.equal(bangkokDate(new Date('2026-10-09T18:00:00.000Z')), '2026-10-10');
  assert.equal(scheduledAt('2026-10-10', '08:30').toISOString(), '2026-10-10T01:30:00.000Z');
  assert.equal(formatBangkokTime('2026-10-10T01:30:00.000Z'), '08:30');
});

test('date ranges are inclusive and capped at 42 days', () => {
  assert.deepEqual(datesInRange('2026-10-10', '2026-10-12'), ['2026-10-10', '2026-10-11', '2026-10-12']);
  assert.equal(datesInRange('2026-10-01', '2026-11-11').length, 42);
  assert.throws(() => datesInRange('2026-10-01', '2026-11-12'), /range/i);
  assert.throws(() => datesInRange('2026-10-12', '2026-10-10'), /range/i);
  assert.throws(() => datesInRange('2026-02-30', '2026-03-01'), /date/i);
});

test('weekly legacy and one-time routines occur only on their scheduled dates', () => {
  assert.equal(occursOn({ time: '09:00', days: [0, 3] }, '2026-10-14'), true);
  assert.equal(occursOn({ time: '09:00', days: [0, 3] }, '2026-10-15'), false);
  assert.equal(occursOn({ type: 'once', time: '10:00', date: '2026-10-14' }, '2026-10-14'), true);
  assert.equal(occursOn({ type: 'once', time: '10:00', date: '2026-10-14' }, '2026-10-15'), false);
});
