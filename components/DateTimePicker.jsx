"use client";

import DatePicker from './DatePicker.jsx';

export default function DateTimePicker({ value = '', onChange, min, max, required = false, disabled = false, ...props }) {
  const [date = '', time = ''] = String(value || '').split('T');
  const setDate = nextDate => onChange?.({ target: { value: nextDate ? `${nextDate}T${time || '09:00'}` : '' } });
  const setTime = event => onChange?.({ target: { value: date ? `${date}T${event.target.value}` : '' } });
  const minDate = min?.slice(0, 10);
  const maxDate = max?.slice(0, 10);
  return <div className="date-time-picker">
    <DatePicker value={date} onChange={event => setDate(event.target.value)} min={minDate} max={maxDate} required={required} disabled={disabled} aria-label="เลือกวันที่" />
    <div className="time-picker"><span>เวลา</span><input type="time" value={time} min={date === minDate ? min?.slice(11, 16) : undefined} max={date === maxDate ? max?.slice(11, 16) : undefined} required={required} disabled={disabled} onChange={setTime} aria-label={props['aria-label'] || 'เลือกเวลา'} /></div>
    <input className="date-picker-native" type="datetime-local" value={value} min={min} max={max} required={required} disabled={disabled} tabIndex={-1} aria-hidden="true" onChange={() => {}} onInvalid={event => { event.preventDefault(); event.currentTarget.parentElement?.querySelector('.date-picker-trigger')?.focus(); }} />
  </div>;
}
