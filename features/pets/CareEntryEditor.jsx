"use client";

import { useState } from 'react';
import DateTimePicker from '../../components/DateTimePicker.jsx';
import SelectField from '../../components/SelectField.jsx';
import { CARE_ACTIVITY_OPTIONS } from '../../lib/form-options.js';
import { bangkokDateTimeInput, bangkokDateTimeToIso } from '../../lib/bangkok-datetime.js';

export default function CareEntryEditor({ entry, busy = false, onSave, onCancel }) {
  const [form, setForm] = useState(() => ({
    title: entry.title || '',
    activity_type: entry.activity_type || 'other',
    occurred_at: bangkokDateTimeInput(entry.occurred_at),
    original_occurred_at: entry.occurred_at,
    notes: entry.notes || '',
  }));
  const [error, setError] = useState('');
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const unchangedTime = form.occurred_at === bangkokDateTimeInput(form.original_occurred_at);
      await onSave({
        ...form,
        occurred_at: unchangedTime ? form.original_occurred_at : bangkokDateTimeToIso(form.occurred_at),
      });
    } catch (problem) {
      setError(problem.message || 'บันทึกการแก้ไขไม่สำเร็จ');
    }
  }

  return <form className="form-stack" aria-label="แก้ไขบันทึกการดูแล" onSubmit={submit}>
    <label>ชื่อรายการ <span className="required-mark" aria-hidden="true">*</span>
      <input required maxLength="160" value={form.title} onChange={event => update('title', event.target.value)} />
    </label>
    <label>ประเภทการดูแล <span className="required-mark" aria-hidden="true">*</span>
      <SelectField value={form.activity_type} onChange={event => update('activity_type', event.target.value)}>
        {CARE_ACTIVITY_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </SelectField>
    </label>
    <label>วันและเวลา (เวลาไทย) <span className="required-mark" aria-hidden="true">*</span>
      <DateTimePicker required disabled={busy} value={form.occurred_at} onChange={event => update('occurred_at', event.target.value)} />
    </label>
    <label>รายละเอียด<textarea maxLength="5000" rows="3" value={form.notes} onChange={event => update('notes', event.target.value)} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions">
      <button type="button" className="button ghost" disabled={busy} onClick={onCancel}>ยกเลิก</button>
      <button className="button primary" disabled={busy || !form.title.trim() || !form.occurred_at}>บันทึกการแก้ไข</button>
    </div>
  </form>;
}
