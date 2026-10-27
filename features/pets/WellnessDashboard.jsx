"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from '../../components/Modal.jsx';

const VALUE_NAMES = {
  very_low: 'น้อยมาก', low: 'น้อยกว่าปกติ', usual: 'ตามปกติ', high: 'มากกว่าปกติ', very_high: 'มากมาก',
  normal: 'ปกติ', soft: 'นิ่ม', watery: 'เหลว', hard: 'แข็ง', not_observed: 'ยังไม่พบการขับถ่าย',
  bright: 'สดใส', quiet: 'เงียบกว่าปกติ', restless: 'กระสับกระส่าย', irritable: 'หงุดหงิด',
};
const AXIS_NAMES = {
  very_low: 'น้อยมาก', low: 'น้อย', usual: 'ปกติ', high: 'มาก', very_high: 'มากมาก',
  normal: 'ปกติ', soft: 'นิ่ม', watery: 'เหลว', hard: 'แข็ง', not_observed: 'ไม่พบ',
  bright: 'สดใส', quiet: 'เงียบ', restless: 'กระสับกระส่าย', irritable: 'หงุดหงิด',
};
const METRIC_NAMES = {
  food_intake: 'การกินอาหาร', water_intake: 'การดื่มน้ำ', activity_level: 'กิจกรรม', sleep_amount: 'การนอน',
  stool_condition: 'การขับถ่าย', mood: 'อารมณ์', weight_kg: 'น้ำหนัก',
};
const STATUS = {
  learning: ['กำลังเรียนรู้', 'บันทึกต่อเนื่องเพื่อสร้างค่าปกติส่วนตัว'],
  stable: ['คงที่', 'ข้อมูลที่มีอยู่ยังไม่พบแนวโน้มเปลี่ยนแปลงต่อเนื่อง'],
  changes_detected: ['พบการเปลี่ยนแปลง', 'มีแนวโน้มต่อเนื่องที่ควรสังเกตและติดตาม'],
  insufficient_data: ['ข้อมูลยังไม่เพียงพอ', 'เริ่มเช็กอินเพื่อให้ระบบเรียนรู้ค่าปกติส่วนตัว'],
};

const dateText = value => new Date(`${value}T00:00:00+07:00`).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric' });
const shortDate = value => new Date(`${value}T00:00:00+07:00`).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short' });
const dayNumber = value => Math.floor(Date.parse(`${value}T00:00:00Z`) / 86_400_000);

function displayValue(value, metric) {
  if (value == null) return 'ไม่มีข้อมูล';
  return metric.kind === 'numeric' ? `${Number(value).toLocaleString('th-TH')} ${metric.unit}` : VALUE_NAMES[value] || value;
}

function chartSegments(points) {
  const segments = [];
  for (const point of points) {
    const latest = segments.at(-1);
    if (!latest || dayNumber(point.date) - dayNumber(latest.at(-1).date) > 1) segments.push([point]);
    else latest.push(point);
  }
  return segments;
}

function TrendChart({ metric, from, to, rangeDays }) {
  const width = 720; const height = 260;
  const pad = { left: 96, right: 22, top: 22, bottom: 42 };
  const chartWidth = width - pad.left - pad.right;
  const chartHeight = height - pad.top - pad.bottom;
  const domain = useMemo(() => {
    if (metric.kind === 'categorical') return { min: 0, max: Math.max(1, metric.scale.length - 1) };
    const values = [...metric.points.map(point => Number(point.plot_value))];
    if (metric.baseline_band) values.push(metric.baseline_band.minimum, metric.baseline_band.maximum);
    if (!values.length) return { min: 0, max: 1 };
    let min = Math.min(...values); let max = Math.max(...values);
    if (min === max) { const space = Math.max(Math.abs(min) * .05, .5); min -= space; max += space; }
    return { min, max };
  }, [metric]);
  const x = date => pad.left + ((dayNumber(date) - dayNumber(from)) / Math.max(1, rangeDays - 1)) * chartWidth;
  const y = value => pad.top + (1 - (Number(value) - domain.min) / (domain.max - domain.min)) * chartHeight;
  const segments = chartSegments(metric.points);
  const ticks = metric.kind === 'categorical'
    ? metric.scale.map((value, index) => ({ value: index, label: AXIS_NAMES[value] || value }))
    : [domain.max, (domain.max + domain.min) / 2, domain.min].map(value => ({ value, label: Number(value.toFixed(2)).toLocaleString('th-TH') }));
  const baselineTop = metric.baseline_band ? y(metric.baseline_band.maximum) : null;
  const baselineBottom = metric.baseline_band ? y(metric.baseline_band.minimum) : null;
  const summary = `${metric.label}: มีข้อมูล ${metric.observed_days} จาก ${rangeDays} วัน${metric.latest ? ` ค่าล่าสุด ${displayValue(metric.latest.value, metric)}` : ''}${metric.baseline_band ? ` ค่าปกติ ${displayValue(metric.baseline_band.typical_value, metric)}` : ''}`;
  return <div className="trend-chart-wrap">
    {metric.points.length ? <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={summary}>
      {metric.baseline_band && <g aria-hidden="true"><rect className="chart-baseline-band" x={pad.left} y={Math.min(baselineTop, baselineBottom) - 2} width={chartWidth} height={Math.max(4, Math.abs(baselineBottom - baselineTop) + 4)} /><line className="chart-baseline-line" x1={pad.left} x2={width - pad.right} y1={y(metric.baseline_band.typical)} y2={y(metric.baseline_band.typical)} /></g>}
      {ticks.map(tick => <g key={tick.value} aria-hidden="true"><line className="chart-grid-line" x1={pad.left} x2={width - pad.right} y1={y(tick.value)} y2={y(tick.value)} /><text className="chart-y-label" x={pad.left - 9} y={y(tick.value) + 4} textAnchor="end">{tick.label}</text></g>)}
      {segments.map((segment, index) => segment.length > 1 && <polyline key={index} className="chart-trend-line" points={segment.map(point => `${x(point.date)},${y(point.plot_value)}`).join(' ')} />)}
      {metric.points.map(point => <circle key={`${point.date}:${point.log_id}`} className="chart-point" cx={x(point.date)} cy={y(point.plot_value)} r={rangeDays >= 30 ? 4 : 6}><title>{dateText(point.date)}: {displayValue(point.value, metric)}</title></circle>)}
      <text className="chart-x-label" x={pad.left} y={height - 9}>{shortDate(from)}</text><text className="chart-x-label" x={width - pad.right} y={height - 9} textAnchor="end">{shortDate(to)}</text>
    </svg> : <div className="chart-empty" role="status"><strong>ยังไม่มีข้อมูลในช่วงนี้</strong><span>ช่องว่างจะไม่ถูกแทนเป็นศูนย์หรือค่าที่คาดเดา</span></div>}
    <div className="chart-legend" aria-label="คำอธิบายกราฟ"><span><i className="legend-line" aria-hidden="true" />ข้อมูลที่บันทึก</span>{metric.baseline_band && <span><i className="legend-band" aria-hidden="true" />ช่วงค่าปกติ</span>}<span><i className="legend-gap" aria-hidden="true" />ช่วงไม่มีข้อมูล</span></div>
  </div>;
}

function MetricCard({ metric, dashboard }) {
  const [tableOpen, setTableOpen] = useState(false);
  const statusText = STATUS[metric.status]?.[0] || metric.status;
  return <article className={`dashboard-metric-card metric-${metric.status}`}>
    <header><div><h4>{metric.label}</h4><p>{metric.latest ? `ล่าสุด ${displayValue(metric.latest.value, metric)} · ${dateText(metric.latest.date)}` : 'ยังไม่มีข้อมูลในช่วงนี้'}</p></div><span className="metric-status">{statusText}</span></header>
    <TrendChart metric={metric} from={dashboard.window_start} to={dashboard.window_end} rangeDays={dashboard.range_days} />
    <div className="metric-detail">
      <p className="chart-summary">{metric.baseline_band ? `ค่าปกติส่วนตัว: ${displayValue(metric.baseline_band.typical_value, metric)} · ช่วง ${displayValue(metric.baseline_band.minimum_value, metric)}–${displayValue(metric.baseline_band.maximum_value, metric)}` : `เก็บข้อมูลในช่วงนี้ ${metric.observed_days} วัน · ค่าปกติส่วนตัวยังไม่พร้อม`}</p>
      <button type="button" className="chart-table-open" onClick={() => setTableOpen(true)}>ดูข้อมูลแบบตาราง</button>
    </div>
    {tableOpen && <Modal title={`ข้อมูล${metric.label}`} description={`ช่วง ${dateText(dashboard.window_start)}–${dateText(dashboard.window_end)}`} onClose={() => setTableOpen(false)}>
      {metric.points.length ? <div className="table-scroll"><table><caption className="sr-only">ข้อมูลแนวโน้ม{metric.label}</caption><thead><tr><th scope="col">วันที่</th><th scope="col">ค่าที่บันทึก</th></tr></thead><tbody>{metric.points.map(point => <tr key={point.log_id}><td>{dateText(point.date)}</td><td>{displayValue(point.value, metric)}</td></tr>)}</tbody></table></div> : <p>ไม่มีข้อมูลในช่วงที่เลือก</p>}
    </Modal>}
  </article>;
}

export default function WellnessDashboard({ petId, api, onOpenCheckIn }) {
  const [selectedMetrics,setSelectedMetrics]=useState([]);
  const [range, setRange] = useState(14);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try { const data = await api(`/pets/${petId}/wellness-dashboard?range=${range}`); setDashboard(data.dashboard); setError(''); }
    catch (problem) { setError(problem.message); }
    finally { setLoading(false); }
  }, [api, petId, range]);
  useEffect(() => { setDashboard(null); load(); }, [load]);

  if (loading && !dashboard) return <section className="wellness-dashboard dashboard-loading" aria-busy="true"><div className="dashboard-skeleton" /><div className="dashboard-skeleton tall" /><p role="status">กำลังสร้างภาพรวมสุขภาพ…</p></section>;
  if (error && !dashboard) return <section className="wellness-dashboard"><p className="form-error" role="alert">{error} <button onClick={load}>ลองอีกครั้ง</button></p></section>;
  if (!dashboard) return null;
  const [statusTitle, statusDetail] = STATUS[dashboard.status] || [dashboard.status, ''];
  return <section className="wellness-dashboard" aria-labelledby="dashboard-title">
    <header className="dashboard-heading"><div><span className="section-kicker">แนวโน้มสุขภาพ</span><h3 id="dashboard-title">ภาพรวมสุขภาวะ</h3><p>ดูแนวโน้มจากข้อมูลที่บันทึกจริง โดยไม่เติมค่าของวันที่ไม่มีข้อมูล</p></div><div className="dashboard-range" role="group" aria-label="เลือกช่วงแนวโน้ม">{[7, 14, 30, 90].map(days => <button type="button" key={days} aria-pressed={range === days} onClick={() => setRange(days)}>{days} วัน</button>)}</div></header>
    {error && <p className="form-error" role="alert">{error} <button onClick={load}>ลองอีกครั้ง</button></p>}
    <section className={`wellness-state state-${dashboard.status}`} aria-labelledby="wellness-state-title"><div><span className="state-label">สถานะวันนี้</span><h4 id="wellness-state-title">{statusTitle}</h4><p>{statusDetail}</p></div><dl><div><dt>วันที่มีข้อมูล</dt><dd>{dashboard.observed_days}/{dashboard.range_days}</dd></div><div><dt>ค่าปกติส่วนตัวพร้อม</dt><dd>{dashboard.ready_metrics}/7</dd></div><div><dt>รายการติดตาม</dt><dd>{dashboard.active_alert_count}</dd></div></dl></section>
    {dashboard.active_alerts.length > 0 && <section className="dashboard-alert-summary" aria-labelledby="dashboard-alert-title"><header><div><h4 id="dashboard-alert-title">กำลังติดตาม {dashboard.active_alert_count} รายการ</h4><p>เปิดเช็กอินเพื่อดูหลักฐาน รับทราบ หรืออัปเดตการติดตาม</p></div><button className="button secondary" onClick={onOpenCheckIn}>ดูรายการติดตาม</button></header><div>{dashboard.active_alerts.map(alert => <article key={alert.id}><strong>{METRIC_NAMES[alert.metric] || alert.metric}</strong><span>{alert.rule_text}</span><small>{dateText(alert.observation_start)}–{dateText(alert.observation_end)}</small></article>)}</div></section>}
    <div className="dashboard-section-title"><div><h3>ข้อมูลล่าสุด</h3><p>{dateText(dashboard.window_start)}–{dateText(dashboard.window_end)} · เลือกหัวข้อเพื่อเปิดกราฟและรายละเอียด</p></div>{loading && <span role="status">กำลังอัปเดต…</span>}</div>
    <fieldset className="metric-picker"><legend>หัวข้อที่ต้องการดู (ไม่เลือก = ทุกหัวข้อ)</legend>{dashboard.metrics.map(metric=><label className="checkbox-row" key={metric.key}><input type="checkbox" checked={selectedMetrics.includes(metric.key)} onChange={e=>setSelectedMetrics(current=>e.target.checked?[...current,metric.key]:current.filter(k=>k!==metric.key))}/>{metric.label}</label>)}</fieldset><p className="muted">มีข้อมูล {dashboard.observed_days} จาก {dashboard.range_days} วัน · วันที่ว่างหมายถึงไม่ได้บันทึก</p><div className="dashboard-metric-grid">{dashboard.metrics.filter(metric=>!selectedMetrics.length||selectedMetrics.includes(metric.key)).map(metric => <MetricCard key={metric.key} metric={metric} dashboard={dashboard} />)}</div>
    <p className="wellness-disclaimer">ภาพรวมนี้ช่วยสังเกตรูปแบบจากข้อมูลที่ครอบครัวบันทึก ไม่ใช่การวินิจฉัย หากกังวลหรือมีอาการฉุกเฉินควรติดต่อสัตวแพทย์</p>
  </section>;
}
