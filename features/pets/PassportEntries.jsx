"use client";
import { PASSPORT_OPTIONS } from '../../lib/form-options.js';
import { useConfirmation } from '../../components/ConfirmationProvider.jsx';
import SelectField from '../../components/SelectField.jsx';
import DatePicker from '../../components/DatePicker.jsx';

import { useCallback, useEffect, useState } from 'react';

const TYPES = Object.fromEntries(PASSPORT_OPTIONS.map(([value,label])=>[value,label]));

const EMPTY = { entry_type: 'allergy', title: '', details: '', numeric_value: '', unit: '', start_date: '', end_date: '', next_due_date: '' };
const dateText = value => value ? new Date(`${String(value).slice(0, 10)}T00:00:00+07:00`).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric' }) : '';

function EntryForm({ initial = EMPTY, busy, submitLabel, onCancel, onSubmit }) {
  const confirm = useConfirmation();
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setError('');
    if (form.start_date && form.end_date && form.end_date < form.start_date) { setError('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม'); return; }
    if (!await confirm({ title: 'บันทึกข้อมูลสุขภาพประจำตัว?', description: `ยืนยันข้อมูล “${form.title}” เพื่อใช้เป็นข้อมูลอ้างอิงร่วมกันในบ้าน`, confirmLabel: 'ยืนยันบันทึก' })) return;
    try {
      await onSubmit({ ...form, numeric_value: form.numeric_value === '' ? null : Number(form.numeric_value), unit: form.unit || null, start_date: form.start_date || null, end_date: form.end_date || null, next_due_date: form.next_due_date || null });
    } catch (problem) { setError(problem.message); }
  }
  return <form className="form-stack passport-form" onSubmit={submit}>
    <div className="form-grid"><label>ประเภท<SelectField value={form.entry_type} onChange={event => setForm({ ...form, entry_type: event.target.value })}>{PASSPORT_OPTIONS.map(([value, label, description]) => <option key={value} value={value} data-description={description}>{label}</option>)}</SelectField></label><label>ชื่อรายการ <span className="required-mark" aria-hidden="true">*</span><input required maxLength="160" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="เช่น วัคซีนรวมประจำปี" /></label></div>
    <label>รายละเอียด<textarea rows="3" maxLength="5000" value={form.details} onChange={event => setForm({ ...form, details: event.target.value })} placeholder="ข้อมูลที่สมาชิกในบ้านควรรู้" /></label>
    <fieldset className="passport-dates"><legend>ช่วงเวลาและกำหนดครั้งถัดไป</legend><label>วันที่เริ่ม<DatePicker value={form.start_date} onChange={event => setForm({ ...form, start_date: event.target.value })} /></label><label>วันที่สิ้นสุด<DatePicker min={form.start_date || undefined} value={form.end_date} onChange={event => setForm({ ...form, end_date: event.target.value })} /></label><label>กำหนด/นัดครั้งถัดไป<DatePicker value={form.next_due_date} onChange={event => setForm({ ...form, next_due_date: event.target.value })} /></label></fieldset>
    <div className="form-grid"><label>ค่าตัวเลข (ถ้ามี)<input type="number" min="0" step="0.001" inputMode="decimal" value={form.numeric_value} onChange={event => setForm({ ...form, numeric_value: event.target.value })} /></label><label>หน่วย{form.numeric_value !== '' && <span className="required-mark"> *</span>}<input required={form.numeric_value !== ''} maxLength="30" value={form.unit} onChange={event => setForm({ ...form, unit: event.target.value })} placeholder="เช่น mg หรือ ml" /></label></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions"><button type="button" className="button ghost" onClick={onCancel}>ยกเลิก</button><button className="button primary" disabled={busy || !form.title.trim() || (form.numeric_value !== '' && !form.unit.trim()) || (form.start_date && form.end_date && form.end_date < form.start_date)}>{busy ? 'กำลังบันทึก…' : submitLabel}</button></div>
  </form>;
}

export default function PassportEntries({ petId, api }) {
  const confirm = useConfirmation();
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(() => api(`/pets/${petId}/passport`).then(data => { setItems(data.items || []); setError(''); }).catch(problem => setError(problem.message)), [api, petId]);
  useEffect(() => { setAdding(false); setEditing(null); load(); }, [load]);
  async function create(input) { setBusy('create'); try { await api(`/pets/${petId}/passport`, { method: 'POST', body: JSON.stringify(input) }); setAdding(false); await load(); } finally { setBusy(''); } }
  async function update(input) { setBusy(editing.id); try { await api(`/passport/${editing.id}`, { method: 'PATCH', body: JSON.stringify(input) }); setEditing(null); await load(); } finally { setBusy(''); } }
  async function archive(item) {
    if (!await confirm({ title: 'ลบข้อมูลสุขภาพประจำตัว?', description: `ลบ “${item.title}” ออกจากข้อมูลสุขภาพประจำตัวและกำหนดสุขภาพที่ใช้งาน ประวัติการเปลี่ยนแปลงยังคงอยู่`, danger: true })) return;
    setBusy(item.id); setError('');
    try { await api(`/passport/${item.id}/archive`, { method: 'POST', body: '{}' }); await load(); }
    catch (problem) { setError(problem.message); }
    finally { setBusy(''); }
  }
  return <section className="passport-section"><header className="subview-head"><div><h3>ข้อมูลสุขภาพประจำตัว</h3><p>ข้อมูลอ้างอิงระยะยาวที่สมาชิกบันทึกเอง ไม่ใช่คำวินิจฉัยหรือคำแนะนำการรักษา</p></div>{!adding && <button className="button primary" onClick={() => { setAdding(true); setEditing(null); }}>เพิ่มข้อมูล</button>}</header>
    {error && <p className="form-error" role="alert">{error} <button onClick={load}>ลองอีกครั้ง</button></p>}
    {adding && <div className="passport-editor"><h4>เพิ่มข้อมูลในข้อมูลสุขภาพประจำตัว</h4><EntryForm busy={busy === 'create'} submitLabel="เพิ่มข้อมูล" onCancel={() => setAdding(false)} onSubmit={create} /></div>}
    {items.length ? <div className="passport-groups">{Object.entries(TYPES).map(([type, label]) => { const group = items.filter(item => item.entry_type === type); if (!group.length) return null; return <section key={type} className="passport-group" aria-labelledby={`passport-${type}`}><h4 id={`passport-${type}`}>{label} <span>{group.length}</span></h4><div className="record-list">{group.map(item => <article key={item.id}>{editing?.id === item.id ? <EntryForm initial={{ ...item, numeric_value: item.numeric_value ?? '', unit: item.unit || '', start_date: item.start_date?.slice(0, 10) || '', end_date: item.end_date?.slice(0, 10) || '', next_due_date: item.next_due_date?.slice(0, 10) || '' }} busy={busy === item.id} submitLabel="บันทึกการแก้ไข" onCancel={() => setEditing(null)} onSubmit={update} /> : <><strong>{item.title}</strong><span className="passport-type">{label}</span>{item.details && <p>{item.details}</p>}{item.numeric_value != null && <b>{item.numeric_value} {item.unit}</b>}<div className="passport-meta">{item.start_date && <span>เริ่ม {dateText(item.start_date)}</span>}{item.end_date && <span>สิ้นสุด {dateText(item.end_date)}</span>}{item.next_due_date && <span className="due-date">ครั้งถัดไป {dateText(item.next_due_date)}</span>}</div><small>บันทึกโดย {item.created_by_name}</small>{item.can_edit && <div className="manage-actions"><button className="button ghost" onClick={() => { setEditing(item); setAdding(false); }}>แก้ไข</button><button className="button subtle-danger" disabled={busy === item.id} onClick={() => archive(item)}>ลบ</button></div>}</>}</article>)}</div></section>; })}</div> : !adding && !error && <div className="empty-state"><h3>ยังไม่มีข้อมูลในข้อมูลสุขภาพประจำตัว</h3><p>เริ่มบันทึกการแพ้ โรคประจำตัว ยา วัคซีน หรือนัดหมายของสัตว์ตัวนี้</p><button className="button secondary" onClick={() => setAdding(true)}>เพิ่มข้อมูลแรก</button></div>}
  </section>;
}
