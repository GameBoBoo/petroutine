"use client";
import { useConfirmation } from '../../components/ConfirmationProvider.jsx';
import DatePicker from '../../components/DatePicker.jsx';
import DateTimePicker from '../../components/DateTimePicker.jsx';

import { useCallback, useEffect, useRef, useState } from 'react';
import Pagination from '../../components/Pagination.jsx';
import WellnessBaseline from './WellnessBaseline.jsx';
import WellnessAlerts from './WellnessAlerts.jsx';

const RELATIVE_OPTIONS = [
  ['', 'ไม่ได้บันทึก'],
  ['very_low', 'น้อยกว่าปกติมาก'],
  ['low', 'น้อยกว่าปกติ'],
  ['usual', 'ตามปกติ'],
  ['high', 'มากกว่าปกติ'],
  ['very_high', 'มากกว่าปกติมาก'],
];
const STOOL_OPTIONS = [['', 'ไม่ได้บันทึก'], ['normal', 'ปกติ'], ['soft', 'นิ่ม'], ['watery', 'เหลว'], ['hard', 'แข็ง'], ['not_observed', 'ยังไม่พบการขับถ่าย']];
const MOOD_OPTIONS = [['', 'ไม่ได้บันทึก'], ['usual', 'ตามปกติ'], ['bright', 'สดใส'], ['quiet', 'เงียบกว่าปกติ'], ['restless', 'กระสับกระส่าย'], ['irritable', 'หงุดหงิด']];
const EMPTY = { recorded_at: '', food_intake: '', water_intake: '', activity_level: '', sleep_amount: '', stool_condition: '', mood: '', weight_kg: '', notes: '' };

const labelFrom = (options, value) => options.find(([key]) => key === value)?.[1] || value;
const bangkokInput = value => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false,
}).format(value ? new Date(value) : new Date()).replace(' ', 'T');
const bangkokIso = value => new Date(`${value}:00+07:00`).toISOString();
const SCALE_FIELDS = [
  ['food_intake', 'การกินอาหาร', RELATIVE_OPTIONS],
  ['water_intake', 'การดื่มน้ำ', RELATIVE_OPTIONS],
  ['activity_level', 'กิจกรรม', RELATIVE_OPTIONS],
  ['sleep_amount', 'การนอน', RELATIVE_OPTIONS],
  ['stool_condition', 'การขับถ่าย', STOOL_OPTIONS],
  ['mood', 'อารมณ์', MOOD_OPTIONS],
];
const SCALE_VALUE_COLORS = {
  very_low: 'very-low', low: 'low', usual: 'usual', high: 'high', very_high: 'very-high',
  not_observed: 'unset', normal: 'usual', soft: 'low', watery: 'very-low', hard: 'high',
  bright: 'high', quiet: 'low', restless: 'very-low', irritable: 'very-low',
};
const scalePosition = (value, options) => Math.max(0, options.findIndex(([key]) => key === value));
const scaleClass = value => SCALE_VALUE_COLORS[value] || '';

export function WellnessLogForm({ initial = {}, busy = false, submitLabel = 'บันทึกเช็กอิน', onCancel, onSubmit }) {
  const confirm = useConfirmation();
  const [form, setForm] = useState({ ...EMPTY, recorded_at: bangkokInput(), ...initial });
  const [error, setError] = useState('');
  const update = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const hasEntry = ['food_intake', 'water_intake', 'activity_level', 'sleep_amount', 'stool_condition', 'mood', 'weight_kg', 'notes']
    .some(field => String(form[field] ?? '').trim() !== '');
  const canSubmit = Boolean(form.recorded_at && hasEntry && (form.weight_kg === '' || (Number.isFinite(Number(form.weight_kg)) && Number(form.weight_kg) > 0)));
  async function submit(event) {
    event.preventDefault(); setError('');
    if (!canSubmit) { setError('เลือกหรือกรอกข้อมูลที่จำเป็นให้ครบก่อนบันทึก'); return; }
    if (!await confirm({ title: 'บันทึกเช็กอินรายวัน?', description: `ยืนยันข้อมูลที่สังเกตได้ วันที่ ${new Date(`${form.recorded_at}:00+07:00`).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}`, confirmLabel: 'ยืนยันบันทึก' })) return;
    try {
      await onSubmit({
        recorded_at: bangkokIso(form.recorded_at),
        food_intake: form.food_intake || null,
        water_intake: form.water_intake || null,
        activity_level: form.activity_level || null,
        sleep_amount: form.sleep_amount || null,
        stool_condition: form.stool_condition || null,
        mood: form.mood || null,
        weight_kg: form.weight_kg === '' ? null : Number(form.weight_kg),
        notes: form.notes.trim() || null,
      });
    } catch (problem) { setError(problem.message); }
  }
  return <form className="form-stack wellness-form" onSubmit={submit}>
    <label>วันและเวลา <span className="required-mark">*</span><DateTimePicker required max={bangkokInput()} value={form.recorded_at} onChange={event => update('recorded_at', event.target.value)} /></label>
    <fieldset className="wellness-metrics"><legend>วันนี้เป็นอย่างไรบ้าง <span className="required-mark" aria-hidden="true">*</span></legend><p className="field-help">กรอกหรือเลือกอย่างน้อย 1 รายการ ช่องอื่นเว้นว่างได้ ระบบจะเก็บเป็น “ไม่มีข้อมูล” ไม่ใช่ศูนย์</p>
      {SCALE_FIELDS.map(([field, label, options]) => <fieldset className="wellness-scale" key={field}><legend>{label}</legend><div className="wellness-slider-wrap"><input className="wellness-range" type="range" min="0" max={options.length - 1} step="1" value={scalePosition(form[field], options)} aria-label={label} aria-valuetext={labelFrom(options, form[field])} onChange={event => update(field, options[Number(event.target.value)][0])} /><div className="wellness-range-labels" aria-hidden="true">{options.map(([value, optionLabel]) => <span key={value || 'unset'}>{optionLabel}</span>)}</div></div><output className="wellness-range-value">{labelFrom(options, form[field])}</output></fieldset>)}
    </fieldset>
    <label>น้ำหนัก (กก.)<input type="number" inputMode="decimal" min="0.001" max="1000" step="0.001" value={form.weight_kg} onChange={event => update('weight_kg', event.target.value)} placeholder="เว้นว่างได้" /></label>
    <label>ข้อสังเกต<textarea rows="3" maxLength="2000" value={form.notes} onChange={event => update('notes', event.target.value)} placeholder="เช่น วันนี้กินช้ากว่าปกติ แต่ยังเล่นของเล่นได้" /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions"><button type="button" className="button ghost" disabled={busy} onClick={onCancel}>ยกเลิก</button><button className="button primary" disabled={busy || !canSubmit}>{busy ? 'กำลังบันทึก…' : submitLabel}</button></div>
  </form>;
}

function metricSummary(item) {
  return [
    item.food_intake && { key: 'food_intake', label: `อาหาร: ${labelFrom(RELATIVE_OPTIONS, item.food_intake)}` },
    item.water_intake && { key: 'water_intake', label: `น้ำ: ${labelFrom(RELATIVE_OPTIONS, item.water_intake)}` },
    item.activity_level && { key: 'activity_level', label: `กิจกรรม: ${labelFrom(RELATIVE_OPTIONS, item.activity_level)}` },
    item.sleep_amount && { key: 'sleep_amount', label: `นอน: ${labelFrom(RELATIVE_OPTIONS, item.sleep_amount)}` },
    item.stool_condition && { key: 'stool_condition', label: `ขับถ่าย: ${labelFrom(STOOL_OPTIONS, item.stool_condition)}` },
    item.mood && { key: 'mood', label: `อารมณ์: ${labelFrom(MOOD_OPTIONS, item.mood)}` },
    item.weight_kg != null && { key: 'weight_kg', label: `น้ำหนัก: ${Number(item.weight_kg)} กก.` },
  ].filter(Boolean);
}

export default function WellnessLogs({ petId, members = [], api }) {
  const confirm = useConfirmation();
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ from: '', to: '' });
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [baselineRefresh, setBaselineRefresh] = useState(0);
  const [page, setPage] = useState(1);
  const listTopRef = useRef(null);
  const load = useCallback(async () => {
    const params = new URLSearchParams({ limit: '100' });
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    try { const data = await api(`/pets/${petId}/wellness-logs?${params}`); setItems(data.items || []); setError(''); }
    catch (problem) { setError(problem.message); }
  }, [api, filters, petId]);
  useEffect(() => { setAdding(false); setEditing(null); load(); }, [load]);
  useEffect(() => { setPage(1); }, [filters.from, filters.to]);
  const pageSize = 10;
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);
  async function create(input) { setBusy('create'); try { await api(`/pets/${petId}/wellness-logs`, { method: 'POST', body: JSON.stringify(input) }); setAdding(false); await load(); setBaselineRefresh(value => value + 1); } finally { setBusy(''); } }
  async function update(input) { setBusy(editing.id); try { await api(`/wellness-logs/${editing.id}`, { method: 'PATCH', body: JSON.stringify(input) }); setEditing(null); await load(); setBaselineRefresh(value => value + 1); } finally { setBusy(''); } }
  async function archive(item) {
    if (!await confirm({ title: 'ลบเช็กอินรายวัน?', description: `ลบเช็กอินวันที่ ${new Date(item.recorded_at).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok' })} ออกจากรายการและการคำนวณสุขภาวะ ประวัติการเปลี่ยนแปลงยังคงอยู่`, danger: true })) return;
    setBusy(item.id); setError('');
    try { await api(`/wellness-logs/${item.id}/archive`, { method: 'POST', body: '{}' }); await load(); setBaselineRefresh(value => value + 1); }
    catch (problem) { setError(problem.message); }
    finally { setBusy(''); }
  }
  return <section className="wellness-section"><header className="subview-head"><div><h3>เช็กอินรายวัน</h3><p>บันทึกเฉพาะสิ่งที่สังเกตได้ ข้อมูลนี้ยังไม่ใช่การวินิจฉัยหรือการประเมินสุขภาพ</p></div>{!adding && <button className="button primary" onClick={() => { setAdding(true); setEditing(null); }}>เช็กอินวันนี้</button>}</header>
    <div className="timeline-filters wellness-filters"><label>ตั้งแต่<DatePicker value={filters.from} max={filters.to || undefined} onChange={event => setFilters({ ...filters, from: event.target.value })} /></label><label>ถึง<DatePicker value={filters.to} min={filters.from || undefined} onChange={event => setFilters({ ...filters, to: event.target.value })} /></label></div>
    {error && <p className="form-error" role="alert">{error} <button onClick={load}>ลองอีกครั้ง</button></p>}
    {adding && <div className="wellness-editor"><h4>เช็กอินสุขภาพ</h4><WellnessLogForm busy={busy === 'create'} onCancel={() => setAdding(false)} onSubmit={create} /></div>}
    {items[0] && <div className="checkin-summary"><div><strong>เช็กอินล่าสุด · {new Date(items[0].recorded_at).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium' })}</strong><span>บันทึกข้อมูล {metricSummary(items[0]).length} ด้าน</span></div><span>ทั้งหมด {items.length} รายการในช่วงที่เลือก</span></div>}
    {items.length ? <><div className="wellness-list" ref={listTopRef}>{pageItems.map(item => <article key={item.id}>{editing?.id === item.id ? <WellnessLogForm initial={{ ...item, recorded_at: bangkokInput(item.recorded_at), weight_kg: item.weight_kg ?? '', notes: item.notes || '' }} busy={busy === item.id} submitLabel="บันทึกการแก้ไข" onCancel={() => setEditing(null)} onSubmit={update} /> : <><header><div><strong>{new Date(item.recorded_at).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium' })}</strong><time>{new Date(item.recorded_at).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' })}</time></div><small>บันทึกโดย {item.created_by_name}</small></header><div className="wellness-chips">{metricSummary(item).map(value => <span key={value.key} className={value.key !== 'weight_kg' ? `scale-chip scale-${scaleClass(item[value.key])}` : ''}>{value.label}</span>)}</div>{item.notes && <p>{item.notes}</p>}{item.can_edit && <div className="manage-actions"><button className="button ghost" onClick={() => { setEditing(item); setAdding(false); }}>แก้ไข</button><button className="button subtle-danger" disabled={busy === item.id} onClick={() => archive(item)}>ลบ</button></div>}</>}</article>)}</div><Pagination page={page} pageSize={pageSize} total={items.length} onPageChange={setPage} scrollRef={listTopRef} /></> : !adding && !error && <div className="empty-state"><h3>ยังไม่มีเช็กอินรายวัน</h3><p>เริ่มจากข้อมูลที่สังเกตเห็นเพียงหนึ่งอย่างก็ได้ ช่องอื่นเว้นว่างได้เสมอ</p><button className="button secondary" onClick={() => setAdding(true)}>สร้างเช็กอินแรก</button></div>}
    <details className="checkin-insight"><summary>รายการติดตามสุขภาพ</summary><WellnessAlerts onOpenCheckIn={()=>{setAdding(true);setEditing(null);document.querySelector('.wellness-section')?.scrollIntoView({block:'start'});}} petId={petId} members={members} api={api} refreshKey={baselineRefresh} /></details>
    <details className="checkin-insight"><summary>ค่าปกติส่วนตัวที่ระบบกำลังเรียนรู้</summary><WellnessBaseline petId={petId} api={api} refreshKey={baselineRefresh} /></details>
  </section>;
}
