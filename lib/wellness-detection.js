import { bangkokDate } from './calendar.js';
import { BASELINE_METRICS, computeWellnessBaseline, shiftDate } from './wellness-baseline.js';

export const DETECTION_DAYS = 3;
export const RESOLUTION_DAYS = 2;
export const WEIGHT_THRESHOLD_PERCENT = 10;

const RELATIVE_METRICS = new Set(['food_intake', 'water_intake', 'activity_level', 'sleep_amount']);

function definitionFor(metric) {
  const definition = BASELINE_METRICS.find(item => item.key === metric);
  if (!definition) throw new RangeError('unknown metric');
  return definition;
}

export function dailyMetricSamples(rows, metric) {
  const definition = definitionFor(metric);
  const byDate = new Map();
  const ordered = [...rows].sort((left, right) => {
    const time = new Date(left.recorded_at).getTime() - new Date(right.recorded_at).getTime();
    return time || String(left.id).localeCompare(String(right.id));
  });
  for (const row of ordered) {
    if (row[metric] == null) continue;
    const date = bangkokDate(new Date(row.recorded_at));
    byDate.set(date, {
      date,
      log_id: row.id,
      value: definition.kind === 'numeric' ? Number(row[metric]) : row[metric],
    });
  }
  return [...byDate.values()].sort((left, right) => left.date.localeCompare(right.date));
}

function consecutiveEnding(samples, end, count) {
  const byDate = new Map(samples.map(sample => [sample.date, sample]));
  const dates = Array.from({ length: count }, (_, index) => shiftDate(end, index - count + 1));
  const values = dates.map(date => byDate.get(date));
  return values.every(Boolean) ? values : null;
}

function relativeChange(definition, baseline, observations) {
  const center = definition.order.indexOf(baseline.typical_value);
  const deviations = observations.map(sample => definition.order.indexOf(sample.value) - center);
  if (deviations.every(value => value >= 1)) return { direction: 'above', deviations };
  if (deviations.every(value => value <= -1)) return { direction: 'below', deviations };
  return null;
}

function categoryChange(baseline, observations) {
  if (observations.every(sample => sample.value !== baseline.typical_value)
      && new Set(observations.map(sample => sample.value)).size === 1) {
    return { direction: 'changed', deviations: observations.map(() => null) };
  }
  return null;
}

function weightChange(baseline, observations) {
  const center = Number(baseline.typical_value);
  const percentages = observations.map(sample => ((sample.value - center) / center) * 100);
  if (percentages.every(value => value >= WEIGHT_THRESHOLD_PERCENT)) return { direction: 'above', deviations: percentages };
  if (percentages.every(value => value <= -WEIGHT_THRESHOLD_PERCENT)) return { direction: 'below', deviations: percentages };
  return null;
}

function rounded(value) {
  return value == null ? null : Math.round((value + Number.EPSILON) * 100) / 100;
}

function dateOnly(value) {
  if (typeof value === 'string') return value.slice(0, 10);
  return bangkokDate(new Date(value));
}

export function evaluateMetricChange(rows, metric) {
  const definition = definitionFor(metric);
  const samples = dailyMetricSamples(rows, metric);
  if (samples.length < DETECTION_DAYS) return null;
  const observationEnd = samples.at(-1).date;
  const observations = consecutiveEnding(samples, observationEnd, DETECTION_DAYS);
  if (!observations) return null;
  const observationStart = observations[0].date;
  const baselineEnd = shiftDate(observationStart, -1);
  const computed = computeWellnessBaseline(rows, { asOf: baselineEnd });
  const baselineMetric = computed.metrics.find(item => item.key === metric);
  if (baselineMetric.status !== 'ready' || !baselineMetric.baseline) return null;

  const change = definition.kind === 'numeric'
    ? weightChange(baselineMetric.baseline, observations)
    : RELATIVE_METRICS.has(metric)
      ? relativeChange(definition, baselineMetric.baseline, observations)
      : categoryChange(baselineMetric.baseline, observations);
  if (!change) return null;

  const ruleCode = definition.kind === 'numeric'
    ? 'weight_percent_consecutive'
    : RELATIVE_METRICS.has(metric) ? 'relative_consecutive' : 'category_consecutive';
  const ruleText = definition.kind === 'numeric'
    ? `น้ำหนักเบี่ยงจากค่ากลางอย่างน้อย ${WEIGHT_THRESHOLD_PERCENT}% ในทิศทางเดียวกัน ${DETECTION_DAYS} วันต่อเนื่อง`
    : RELATIVE_METRICS.has(metric)
      ? `ค่าขยับจากค่าปกติอย่างน้อย 1 ระดับในทิศทางเดียวกัน ${DETECTION_DAYS} วันต่อเนื่อง`
      : `พบค่าใหม่ชนิดเดียวกันต่างจากค่าปกติ ${DETECTION_DAYS} วันต่อเนื่อง`;
  const observationEvidence = observations.map((sample, index) => ({
    date: sample.date,
    value: sample.value,
    log_id: sample.log_id,
    deviation: rounded(change.deviations[index]),
  }));
  return {
    metric,
    metric_label: definition.label,
    rule_code: ruleCode,
    rule_text: ruleText,
    direction: change.direction,
    baseline_start: computed.window_start,
    baseline_end: computed.window_end,
    observation_start: observationStart,
    observation_end: observationEnd,
    baseline_value: baselineMetric.baseline,
    observed_value: { values: observations.map(sample => sample.value), unit: definition.unit || null },
    evidence: {
      rule_text: ruleText,
      baseline_source_dates: baselineMetric.source_dates,
      baseline_source_log_ids: baselineMetric.source_log_ids,
      observations: observationEvidence,
    },
    source_log_ids: [...new Set([...baselineMetric.source_log_ids, ...observations.map(sample => sample.log_id)])],
  };
}

export function evaluateAlertResolution(rows, alert) {
  const definition = definitionFor(alert.metric);
  const samples = dailyMetricSamples(rows, alert.metric).filter(sample => sample.date > dateOnly(alert.observation_end));
  if (samples.length < RESOLUTION_DAYS) return null;
  const latest = consecutiveEnding(samples, samples.at(-1).date, RESOLUTION_DAYS);
  if (!latest) return null;
  const baseline = alert.baseline_value;
  const normal = definition.kind === 'numeric'
    ? latest.every(sample => Math.abs(((sample.value - Number(baseline.typical_value)) / Number(baseline.typical_value)) * 100) < WEIGHT_THRESHOLD_PERCENT)
    : latest.every(sample => sample.value === baseline.typical_value);
  if (!normal) return null;
  return {
    dates: latest.map(sample => sample.date),
    values: latest.map(sample => sample.value),
    source_log_ids: latest.map(sample => sample.log_id),
  };
}
