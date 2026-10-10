import { scheduleOccursAt } from './schedule.js';

const DAY_MS = 86_400_000;

export function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function bangkokDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function formatBangkokTime(value) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(value));
}

export function datesInRange(from, to) {
  if (!validDate(from) || !validDate(to)) throw new RangeError('invalid date');
  const start = Date.parse(`${from}T00:00:00.000Z`);
  const end = Date.parse(`${to}T00:00:00.000Z`);
  const count = Math.floor((end - start) / DAY_MS) + 1;
  if (count < 1 || count > 42) throw new RangeError('invalid range');
  return Array.from({ length: count }, (_, index) => new Date(start + index * DAY_MS).toISOString().slice(0, 10));
}

export function occursOn(schedule, date) {
  return scheduleOccursAt(schedule, date).length > 0;
}

export function scheduledAt(date, time) {
  if (!validDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new RangeError('invalid date or time');
  return new Date(`${date}T${time}:00+07:00`);
}
