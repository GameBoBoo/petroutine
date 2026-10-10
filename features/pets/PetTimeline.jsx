"use client";

import { useCallback, useEffect, useState } from 'react';

export default function PetTimeline({ petId, api }) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ source_type: '', from: '', to: '' });
  const load = useCallback(async (next = null) => {
    const params = new URLSearchParams({ limit: '25' }); Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); }); if (next) params.set('cursor', next);
    try { const data = await api(`/pets/${petId}/timeline?${params}`); setItems(current => next ? [...current, ...(data.items || [])] : data.items || []); setCursor(data.next_cursor); setError(''); }
    catch (problem) { setError(problem.message); }
  }, [api, petId, filters]);
  useEffect(() => { load(); }, [load]);
  const sourceNames = { task: 'งานตามกิจวัตร', care_entry: 'ดูแลนอกตาราง', health_record: 'ข้อมูลสุขภาพ', activity: 'การเปลี่ยนแปลง' };
  return <section><div className="timeline-filters"><label>แหล่งข้อมูล<select value={filters.source_type} onChange={event => setFilters({ ...filters, source_type: event.target.value })}><option value="">ทั้งหมด</option>{Object.entries(sourceNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>ตั้งแต่<input type="date" value={filters.from} max={filters.to || undefined} onChange={event => setFilters({ ...filters, from: event.target.value })} /></label><label>ถึง<input type="date" value={filters.to} min={filters.from || undefined} onChange={event => setFilters({ ...filters, to: event.target.value })} /></label></div>{error && <p className="form-error" role="alert">{error} <button onClick={() => load()}>ลองอีกครั้ง</button></p>}{items.length ? <div className="timeline-list">{items.map(item => <article key={item.sort_key || `${item.source_type}:${item.source_id}`}><span>{sourceNames[item.source_type] || item.source_type}</span><div><strong>{item.title}</strong>{item.notes && <p>{item.notes}</p>}<small>{item.actor_name || 'ระบบ'} · {new Date(item.event_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}</small></div></article>)}</div> : !error && <div className="empty-state"><h3>ไม่พบรายการในไทม์ไลน์</h3><p>ลองปรับแหล่งข้อมูลหรือช่วงวันที่</p></div>}{cursor && <button className="button secondary" onClick={() => load(cursor)}>โหลดเพิ่ม</button>}</section>;
}
