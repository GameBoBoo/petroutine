"use client";
import { useConfirmation } from '../../components/ConfirmationProvider.jsx';
import { ROUTINE_ACTIVITY_OPTIONS, SCHEDULE_OPTIONS } from '../../lib/form-options.js';
import SelectField from '../../components/SelectField.jsx';
import DatePicker from '../../components/DatePicker.jsx';

import { useRef, useState } from 'react';

const WEEKDAYS = [['อา.', 0], ['จ.', 1], ['อ.', 2], ['พ.', 3], ['พฤ.', 4], ['ศ.', 5], ['ส.', 6]];
const bangkokNow = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date()).replace(' ', 'T');

export default function RoutineForm({ pets = [], members = [], initial = {}, onSubmit, onCancel }) {
  const confirm = useConfirmation();
  const now = bangkokNow();
  const [form, setForm] = useState({ pet_id: pets[0]?.id || '', title: '', activity_type: 'feeding', type: 'weekly', times: [now.slice(11, 16)], days: [0, 1, 2, 3, 4, 5, 6], date: now.slice(0, 10), interval_days: 2, start_date: now.slice(0, 10), end_date: '', pause_from: '', pause_to: '', assigned_user_id: '', instructions: '', ...initial, pet_id: initial.pet_id || pets[0]?.id || '' });
  const [advanced, setAdvanced] = useState(false);
  const [errors, setErrors] = useState([]);
  const [busy, setBusy] = useState(false);
  const canSubmit = Boolean(form.pet_id && form.title.trim() && form.times.length && form.times.every(Boolean)
    && (form.type !== 'weekly' || form.days.length > 0)
    && (form.type !== 'once' || form.date)
    && (form.type !== 'interval' || (form.start_date && Number.isInteger(Number(form.interval_days)) && Number(form.interval_days) >= 1 && Number(form.interval_days) <= 365))
    && Boolean(form.pause_from) === Boolean(form.pause_to));
  const summaryRef = useRef(null);
  function updateTime(index, value) { setForm({ ...form, times: form.times.map((time, current) => current === index ? value : time) }); }
  function toggleDay(day) { setForm({ ...form, days: form.days.includes(day) ? form.days.filter(value => value !== day) : [...form.days, day].sort() }); }
  async function submit(event) {
    event.preventDefault();
    const nextErrors = [];
    if (!form.pet_id) nextErrors.push('กรุณาเลือกสัตว์เลี้ยง');
    if (!form.title.trim()) nextErrors.push('กรุณาระบุชื่อกิจวัตร');
    if (!form.times.length || form.times.some(time => !time)) nextErrors.push('กรุณาระบุเวลา');
    if (form.type === 'weekly' && !form.days.length) nextErrors.push('กรุณาเลือกอย่างน้อย 1 วัน');
    if (form.type === 'once' && !form.date) nextErrors.push('กรุณาระบุวันที่นัดหมาย');
    if (form.type === 'interval' && !form.start_date) nextErrors.push('กรุณาระบุวันเริ่ม');
    if (form.type === 'interval' && (!Number.isInteger(Number(form.interval_days)) || Number(form.interval_days) < 1 || Number(form.interval_days) > 365)) nextErrors.push('จำนวนวันต้องอยู่ระหว่าง 1–365');
    if ((form.pause_from && !form.pause_to) || (!form.pause_from && form.pause_to)) nextErrors.push('ช่วงพักต้องมีทั้งวันเริ่มและวันสิ้นสุด');
    if (nextErrors.length) { setErrors(nextErrors); requestAnimationFrame(() => summaryRef.current?.focus()); return; }
    const schedule = { type: form.type, times: form.times, ...(form.type === 'weekly' ? { days: form.days } : {}), ...(form.type === 'interval' ? { interval_days: Number(form.interval_days), start_date: form.start_date } : {}), ...(form.type === 'once' ? { date: form.date } : {}), ...(form.type !== 'once' && form.end_date ? { end_date: form.end_date } : {}), ...(form.type !== 'once' && form.pause_from && form.pause_to ? { pauses: [{ from: form.pause_from, to: form.pause_to }] } : {}) };
    if (!await confirm({ title: initial.id ? 'บันทึกการแก้ไขกิจวัตร?' : 'บันทึกกิจวัตรนี้?', description: `“${form.title.trim()}” ของ${pets.find(pet => pet.id === form.pet_id)?.name || 'สัตว์เลี้ยง'} เวลา ${form.times.join(', ')} น. · ผู้รับผิดชอบ: ${members.find(member => member.id === form.assigned_user_id)?.name || 'ทุกคนในบ้าน'}`, confirmLabel: 'ยืนยันบันทึก' })) return;
    setBusy(true); setErrors([]);
    try {
      await onSubmit({ pet_id: form.pet_id, title: form.title.trim(), activity_type: form.activity_type, schedule, assigned_user_id: form.assigned_user_id || null, instructions: form.instructions.trim() || null });
    } catch (problem) {
      setErrors([problem.message || 'บันทึกรายการไม่สำเร็จ กรุณาลองอีกครั้ง']);
      requestAnimationFrame(() => summaryRef.current?.focus());
    } finally { setBusy(false); }
  }
  return <form className="form-stack routine-form" onSubmit={submit}>
    {errors.length > 0 && <div id="error-summary" ref={summaryRef} className="form-error" role="alert" tabIndex={-1}><strong>กรุณาตรวจสอบข้อมูล</strong><ul>{errors.map(error => <li key={error}>{error}</li>)}</ul></div>}
    <label>สัตว์เลี้ยง <span className="required-mark">*</span><SelectField required value={form.pet_id} onChange={event => setForm({ ...form, pet_id: event.target.value })}>{pets.map(pet => <option key={pet.id} value={pet.id} data-description={pet.species === 'cat' ? 'แมว' : 'สุนัข'}>{pet.name}</option>)}</SelectField></label>
    <label>{form.type === 'once' ? 'ชื่องาน' : 'ชื่อกิจวัตร'} <span className="required-mark">*</span><input required maxLength="160" value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></label>
    <div className="form-grid"><label>กิจกรรม <span className="required-mark">*</span><SelectField value={form.activity_type} onChange={event => setForm({ ...form, activity_type: event.target.value })}>{ROUTINE_ACTIVITY_OPTIONS.map(([value,label,description])=><option key={value} value={value} data-description={description}>{label}</option>)}</SelectField></label><label>รูปแบบ <span className="required-mark">*</span><SelectField value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}>{SCHEDULE_OPTIONS.map(([value,label,description])=><option key={value} value={value} data-description={description}>{label}</option>)}</SelectField></label></div>
    {form.type === 'weekly' && <fieldset className="weekday-picker"><legend>วันที่ทำ <span className="required-mark">*</span></legend>{WEEKDAYS.map(([label, day]) => <button key={day} type="button" className={form.days.includes(day) ? 'filter-chip active' : 'filter-chip'} aria-pressed={form.days.includes(day)} onClick={() => toggleDay(day)}>{label}</button>)}</fieldset>}
    {form.type === 'interval' && <div className="form-grid"><label>ทำซ้ำทุกกี่วัน <span className="required-mark">*</span><input required type="number" inputMode="numeric" min="1" max="365" value={form.interval_days} onChange={event => setForm({ ...form, interval_days: event.target.value })} /></label><label>วันเริ่ม <span className="required-mark">*</span><DatePicker required value={form.start_date} onChange={event => setForm({ ...form, start_date: event.target.value })} /></label></div>}
    {form.type === 'once' && <label>วันที่นัดหมาย <span className="required-mark">*</span><DatePicker required value={form.date} onChange={event => setForm({ ...form, date: event.target.value })} /></label>}
    {form.times.map((time, index) => <div className="time-row" key={index}><label>เวลา {index + 1} <span className="required-mark">*</span><input required type="time" value={time} onChange={event => updateTime(index, event.target.value)} /></label>{form.times.length > 1 && <button type="button" className="button ghost" aria-label={`ลบเวลา ${index + 1}`} onClick={() => setForm({ ...form, times: form.times.filter((_, current) => current !== index) })}>ลบ</button>}</div>)}
    <button type="button" className="button secondary" onClick={() => setForm({ ...form, times: [...form.times, now.slice(11, 16)] })}>เพิ่มเวลา</button>
      <label>ผู้รับผิดชอบ<SelectField value={form.assigned_user_id} onChange={event => setForm({ ...form, assigned_user_id: event.target.value })}><option value="">ทุกคนในบ้าน</option>{members.map(member => <option key={member.id} value={member.id} data-description={member.email}>{member.name}</option>)}</SelectField></label>
    <p className="field-help">เลือกสมาชิกคนเดียวเพื่อมอบหมาย หรือเลือกทุกคนในบ้านเมื่อช่วยกันดูแล</p>
    <button type="button" className="advanced-toggle" aria-expanded={advanced} onClick={() => setAdvanced(value => !value)}>ตัวเลือกเพิ่มเติม</button>
    {advanced && <div className="advanced-fields">
      {form.type !== 'once' && <><label>วันสิ้นสุด<DatePicker min={form.type === 'interval' ? form.start_date : undefined} value={form.end_date} onChange={event => setForm({ ...form, end_date: event.target.value })} /><small className="field-help">เว้นว่างเพื่อทำต่อเนื่อง</small></label><fieldset><legend>ช่วงพัก (ไม่บังคับ)</legend><DatePicker aria-label="เริ่มช่วงพัก" value={form.pause_from} onChange={event => setForm({ ...form, pause_from: event.target.value })} /><DatePicker aria-label="สิ้นสุดช่วงพัก" min={form.pause_from || undefined} value={form.pause_to} onChange={event => setForm({ ...form, pause_to: event.target.value })} /></fieldset></>}

      <label>วิธีดูแลหรือรายละเอียด<textarea rows="3" maxLength="2000" value={form.instructions} onChange={event => setForm({ ...form, instructions: event.target.value })} placeholder="เว้นว่างได้" /></label>
    </div>}
    <div className="form-actions"><button type="button" className="button ghost" disabled={busy} onClick={onCancel}>ยกเลิก</button><button className="button primary" disabled={busy || !canSubmit}>{busy ? 'กำลังบันทึก…' : form.type === 'once' ? 'บันทึกงาน' : 'บันทึกกิจวัตร'}</button></div>
  </form>;
}
