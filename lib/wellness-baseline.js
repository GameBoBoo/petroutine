import { bangkokDate, validDate } from './calendar.js';

export const LEARNING_DAYS = 14;

export const BASELINE_METRICS = [
  { key: 'food_intake', label: 'การกินอาหาร', kind: 'categorical', order: ['very_low', 'low', 'usual', 'high', 'very_high'] },
  { key: 'water_intake', label: 'การดื่มน้ำ', kind: 'categorical', order: ['very_low', 'low', 'usual', 'high', 'very_high'] },
  { key: 'activity_level', label: 'กิจกรรม', kind: 'categorical', order: ['very_low', 'low', 'usual', 'high', 'very_high'] },
  { key: 'sleep_amount', label: 'การนอน', kind: 'categorical', order: ['very_low', 'low', 'usual', 'high', 'very_high'] },
  { key: 'stool_condition', label: 'การขับถ่าย', kind: 'categorical', order: ['normal', 'soft', 'watery', 'hard', 'not_observed'] },
  { key: 'mood', label: 'อารมณ์', kind: 'categorical', order: ['usual', 'bright', 'quiet', 'restless', 'irritable'] },
  { key: 'weight_kg', label: 'น้ำหนัก', kind: 'numeric', unit: 'kg' },
];

export function shiftDate(date, days) {
  if (!validDate(date)) throw new RangeError('invalid date');
  const value = Date.parse(`${date}T00:00:00.000Z`) + days * 86_400_000;
  return new Date(value).toISOString().slice(0, 10);
}

export function baselineWindow(asOf) {
  if (!validDate(asOf)) throw new RangeError('invalid date');
  return { from: shiftDate(asOf, -(LEARNING_DAYS - 1)), to: asOf };
}

function rounded(value) {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

function numericBaseline(values) {
  const ordered = values.map(Number).sort((left, right) => left - right);
  const middle = Math.floor(ordered.length / 2);
  const median = ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
  return {
    method: 'median',
    typical_value: rounded(median),
    average: rounded(ordered.reduce((sum, value) => sum + value, 0) / ordered.length),
    minimum: rounded(ordered[0]),
    maximum: rounded(ordered.at(-1)),
  };
}

function categoricalBaseline(values, order) {
  const distribution = Object.fromEntries(order.map(value => [value, 0]));
  for (const value of values) distribution[value] = (distribution[value] || 0) + 1;
  let typical = order[0];
  for (const value of order) {
    if ((distribution[value] || 0) > (distribution[typical] || 0)) typical = value;
  }
  return { method: 'mode', typical_value: typical, frequency: distribution[typical], distribution };
}

function metricResult(definition, samples) {
  const observedDays = samples.length;
  const ready = observedDays >= LEARNING_DAYS;
  return {
    key: definition.key,
    label: definition.label,
    kind: definition.kind,
    unit: definition.unit || null,
    status: ready ? 'ready' : observedDays ? 'learning' : 'insufficient_data',
    observed_days: observedDays,
    remaining_days: Math.max(0, LEARNING_DAYS - observedDays),
    source_dates: samples.map(sample => sample.date),
    source_log_ids: samples.map(sample => sample.log_id),
    baseline: ready
      ? definition.kind === 'numeric'
        ? numericBaseline(samples.map(sample => sample.value))
        : categoricalBaseline(samples.map(sample => sample.value), definition.order)
      : null,
  };
}

export function computeWellnessBaseline(rows, { asOf }) {
  const window = baselineWindow(asOf);
  const samplesByMetric = new Map(BASELINE_METRICS.map(metric => [metric.key, new Map()]));
  const orderedRows = [...rows].sort((left, right) => {
    const time = new Date(left.recorded_at).getTime() - new Date(right.recorded_at).getTime();
    return time || String(left.id).localeCompare(String(right.id));
  });

  for (const row of orderedRows) {
    const date = bangkokDate(new Date(row.recorded_at));
    if (date < window.from || date > window.to) continue;
    for (const definition of BASELINE_METRICS) {
      if (row[definition.key] == null) continue;
      samplesByMetric.get(definition.key).set(date, {
        date,
        log_id: row.id,
        value: definition.kind === 'numeric' ? Number(row[definition.key]) : row[definition.key],
      });
    }
  }

  const metrics = BASELINE_METRICS.map(definition => metricResult(
    definition,
    [...samplesByMetric.get(definition.key).values()].sort((left, right) => left.date.localeCompare(right.date)),
  ));
  const observedDates = new Set(metrics.flatMap(metric => metric.source_dates));
  const readyMetrics = metrics.filter(metric => metric.status === 'ready').length;
  return {
    status: readyMetrics ? 'ready' : observedDates.size ? 'learning' : 'insufficient_data',
    as_of: asOf,
    timezone: 'Asia/Bangkok',
    learning_days: LEARNING_DAYS,
    window_start: window.from,
    window_end: window.to,
    observed_days: observedDates.size,
    remaining_days: Math.max(0, LEARNING_DAYS - observedDates.size),
    ready_metrics: readyMetrics,
    metrics,
  };
}
