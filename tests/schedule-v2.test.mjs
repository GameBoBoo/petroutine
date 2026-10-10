import assert from 'node:assert/strict';
import { test } from 'node:test';

const scheduleModule = await import('../lib/schedule.js').catch(() => ({}));

function api(name) {
  assert.equal(typeof scheduleModule[name], 'function', `lib/schedule.js must export ${name}`);
  return scheduleModule[name];
}

test('normalizes legacy schedules and sorts version 2 times without changing Bangkok meaning', () => {
  const normalizeSchedule = api('normalizeSchedule');

  assert.deepEqual(normalizeSchedule({ time: '08:00', days: [1, 3] }), {
    version: 2,
    type: 'weekly',
    times: ['08:00'],
    days: [1, 3],
    start_date: null,
    end_date: null,
    pauses: [],
  });
  assert.deepEqual(normalizeSchedule({ type: 'once', date: '2026-12-31', time: '10:30' }), {
    version: 2,
    type: 'once',
    date: '2026-12-31',
    times: ['10:30'],
    start_date: '2026-12-31',
    end_date: '2026-12-31',
    pauses: [],
  });
  assert.deepEqual(normalizeSchedule({
    version: 2,
    type: 'weekly',
    times: ['18:00', '08:00'],
    days: [5, 1, 3],
    start_date: '2026-10-01',
  }), {
    version: 2,
    type: 'weekly',
    times: ['08:00', '18:00'],
    days: [1, 3, 5],
    start_date: '2026-10-01',
    end_date: null,
    pauses: [],
  });
});

test('normalizes overlapping pauses and excludes bounded or paused weekly occurrences', () => {
  const normalizeSchedule = api('normalizeSchedule');
  const scheduleOccursAt = api('scheduleOccursAt');
  const isSchedulePaused = api('isSchedulePaused');
  const schedule = normalizeSchedule({
    version: 2,
    type: 'weekly',
    times: ['08:00', '18:00'],
    days: [1, 2, 3, 4, 5, 6, 0],
    start_date: '2026-10-10',
    end_date: '2026-10-20',
    pauses: [
      { from: '2026-10-12', to: '2026-10-14' },
      { from: '2026-10-14', to: '2026-10-16' },
    ],
  });

  assert.deepEqual(schedule.pauses, [{ from: '2026-10-12', to: '2026-10-16' }]);
  assert.equal(isSchedulePaused(schedule, '2026-10-15'), true);
  assert.deepEqual(scheduleOccursAt(schedule, '2026-10-09'), []);
  assert.deepEqual(scheduleOccursAt(schedule, '2026-10-15'), []);
  assert.deepEqual(
    scheduleOccursAt(schedule, '2026-10-17').map(value => value.toISOString()),
    ['2026-10-17T01:00:00.000Z', '2026-10-17T11:00:00.000Z'],
  );
  assert.deepEqual(scheduleOccursAt(schedule, '2026-10-21'), []);
});

test('calculates interval schedules across leap, month, and year boundaries', () => {
  const normalizeSchedule = api('normalizeSchedule');
  const occurrencesInRange = api('occurrencesInRange');
  const schedule = normalizeSchedule({
    version: 2,
    type: 'interval',
    times: ['09:15'],
    interval_days: 3,
    start_date: '2024-02-28',
    end_date: '2025-01-03',
    pauses: [{ from: '2024-03-05', to: '2024-03-05' }],
  });

  assert.deepEqual(
    occurrencesInRange(schedule, '2024-02-28', '2024-03-09').map(item => ({
      date: item.date,
      time: item.time,
      iso: item.scheduledAt.toISOString(),
    })),
    [
      { date: '2024-02-28', time: '09:15', iso: '2024-02-28T02:15:00.000Z' },
      { date: '2024-03-02', time: '09:15', iso: '2024-03-02T02:15:00.000Z' },
      { date: '2024-03-08', time: '09:15', iso: '2024-03-08T02:15:00.000Z' },
    ],
  );

  const yearly = normalizeSchedule({
    version: 2,
    type: 'interval',
    times: ['00:00'],
    interval_days: 365,
    start_date: '2024-01-01',
  });
  assert.deepEqual(
    occurrencesInRange(yearly, '2024-12-29', '2025-01-03').map(item => item.date),
    ['2024-12-31'],
  );
});

test('rejects invalid schedule fields and ranges with field-specific errors', () => {
  const normalizeSchedule = api('normalizeSchedule');
  const occurrencesInRange = api('occurrencesInRange');

  for (const [input, field] of [
    [{ type: 'weekly', times: ['08:00', '08:00'], days: [1] }, 'times'],
    [{ type: 'weekly', times: ['25:00'], days: [1] }, 'times'],
    [{ type: 'weekly', times: ['08:00'], days: [] }, 'days'],
    [{ type: 'interval', times: ['08:00'], interval_days: 0, start_date: '2026-10-10' }, 'interval_days'],
    [{ type: 'interval', times: ['08:00'], interval_days: 366, start_date: '2026-10-10' }, 'interval_days'],
    [{ type: 'interval', times: ['08:00'], interval_days: 3 }, 'start_date'],
    [{ type: 'once', times: ['08:00'], date: '2026-02-30' }, 'date'],
    [{ type: 'weekly', times: ['08:00'], days: [1], start_date: '2026-10-20', end_date: '2026-10-10' }, 'end_date'],
    [{ type: 'weekly', times: ['08:00'], days: [1], pauses: [{ from: '2026-10-20', to: '2026-10-10' }] }, 'pauses'],
  ]) {
    assert.throws(
      () => normalizeSchedule(input),
      error => error?.name === 'ScheduleValidationError' && Object.hasOwn(error.fields, field),
      `expected invalid ${field}`,
    );
  }

  const daily = normalizeSchedule({ type: 'weekly', times: ['08:00'], days: [0, 1, 2, 3, 4, 5, 6] });
  assert.throws(() => occurrencesInRange(daily, '2026-10-20', '2026-10-10'), /range/i);
  assert.throws(() => occurrencesInRange(daily, '2026-10-01', '2026-11-12'), /range/i);
});

test('one-time schedules produce each configured time only on their date', () => {
  const normalizeSchedule = api('normalizeSchedule');
  const scheduleOccursAt = api('scheduleOccursAt');
  const once = normalizeSchedule({
    version: 2,
    type: 'once',
    date: '2026-12-31',
    times: ['20:00', '08:00'],
  });

  assert.deepEqual(scheduleOccursAt(once, '2026-12-30'), []);
  assert.deepEqual(
    scheduleOccursAt(once, '2026-12-31').map(value => value.toISOString()),
    ['2026-12-31T01:00:00.000Z', '2026-12-31T13:00:00.000Z'],
  );
});
