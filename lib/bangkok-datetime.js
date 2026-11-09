const DATE_TIME_FORMAT = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Bangkok',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

export function bangkokDateTimeInput(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  return DATE_TIME_FORMAT.format(date).replace(' ', 'T');
}

export function bangkokDateTimeToIso(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    throw new TypeError('Expected a Bangkok local date and time in YYYY-MM-DDTHH:mm format');
  }
  const date = new Date(`${value}:00+07:00`);
  if (!Number.isFinite(date.getTime()) || bangkokDateTimeInput(date) !== value) {
    throw new TypeError('Invalid Bangkok local date and time');
  }
  return date.toISOString();
}
