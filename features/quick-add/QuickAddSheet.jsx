"use client";

import { useState } from 'react';
import Modal from '../../components/Modal.jsx';
import { ROUTINE_TEMPLATES } from '../routines/templates.js';

const CHOICES = [
  ['template', 'สร้างจากเทมเพลต', 'เริ่มจากกิจวัตรยอดนิยมแล้วแก้ได้ทุกช่อง'],
  ['routine', 'สร้างกิจวัตรเอง', 'กำหนดวัน เวลา และผู้รับผิดชอบ'],
  ['care', 'บันทึกการดูแลนอกตาราง', 'เช่น อาบน้ำ ซื้ออาหาร หรือเดินเพิ่ม'],
  ['health', 'เพิ่มข้อมูลสุขภาพ', 'น้ำหนัก วัคซีน ยา นัดหมาย หรือข้อสังเกต'],
  ['appointment', 'เพิ่มนัดหมายครั้งเดียว', 'สร้างรายการที่เกิดขึ้นเพียงวันเดียว'],
];

export default function QuickAddSheet({ pets = [], onClose, onSelect, api, onSaved }) {
  const [mode, setMode] = useState('choices');
  const [form, setForm] = useState({ pet_id: pets[0]?.id || '', title: '', activity_type: 'other', occurred_at: new Date().toISOString().slice(0, 16), notes: '', record_type: 'observation', details: '', numeric_value: '', unit: 'kg' });
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setError('');
    try {
      if (mode === 'care') await api(`/households/${pets.find(pet => pet.id === form.pet_id)?.household_id}/care-entries`, { method: 'POST', body: JSON.stringify({ ...form, occurred_at: new Date(form.occurred_at).toISOString() }) });
      else await api(`/pets/${form.pet_id}/health-records`, { method: 'POST', body: JSON.stringify({ record_type: form.record_type, title: form.title, recorded_at: new Date(form.occurred_at).toISOString(), details: form.details, ...(form.record_type === 'weight' ? { numeric_value: Number(form.numeric_value), unit: form.unit } : {}) }) });
      onSaved?.(); onClose();
    } catch (problem) { setError(problem.message); }
  }
  return <Modal title="เพิ่มรายการ" description="เลือกสิ่งที่ต้องการบันทึก" onClose={onClose}>{mode === 'choices' ? <div className="quick-add-list">{CHOICES.map(([id, title, detail]) => <button key={id} type="button" onClick={() => { if (['care', 'health'].includes(id)) setMode(id); else if (id === 'template') setMode('templates'); else onSelect(id); }}><strong>{title}</strong><span>{detail}</span></button>)}</div> : mode === 'templates' ? <div className="quick-add-list"><button type="button" onClick={() => setMode('choices')}><strong>ย้อนกลับ</strong><span>เลือกวิธีเพิ่มแบบอื่น</span></button>{ROUTINE_TEMPLATES.map(template => <button key={template.id} type="button" onClick={() => onSelect('template', template)}><strong>{template.name}</strong><span>{template.title}</span></button>)}</div> : <form className="form-stack" onSubmit={submit}><label>สัตว์เลี้ยง<select value={form.pet_id} onChange={event => setForm({ ...form, pet_id: event.target.value })}>{pets.map(pet => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select></label>{mode === 'health' && <label>ประเภท<select value={form.record_type} onChange={event => setForm({ ...form, record_type: event.target.value })}><option value="weight">น้ำหนัก</option><option value="vaccination">วัคซีน</option><option value="medication">บันทึกยา</option><option value="appointment">นัดหมาย</option><option value="observation">ข้อสังเกต</option><option value="other">อื่น ๆ</option></select></label>}<label>ชื่อรายการ<input required maxLength={160} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></label>{mode === 'care' && <label>กิจกรรม<select value={form.activity_type} onChange={event => setForm({ ...form, activity_type: event.target.value })}><option value="bathing">อาบน้ำ</option><option value="supplies">ซื้อของ</option><option value="observation">ข้อสังเกต</option><option value="other">อื่น ๆ</option></select></label>}<label>วันและเวลา<input required type="datetime-local" value={form.occurred_at} onChange={event => setForm({ ...form, occurred_at: event.target.value })} /></label>{mode === 'health' && form.record_type === 'weight' && <div className="form-grid"><label>ค่า<input required type="number" min="0" step="0.001" value={form.numeric_value} onChange={event => setForm({ ...form, numeric_value: event.target.value })} /></label><label>หน่วย<input required value={form.unit} onChange={event => setForm({ ...form, unit: event.target.value })} /></label></div>}<label>หมายเหตุ<textarea value={mode === 'care' ? form.notes : form.details} onChange={event => setForm({ ...form, [mode === 'care' ? 'notes' : 'details']: event.target.value })} /></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><button type="button" className="button ghost" onClick={() => setMode('choices')}>ย้อนกลับ</button><button className="button primary">บันทึก</button></div></form>}</Modal>;
}
