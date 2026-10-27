import { bangkokDate } from './calendar.js';
import { BASELINE_METRICS, computeWellnessBaseline, shiftDate } from './wellness-baseline.js';
import { dailyMetricSamples } from './wellness-detection.js';

export const DASHBOARD_RANGES = [7, 14, 30, 90];

function categoricalBand(definition, baseline) {
  const observed = definition.order
    .map((value, index) => ({ value, index, count: baseline.distribution?.[value] || 0 }))
    .filter(item => item.count > 0);
  return {
    minimum: observed[0]?.index ?? null,
    maximum: observed.at(-1)?.index ?? null,
    typical: definition.order.indexOf(baseline.typical_value),
    minimum_value: observed[0]?.value ?? null,
    maximum_value: observed.at(-1)?.value ?? null,
    typical_value: baseline.typical_value,
  };
}

function numericBand(baseline) {
  return {
    minimum: Number(baseline.minimum),
    maximum: Number(baseline.maximum),
    typical: Number(baseline.typical_value),
    minimum_value: Number(baseline.minimum),
    maximum_value: Number(baseline.maximum),
    typical_value: Number(baseline.typical_value),
  };
}

function alertDate(value) {
  if (typeof value === 'string') return value.slice(0, 10);
  return value ? bangkokDate(new Date(value)) : null;
}

function publicAlert(alert) {
  return {
    id: alert.id,
    metric: alert.metric,
    rule_code: alert.rule_code,
    direction: alert.direction,
    status: alert.status,
    observation_start: alertDate(alert.observation_start),
    observation_end: alertDate(alert.observation_end),
    rule_text: alert.evidence?.rule_text || null,
  };
}

export function computeWellnessDashboard(rows, alerts, { asOf, rangeDays }) {
  if (!DASHBOARD_RANGES.includes(rangeDays)) throw new RangeError('invalid range');
  const windowStart = shiftDate(asOf, -(rangeDays - 1));
  const baseline = computeWellnessBaseline(rows, { asOf });
  const activeAlerts = alerts.filter(alert => alert.status !== 'resolved' && (!alert.observation_end || alertDate(alert.observation_end) <= asOf));
  const activeByMetric = new Map(activeAlerts.map(alert => [alert.metric, alert]));

  const metrics = BASELINE_METRICS.map(definition => {
    const baselineMetric = baseline.metrics.find(item => item.key === definition.key);
    const points = dailyMetricSamples(rows, definition.key)
      .filter(sample => sample.date >= windowStart && sample.date <= asOf)
      .map(sample => ({
        ...sample,
        plot_value: definition.kind === 'numeric' ? Number(sample.value) : definition.order.indexOf(sample.value),
      }));
    const activeAlert = activeByMetric.get(definition.key);
    const status = activeAlert
      ? 'changes_detected'
      : baselineMetric.status === 'ready' ? 'stable' : baselineMetric.status;
    return {
      key: definition.key,
      label: definition.label,
      kind: definition.kind,
      unit: definition.unit || null,
      status,
      scale: definition.kind === 'categorical' ? definition.order : null,
      observed_days: points.length,
      latest: points.at(-1) || null,
      points,
      baseline: baselineMetric.baseline,
      baseline_band: baselineMetric.baseline
        ? definition.kind === 'numeric' ? numericBand(baselineMetric.baseline) : categoricalBand(definition, baselineMetric.baseline)
        : null,
      active_alert: activeAlert ? publicAlert(activeAlert) : null,
    };
  });

  const observedDates = new Set(metrics.flatMap(metric => metric.points.map(point => point.date)));
  const status = activeAlerts.length
    ? 'changes_detected'
    : baseline.ready_metrics ? 'stable' : baseline.observed_days ? 'learning' : 'insufficient_data';
  return {
    status,
    as_of: asOf,
    timezone: 'Asia/Bangkok',
    range_days: rangeDays,
    window_start: windowStart,
    window_end: asOf,
    observed_days: observedDates.size,
    missing_days: rangeDays - observedDates.size,
    ready_metrics: baseline.ready_metrics,
    active_alert_count: activeAlerts.length,
    baseline_window_start: baseline.window_start,
    baseline_window_end: baseline.window_end,
    metrics,
    active_alerts: activeAlerts.map(publicAlert),
  };
}
