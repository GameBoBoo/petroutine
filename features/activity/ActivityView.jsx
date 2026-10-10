"use client";

import { useCallback, useEffect, useState } from 'react';

const ACTION_NAMES = {
  create: 'สร้าง', update: 'แก้ไข', complete: 'ทำเสร็จ', skip: 'ข้าม',
  reschedule: 'เลื่อนเวลา', reassign: 'เปลี่ยนผู้รับผิดชอบ', archive: 'เก็บข้อมูล',
  restore: 'กู้คืน', undo: 'ย้อนกลับ', join: 'เข้าร่วม',
};

const ENTITY_NAMES = {
  care_task: 'งานดูแล', routine: 'กิจวัตร', pet: 'สัตว์เลี้ยง',
  care_entry: 'บันทึกการดูแล', health_record: 'ข้อมูลสุขภาพ', household: 'บ้าน',
  household_member: 'สมาชิกบ้าน', user: 'โปรไฟล์', user_settings: 'การตั้งค่า',
};

export default function ActivityView({ householdId, members = [], pets = [], api }) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [filters, setFilters] = useState({ member_id: '', pet_id: '', action: '' });
  const [error, setError] = useState('');

  const load = useCallback(async (next = null) => {
    const params = new URLSearchParams({ limit: '25' });
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    if (next) params.set('cursor', next);
    try {
      const data = await api(`/households/${householdId}/activity?${params}`);
      setItems(current => next ? [...current, ...(data.items || [])] : data.items || []);
      setCursor(data.next_cursor);
      setError('');
    } catch (problem) { setError(problem.message); }
  }, [api, filters, householdId]);

  useEffect(() => { load(); }, [load]);

  return <section className="content-card"><div className="section-header"><div><span className="section-kicker">CHANGE LOG</span><h2>ประวัติการเปลี่ยนแปลง</h2><p>ดูว่าใครเปลี่ยนข้อมูลอะไรและเมื่อใด พร้อมรายละเอียดก่อนและหลังการเปลี่ยนแปลง</p></div></div><div className="activity-filters"><label>สมาชิก<select value={filters.member_id} onChange={event => setFilters({ ...filters, member_id: event.target.value })}><option value="">ทุกคน</option>{members.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>สัตว์เลี้ยง<select value={filters.pet_id} onChange={event => setFilters({ ...filters, pet_id: event.target.value })}><option value="">ทุกตัว</option>{pets.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label>การกระทำ<select value={filters.action} onChange={event => setFilters({ ...filters, action: event.target.value })}><option value="">ทั้งหมด</option><option value="create">สร้าง</option><option value="update">แก้ไข</option><option value="complete">เสร็จ</option><option value="skip">ข้าม</option><option value="archive">เก็บข้อมูล</option><option value="restore">กู้คืน</option></select></label></div>{error && <p className="form-error" role="alert">{error} <button onClick={() => load()}>ลองอีกครั้ง</button></p>}{items.length ? <div className="activity-list">{items.map(item => <article key={item.id}><div><strong>{item.actor_name}</strong> · {ACTION_NAMES[item.action] || item.action} {ENTITY_NAMES[item.entity_type] || item.entity_type}<p>{item.pet_name || 'ข้อมูลส่วนกลางของบ้าน'}</p><small>{new Date(item.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}</small></div><details><summary>ดูรายละเอียด</summary><div className="activity-diff"><pre><b>ก่อนเปลี่ยน</b>{JSON.stringify(item.before_data, null, 2)}</pre><pre><b>หลังเปลี่ยน</b>{JSON.stringify(item.after_data, null, 2)}</pre></div></details></article>)}</div> : !error && <div className="empty-state"><h3>ยังไม่มีประวัติการเปลี่ยนแปลง</h3><p>เมื่อมีการสร้างหรือแก้ไขข้อมูล รายการจะปรากฏที่นี่</p></div>}{cursor && <button className="button secondary" onClick={() => load(cursor)}>โหลดเพิ่ม</button>}</section>;
}
