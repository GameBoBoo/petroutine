const DAY_MS = 86_400_000;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export class ScheduleValidationError extends Error {
  constructor(fields) {
    super('ข้อมูลกำหนดการไม่ถูกต้อง');
    this.name = 'ScheduleValidationError';
    this.fields = fields;
  }
}

function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function dayNumber(date) {
  return Date.parse(`${date}T00:00:00.000Z`) / DAY_MS;
}

function normalizeTimes(input) {
  const values = Array.isArray(input.times)
    ? input.times
    : [typeof input.time === 'string' ? input.time : '09:00'];
  if (!values.length || values.some(value => typeof value !== 'string' || !TIME_PATTERN.test(value))) {
    throw new ScheduleValidationError({ times: 'กรุณาระบุเวลาในรูปแบบ HH:mm' });
  }
  if (new Set(values).size !== values.length) {
    throw new ScheduleValidationError({ times: 'เวลาในกิจวัตรต้องไม่ซ้ำกัน' });
  }
  return [...values].sort();
}

function normalizePauses(pauses) {
  if (pauses == null) return [];
  if (!Array.isArray(pauses)) throw new ScheduleValidationError({ pauses: 'ช่วงพักไม่ถูกต้อง' });
  const normalized = pauses.map(pause => {
    if (!pause || !validDate(pause.from) || !validDate(pause.to) || pause.from > pause.to) {
      throw new ScheduleValidationError({ pauses: 'ช่วงพักต้องมีวันเริ่มและวันสิ้นสุดที่ถูกต้อง' });
    }
    return { from: pause.from, to: pause.to };
  }).sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));

  return normalized.reduce((result, pause) => {
    const previous = result.at(-1);
    if (previous && pause.from <= previous.to) {
      if (pause.to > previous.to) previous.to = pause.to;
    } else {
      result.push({ ...pause });
    }
    return result;
  }, []);
}

export function normalizeSchedule(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ScheduleValidationError({ schedule: 'กรุณาระบุกำหนดการ' });
  }
  const type = input.type || 'weekly';
  if (!['weekly', 'interval', 'once'].includes(type)) {
    throw new ScheduleValidationError({ type: 'รูปแบบกำหนดการไม่ถูกต้อง' });
  }
  const times = normalizeTimes(input);
  const pauses = normalizePauses(input.pauses);

  if (type === 'once') {
    if (!validDate(input.date)) throw new ScheduleValidationError({ date: 'วันที่นัดหมายไม่ถูกต้อง' });
    return {
      version: 2,
      type,
      date: input.date,
      times,
      start_date: input.date,
      end_date: input.date,
      pauses,
    };
  }

  const startDate = input.start_date ?? null;
  const endDate = input.end_date ?? null;
  if (startDate !== null && !validDate(startDate)) {
    throw new ScheduleValidationError({ start_date: 'วันเริ่มต้นไม่ถูกต้อง' });
  }
  if (endDate !== null && !validDate(endDate)) {
    throw new ScheduleValidationError({ end_date: 'วันสิ้นสุดไม่ถูกต้อง' });
  }
  if (startDate && endDate && endDate < startDate) {
    throw new ScheduleValidationError({ end_date: 'วันสิ้นสุดต้องไม่อยู่ก่อนวันเริ่มต้น' });
  }

  if (type === 'interval') {
    if (!startDate) throw new ScheduleValidationError({ start_date: 'กำหนดการทุก X วันต้องมีวันเริ่มต้น' });
    if (!Number.isInteger(input.interval_days) || input.interval_days < 1 || input.interval_days > 365) {
      throw new ScheduleValidationError({ interval_days: 'จำนวนวันต้องอยู่ระหว่าง 1–365' });
    }
    return {
      version: 2,
      type,
      times,
      interval_days: input.interval_days,
      start_date: startDate,
      end_date: endDate,
      pauses,
    };
  }

  const days = input.days === undefined ? [0, 1, 2, 3, 4, 5, 6] : input.days;
  if (!Array.isArray(days) || !days.length || days.some(day => !Number.isInteger(day) || day < 0 || day > 6) || new Set(days).size !== days.length) {
    throw new ScheduleValidationError({ days: 'กรุณาเลือกวันในสัปดาห์อย่างน้อยหนึ่งวันโดยไม่ซ้ำ' });
  }
  return {
    version: 2,
    type,
    times,
    days: [...days].sort((a, b) => a - b),
    start_date: startDate,
    end_date: endDate,
    pauses,
  };
}

export function isSchedulePaused(schedule, date) {
  if (!validDate(date)) return false;
  const normalized = schedule?.version === 2 ? schedule : normalizeSchedule(schedule);
  return normalized.pauses.some(pause => pause.from <= date && date <= pause.to);
}

function occursOnDate(schedule, date) {
  if (schedule.start_date && date < schedule.start_date) return false;
  if (schedule.end_date && date > schedule.end_date) return false;
  if (schedule.pauses.some(pause => pause.from <= date && date <= pause.to)) return false;
  if (schedule.type === 'once') return schedule.date === date;
  if (schedule.type === 'interval') {
    const offset = dayNumber(date) - dayNumber(schedule.start_date);
    return offset >= 0 && offset % schedule.interval_days === 0;
  }
  const weekday = new Date(`${date}T12:00:00.000Z`).getUTCDay();
  return schedule.days.includes(weekday);
}

export function scheduleOccursAt(schedule, date) {
  if (!validDate(date)) return [];
  const normalized = normalizeSchedule(schedule);
  if (!occursOnDate(normalized, date)) return [];
  return normalized.times.map(time => new Date(`${date}T${time}:00+07:00`));
}

export function occurrencesInRange(schedule, from, to) {
  if (!validDate(from) || !validDate(to)) throw new RangeError('invalid date range');
  const count = dayNumber(to) - dayNumber(from) + 1;
  if (count < 1 || count > 42) throw new RangeError('invalid range');
  const normalized = normalizeSchedule(schedule);
  const result = [];
  for (let index = 0; index < count; index += 1) {
    const date = new Date(Date.parse(`${from}T00:00:00.000Z`) + index * DAY_MS).toISOString().slice(0, 10);
    if (!occursOnDate(normalized, date)) continue;
    for (const time of normalized.times) {
      result.push({ date, time, scheduledAt: new Date(`${date}T${time}:00+07:00`) });
    }
  }
  return result;
}
