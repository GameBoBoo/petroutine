"use client";
import { useMemo, useRef, useState } from 'react';
import Pagination from '../../components/Pagination.jsx';
import Icon from '../../components/Icon.jsx';
import SearchField from '../../components/SearchField.jsx';
import SelectField from '../../components/SelectField.jsx';
import { ROUTINE_ACTIVITY_OPTIONS } from '../../lib/form-options.js';

const ACTIVITIES = Object.fromEntries(ROUTINE_ACTIVITY_OPTIONS);
const DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
const dateText = value => value ? new Date(`${String(value).slice(0, 10)}T00:00:00+07:00`).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric' }) : '';
function scheduleText(schedule) {
  if (schedule.type === 'once') return `ครั้งเดียว · ${dateText(schedule.date)}`;
  if (schedule.type === 'interval') return `ทุก ${schedule.interval_days} วัน`;
  const days = schedule.days || [0, 1, 2, 3, 4, 5, 6];
  return days.length === 7 ? 'ทุกวัน' : [...days].sort((a, b) => a - b).map(day => DAYS[day]).join(' · ');
}
export function RoutineRows({ routines, pets, members, isOwner, busy, onEdit, onArchive, showPet = true }) {
  return <div className="compact-routine-list">{routines.map(item => {
    const schedule = item.schedule_value || {};
    const times = schedule.times || [schedule.time || '09:00'];
    const pet = pets.find(pet => pet.id === item.pet_id);
    const assignee = members.find(member => member.id === item.assigned_user_id);
    const hasDetails = item.instructions || schedule.start_date || schedule.end_date || schedule.pauses?.length;
    return <article className="compact-routine-row" key={item.id}>
      <div className="compact-routine-main"><h3>{item.title}</h3><p>{showPet && <><span className="compact-routine-pet">{pet?.name || 'สัตว์เลี้ยง'}</span><span aria-hidden="true"> · </span></>}{ACTIVITIES[item.activity_type] || 'กิจกรรมอื่น'}{!item.active && <span> · ยังไม่เปิดใช้งาน</span>}</p></div>
      <div className="compact-routine-schedule"><div className="compact-routine-times"><Icon name="clock" size={16}/>{[...times].sort().map(time => <time key={time}>{time} น.</time>)}</div><span>{scheduleText(schedule)}</span></div>
      <div className="compact-routine-person"><span>ผู้รับผิดชอบ</span><strong>{assignee?.name || 'ทุกคนในบ้าน'}</strong></div>
      {isOwner && <div className="compact-routine-actions"><button type="button" className="button ghost" disabled={busy} onClick={() => onEdit(item)} aria-label={`แก้ไข ${item.title}`}>แก้ไข</button><button type="button" className="button subtle-danger" disabled={busy} onClick={() => onArchive(item)} aria-label={`ลบ ${item.title}`}>ลบ</button></div>}
      {hasDetails && <details className="compact-routine-details"><summary>รายละเอียดเพิ่มเติม</summary>{item.instructions && <p>{item.instructions}</p>}{(schedule.start_date || schedule.end_date) && <p>{schedule.start_date && `เริ่ม ${dateText(schedule.start_date)}`}{schedule.end_date && ` · สิ้นสุด ${dateText(schedule.end_date)}`}</p>}{(schedule.pauses || []).map((pause, index) => <p key={index}>ช่วงพัก {dateText(pause.from)} – {dateText(pause.to)}</p>)}</details>}
    </article>;
  })}</div>;
}
export default function RoutinesView({ pets, routines, members, onAdd, onAddPet, onEdit, onArchive, isOwner, busy = false }) {
  const [query, setQuery] = useState('');
  const [petId, setPetId] = useState('all');
  const [page, setPage] = useState(1);
  const listTop = useRef(null);
  const visible = useMemo(() => routines.filter(item => (petId === 'all' || item.pet_id === petId) && [item.title, pets.find(pet => pet.id === item.pet_id)?.name, ACTIVITIES[item.activity_type]].join(' ').toLocaleLowerCase('th').includes(query.trim().toLocaleLowerCase('th'))), [routines, pets, petId, query]);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(visible.length / 10)));
  return <section className="content-card routine-workspace-compact"><header className="routine-page-heading"><div><h2>กิจวัตรและนัดหมาย</h2><p>จัดตารางดูแลและผู้รับผิดชอบในบ้าน</p></div><button type="button" className="button primary" disabled={busy} onClick={pets.length ? onAdd : onAddPet}><Icon name="plus" size={18}/>{pets.length ? 'เพิ่มกิจวัตร' : 'เพิ่มสัตว์เลี้ยง'}</button></header>
    {routines.length > 0 && <div className="routine-toolbar"><label>ค้นหากิจวัตร<SearchField value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="ชื่อกิจวัตรหรือสัตว์เลี้ยง"/></label><label>สัตว์เลี้ยง<SelectField value={petId} onChange={event => { setPetId(event.target.value); setPage(1); }}><option value="all">ทุกตัว</option>{pets.map(pet => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</SelectField></label><span role="status">{visible.length} รายการ</span></div>}
    {visible.length ? <div ref={listTop}><RoutineRows routines={visible.slice((currentPage - 1) * 10, currentPage * 10)} pets={pets} members={members} isOwner={isOwner} busy={busy} onEdit={onEdit} onArchive={onArchive}/><Pagination page={currentPage} pageSize={10} total={visible.length} onPageChange={setPage} scrollRef={listTop}/></div> : <div className="empty-state"><h3>{routines.length ? 'ไม่พบกิจวัตรที่ค้นหา' : 'ยังไม่มีกิจวัตร'}</h3><p>{routines.length ? 'ลองเปลี่ยนคำค้นหาหรือเลือกสัตว์เลี้ยงตัวอื่น' : pets.length ? 'เพิ่มตารางให้อาหาร เติมน้ำ หรือกิจกรรมที่ทำประจำ' : 'เพิ่มสัตว์เลี้ยงก่อนเริ่มจัดตารางดูแล'}</p>{routines.length > 0 && <button type="button" className="button secondary" onClick={() => { setQuery(''); setPetId('all'); }}>ล้างตัวกรอง</button>}</div>}
  </section>;
}
