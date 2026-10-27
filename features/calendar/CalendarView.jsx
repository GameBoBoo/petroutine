"use client";

import { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon.jsx';
import SelectField from '../../components/SelectField.jsx';
import CalendarTaskEditor from '../today/CalendarTaskEditor.jsx';

const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const HEALTH_SOURCES = new Set(['passport_due', 'health_appointment', 'wellness_follow_up']);
const ACTIVITIES = { follow_up: 'ติดตามสุขภาวะ', allergy: 'การแพ้', condition: 'โรค/ภาวะประจำตัว', feeding: 'ให้อาหาร', water: 'เติมน้ำ', walk: 'พาเดินเล่น', grooming: 'ดูแลขน', medication: 'บันทึกยา', vet: 'พบสัตวแพทย์', vaccination: 'วัคซีน', appointment: 'นัดหมาย', bathing: 'อาบน้ำ', supplies: 'ซื้อของ', observation: 'ข้อสังเกต', other: 'อื่น ๆ' };
const STATUS = { pending: 'รอดำเนินการ', scheduled: 'กำลังจะถึง', overdue: 'เลยเวลา', completed: 'เสร็จแล้ว', skipped: 'ข้ามแล้ว' };
const bangkokToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const dateAtUTC = date => new Date(`${date}T00:00:00.000Z`);
const thaiDate = (date, options) => dateAtUTC(date).toLocaleDateString('th-TH', { timeZone: 'UTC', ...options });
const eventKind = event => HEALTH_SOURCES.has(event.source_type) ? 'health' : 'task';

export default function CalendarView({ currentId, onToday, initialDate, pets = [], onOpenPet, apiClient, members = [] }) {
  const today = bangkokToday();
  const [month, setMonth] = useState(`${(initialDate || today).slice(0, 7)}-01`);
  const [selected, setSelected] = useState(initialDate || today);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterPet, setFilterPet] = useState('');
  const [filterKind, setFilterKind] = useState('');
  const [editingEvent, setEditingEvent] = useState(null);
  const [calendarRefresh, setCalendarRefresh] = useState(0);

  const dates = useMemo(() => {
    const first = dateAtUTC(month);
    const start = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1 - first.getUTCDay());
    return Array.from({ length: 42 }, (_, index) => new Date(start + index * 86_400_000).toISOString().slice(0, 10));
  }, [month]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiClient(`/households/${currentId}/calendar?from=${dates[0]}&to=${dates.at(-1)}`)
      .then(data => { if (!cancelled) setEvents(data.events || []); })
      .catch(err => { if (!cancelled) setError(`${err.message} กรุณาลองอีกครั้ง`); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [apiClient, currentId, dates, calendarRefresh]);

  const visibleEvents = useMemo(() => events.filter(event =>
    (!filterPet || event.pet_id === filterPet) && (!filterKind || eventKind(event) === filterKind),
  ), [events, filterPet, filterKind]);
  const eventsByDate = useMemo(() => {
    const byDate = new Map();
    for (const event of visibleEvents) {
      const list = byDate.get(event.date) || [];
      list.push(event);
      byDate.set(event.date, list);
    }
    return byDate;
  }, [visibleEvents]);
  const selectedEvents = eventsByDate.get(selected) || [];
  const monthCount = visibleEvents.filter(event => event.date?.slice(0, 7) === month.slice(0, 7)).length;

  function moveMonth(delta) {
    const date = dateAtUTC(month);
    date.setUTCMonth(date.getUTCMonth() + delta);
    const next = date.toISOString().slice(0, 10);
    setMonth(next);
    setSelected(next);
  }
  function selectDate(date) {
    setSelected(date);
    if (date.slice(0, 7) !== month.slice(0, 7)) setMonth(`${date.slice(0, 7)}-01`);
  }
  function jumpToToday() {
    setMonth(`${today.slice(0, 7)}-01`);
    setSelected(today);
  }

  return <section className="content-card calendar-view">
    {editingEvent && <CalendarTaskEditor event={editingEvent} householdId={currentId} members={members} api={apiClient} onClose={() => setEditingEvent(null)} onSaved={() => setCalendarRefresh(value => value + 1)} />}
    <div className="section-header"><div><span className="section-kicker">วางแผนตามวัน</span><h2>ปฏิทินการดูแล</h2><p>เลือกวันเพื่อดูงานและนัดหมายของเพื่อนในบ้าน</p></div></div>
    <div className="history-filters calendar-filters">
      <label>สัตว์เลี้ยง<SelectField value={filterPet} onChange={event => setFilterPet(event.target.value)}><option value="">ทุกตัว</option>{pets.map(pet => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</SelectField></label>
      <label>ประเภท<SelectField value={filterKind} onChange={event => setFilterKind(event.target.value)}><option value="">ทั้งหมด</option><option value="task">งานตามกิจวัตร</option><option value="health">นัดหมายและสุขภาพ</option></SelectField></label>
    </div>
    <div className="calendar-toolbar">
      <button type="button" className="icon-button" onClick={() => moveMonth(-1)} aria-label="เดือนก่อนหน้า"><Icon name="chevron" size={19} /></button>
      <h3>{thaiDate(month, { month: 'long', year: 'numeric' })}</h3>
      <button type="button" className="icon-button" onClick={() => moveMonth(1)} aria-label="เดือนถัดไป"><Icon name="chevron" size={19} /></button>
      <button type="button" className="button secondary" onClick={jumpToToday}>วันนี้</button>
    </div>
    <p className="calendar-month-summary" role="status">{loading ? 'กำลังโหลดกำหนดการ' : `${monthCount} รายการในเดือนนี้`}</p>
    {loading && !events.length ? <div className="calendar-skeleton" aria-busy="true" role="status" aria-label="กำลังโหลดปฏิทิน">{Array.from({ length: 35 }, (_, index) => <i key={index} />)}</div> : <div className="calendar-grid" role="group" aria-label="เลือกวันที่">
      <div className="calendar-weekdays">{WEEKDAYS.map(day => <span key={day}>{day}</span>)}</div>
      <div className="calendar-days">{dates.map(date => {
        const count = (eventsByDate.get(date) || []).length;
        return <button key={date} type="button" className={`calendar-day${date.slice(0, 7) !== month.slice(0, 7) ? ' outside' : ''}${date === selected ? ' selected' : ''}${date === today ? ' today' : ''}`} aria-pressed={date === selected} aria-label={`${thaiDate(date, { day: 'numeric', month: 'long', year: 'numeric' })} ${count} รายการ`} onClick={() => selectDate(date)}><span>{Number(date.slice(-2))}</span>{count > 0 && <small>{count}<span> รายการ</span></small>}</button>;
      })}</div>
    </div>}
    <div className="calendar-agenda">
      <div className="section-header"><div><span className="section-kicker">กำหนดการวันที่เลือก</span><h3>{thaiDate(selected, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3><p>{loading ? 'กำลังตรวจสอบรายการ' : `${selectedEvents.length} รายการ`}</p></div>{selected === today && <button type="button" className="button secondary" onClick={onToday}>ไปหน้างานวันนี้ <Icon name="arrow" size={16} /></button>}</div>
      {error ? <p className="form-error" role="alert">{error}</p> : loading ? <div className="skeleton-stack" aria-busy="true" role="status" aria-label="กำลังโหลดรายการประจำวัน">{[0, 1].map(item => <div className="skeleton-activity" key={item}><i /><span><i /><i /></span></div>)}</div> : selectedEvents.length ? <div className="calendar-event-list">{selectedEvents.map(event => {
        const kind = eventKind(event);
        const statusLabel = ['completed', 'skipped'].includes(event.status) ? STATUS[event.status] : kind === 'health' ? ACTIVITIES[event.activity_type] || 'นัดหมาย' : STATUS[event.status] || 'กำลังจะถึง';
        return <article className={`calendar-event calendar-event-${kind}`} key={`${event.source_type || 'task'}:${event.id || event.routine_id}:${event.date}:${event.scheduled_at}`}>
          <span className="calendar-event-time">{event.all_day ? 'ทั้งวัน' : new Date(event.scheduled_at).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' })}</span>
          <div className="calendar-event-main"><button type="button" className="text-button" onClick={() => onOpenPet(event)}>{event.title}</button><p>{event.pet_name} · {ACTIVITIES[event.activity_type] || event.activity_type}</p>{event.routine_id && !['completed', 'skipped'].includes(event.status) && <button type="button" className="button ghost" onClick={() => setEditingEvent(event)}>แก้เฉพาะครั้งนี้</button>}</div>
          <span className={`status status-${event.status}`}>{statusLabel}</span>
        </article>;
      })}</div> : <div className="calendar-empty"><Icon name="calendar" size={25} /><div><strong>ไม่มีงานในวันนี้</strong><p>เลือกวันอื่นหรือเพิ่มกิจวัตรเพื่อดูตารางการดูแล</p></div></div>}
    </div>
  </section>;
}
