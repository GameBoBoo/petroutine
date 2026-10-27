"use client";

import { useCallback, useEffect, useState } from 'react';

const VALUES = {
  very_low: 'น้อยมาก', low: 'น้อยกว่าปกติ', usual: 'ตามปกติ', high: 'มากกว่าปกติ', very_high: 'มากมาก',
  normal: 'ปกติ', soft: 'นิ่ม', watery: 'เหลว', hard: 'แข็ง', not_observed: 'ยังไม่พบการขับถ่าย',
  bright: 'สดใส', quiet: 'เงียบกว่าปกติ', restless: 'กระสับกระส่าย', irritable: 'หงุดหงิด',
};

const thaiDate = value => new Date(`${value}T00:00:00+07:00`).toLocaleDateString('th-TH', {
  timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric',
});

function baselineText(metric) {
  if (!metric.baseline) return 'ข้อมูลยังไม่เพียงพอ';
  if (metric.kind === 'numeric') {
    const result = metric.baseline;
    return `ค่ากลาง ${result.typical_value} ${metric.unit} · ช่วง ${result.minimum}–${result.maximum} ${metric.unit}`;
  }
  return `ค่าที่พบบ่อย: ${VALUES[metric.baseline.typical_value] || metric.baseline.typical_value} (${metric.baseline.frequency}/14 วัน)`;
}

function statusText(status) {
  if (status === 'ready') return 'ค่าปกติส่วนตัวพร้อมใช้งาน';
  if (status === 'learning') return 'กำลังเรียนรู้';
  return 'ข้อมูลยังไม่เพียงพอ';
}

export default function WellnessBaseline({ petId, api, refreshKey = 0 }) {
  const [baseline, setBaseline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setBaseline(null);
    try {
      const data = await api(`/pets/${petId}/wellness-baseline`);
      setBaseline(data.baseline); setError('');
    } catch (problem) { setError(problem.message); }
    finally { setLoading(false); }
  }, [api, petId]);
  useEffect(() => { load(); }, [load, refreshKey]);

  if (loading && !baseline) return <section className="baseline-panel baseline-loading" aria-busy="true"><h4>ช่วงเรียนรู้ค่าปกติ 14 วัน</h4><p>กำลังคำนวณจากเช็กอินล่าสุด…</p></section>;
  if (error) return <section className="baseline-panel"><h4>ช่วงเรียนรู้ค่าปกติ 14 วัน</h4><p className="form-error" role="alert">{error} <button onClick={load}>ลองอีกครั้ง</button></p></section>;
  if (!baseline) return null;

  return <section className="baseline-panel" aria-labelledby="baseline-heading">
    <header className="baseline-head"><div><span className={`baseline-status ${baseline.status}`}>{statusText(baseline.status)}</span><h4 id="baseline-heading">ช่วงเรียนรู้ค่าปกติ 14 วัน</h4><p>เรียนรู้ค่าปกติแยกแต่ละข้อมูลจากวันที่ {thaiDate(baseline.window_start)}–{thaiDate(baseline.window_end)}</p></div><div className="baseline-total"><strong>{baseline.observed_days}/14 วันที่มีเช็กอิน</strong><span>{baseline.ready_metrics ? `พร้อม ${baseline.ready_metrics} รายการ` : baseline.remaining_days ? `เหลือ ${baseline.remaining_days} วันก่อนครบช่วง` : 'ยังไม่มีรายการที่พร้อม'}</span></div></header>
    <p className="baseline-note">นับค่าล่าสุดที่บันทึกในแต่ละวัน ช่องที่ไม่ได้กรอกจะไม่นับเป็นศูนย์ ค่าที่ได้ใช้เปรียบเทียบรูปแบบส่วนตัว ไม่ใช่เกณฑ์วินิจฉัยโรค</p>
    <div className="baseline-grid">{baseline.metrics.map(metric => <article key={metric.key} className={`baseline-card ${metric.status}`}>
      <header><h5>{metric.label}</h5><span>{statusText(metric.status)}</span></header>
      <progress value={metric.observed_days} max={baseline.learning_days} aria-label={`${metric.label}: เก็บแล้ว ${metric.observed_days} จาก ${baseline.learning_days} วัน`} />
      <div className="baseline-progress-text"><strong>เก็บแล้ว {metric.observed_days}/14 วัน</strong><span>{metric.remaining_days ? `เหลือ ${metric.remaining_days} วัน` : 'ครบช่วงเรียนรู้แล้ว'}</span></div>
      <p>{baselineText(metric)}</p><p className="muted">{metric.remaining_days ? `บันทึกหัวข้อนี้เพิ่มอีก ${metric.remaining_days} วัน โดยเลือกกรอกเฉพาะสิ่งที่สังเกต คำนวณใหม่เมื่อแก้ไขหรือเก็บบันทึกต้นทาง` : 'ข้อมูล'}</p>
      {metric.source_dates.length > 0 && <details><summary>ดูวันที่ที่ใช้คำนวณ</summary><span>{metric.source_dates.map(thaiDate).join(', ')}</span></details>}
    </article>)}</div>
  </section>;
}
