"use client";
import BrandLogo from "../components/BrandLogo.jsx";
import Icon from "../components/Icon.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import PetAvatar from "../components/PetAvatar.jsx";
import LandingPage from "../features/landing/LandingPage.jsx";
import AuthScreen from "../features/auth/AuthScreen.jsx";
import RoutinesView from "../features/routines/RoutinesView.jsx";
import { useConfirmation } from "../components/ConfirmationProvider.jsx";
import SearchField from '../components/SearchField.jsx';
import { MemberTools } from '../features/household/HouseholdTools.jsx';
import CalendarView from '../features/calendar/CalendarView.jsx';

import SelectField from '../components/SelectField.jsx';
import DatePicker from '../components/DatePicker.jsx';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatBangkokTime } from '../lib/calendar.js';
import ProductTodayView from '../features/today/TodayView.jsx';
import UndoBar from '../components/UndoBar.jsx';
import QuickAddSheet from '../features/quick-add/QuickAddSheet.jsx';
import RoutineForm from '../features/routines/RoutineForm.jsx';
import { getRoutineTemplate } from '../features/routines/templates.js';
import PetWorkspace from '../features/pets/PetWorkspace.jsx';
import AiChatWidget from '../features/pets/AiChatWidget.jsx';
import AiSettings from '../features/pets/AiSettings.jsx';

const API = '/api/v1';
const NAV = [
  { id: 'today', label: 'วันนี้', icon: 'home' },
  { id: 'calendar', label: 'ปฏิทิน', icon: 'calendar' },
  { id: 'pets', label: 'สัตว์เลี้ยง', icon: 'paw' },
  { id: 'routines', label: 'กิจวัตร', icon: 'clock' },
  { id: 'history', label: 'ประวัติ', icon: 'history' },
  { id: 'household', label: 'บ้านและสมาชิก', icon: 'users' },
  { id: 'settings', label: 'ตั้งค่า', icon: 'settings' },
];
const MOBILE_NAV = [NAV[0], NAV[1], { id: 'add', label: 'เพิ่ม', icon: 'plus' }, NAV[2], { id: 'more', label: 'เพิ่มเติม', icon: 'more' }];
const ACTIVITIES = { follow_up: 'ติดตามสุขภาวะ', allergy: 'การแพ้', condition: 'โรค/ภาวะประจำตัว', feeding: 'ให้อาหาร', water: 'เติมน้ำ', walk: 'พาเดินเล่น', grooming: 'ดูแลขน', medication: 'บันทึกยา', vet: 'พบสัตวแพทย์', vaccination: 'วัคซีน', appointment: 'นัดหมาย', bathing: 'อาบน้ำ', supplies: 'ซื้อของ', observation: 'ข้อสังเกต', other: 'อื่น ๆ' };
const STATUS = { pending: 'รอดำเนินการ', overdue: 'เลยเวลา', completed: 'เสร็จแล้ว', skipped: 'ข้ามแล้ว' };
const bangkokInput = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date()).replace(' ', 'T');

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error?.message || 'เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง');
    error.status = response.status;
    error.code = data?.error?.code;
    throw error;
  }
  return data;
}

function Brand() {
  return <div className="brand"><BrandLogo /></div>;
}

function EmptyState({ icon = 'paw', title, description, action, onAction }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name={icon} size={28} /></span><h3>{title}</h3><p>{description}</p>{action && <button className="button secondary" onClick={onAction}><Icon name="plus" size={18} />{action}</button>}</div>;
}

function Modal({ title, description, children, onClose }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement;
    function onKey(event) {
      if (event.key === 'Escape' && !document.querySelector('.select-field-menu')) closeRef.current();
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const controls = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')];
      if (!controls.length) return;
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previous?.focus?.(); };
  }, []);
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-top"><div><span className="eyebrow">PETROUTINE</span><h2 id="modal-title">{title}</h2>{description && <p className="muted">{description}</p>}</div><button className="icon-button" type="button" onClick={onClose} aria-label="ปิดหน้าต่าง"><Icon name="close" /></button></div>{children}</section></div>;
}

function WorkspaceForm({ kind, pets, members, item, currentId, headers, onClose, onSaved }) {
  const confirm = useConfirmation();
  const editingPet = kind === 'editPet';
  const isPet = kind === 'pet' || editingPet;
  const [form, setForm] = useState({ name: item?.name || '', invite_code: '', species: item?.species || 'dog', birth_date: item?.birth_date ? String(item.birth_date).slice(0, 10) : '', breed: item?.breed || '', sex: item?.sex || '', neuter_status: item?.neuter_status || '', baseline_weight_kg: item?.baseline_weight_kg ?? '', baseline_weight_recorded_on: item?.baseline_weight_recorded_on ? String(item.baseline_weight_recorded_on).slice(0, 10) : '', notes: item?.notes || '', vet_contact: item?.vet_contact || '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const canSubmit = kind === 'join' ? Boolean(form.invite_code.trim()) : Boolean(form.name.trim() && (kind !== 'household' || form.name.trim().length >= 2));
  const titles = { household: 'สร้างบ้านใหม่', join: 'เข้าร่วมบ้าน', pet: 'เพิ่มสัตว์เลี้ยง', editPet: 'แก้ไขข้อมูลสัตว์เลี้ยง' };
  async function submit(event) {
    event.preventDefault();
    if (!await confirm({ title: `${titles[kind]}?`, description: kind === 'join' ? `เข้าร่วมบ้านด้วยรหัส ${form.invite_code} เพื่อดูแลร่วมกับสมาชิกในบ้าน` : `ยืนยันข้อมูล “${form.name}” ก่อนบันทึก`, confirmLabel: 'ยืนยันบันทึก' })) return;
    setSaving(true); setError('');
    try {
      const path = kind === 'household' ? '/households' : kind === 'join' ? '/households/join' : editingPet ? `/pets/${item.id}` : `/households/${currentId}/pets`;
      const body = kind === 'household' ? { name: form.name } : kind === 'join' ? { invite_code: form.invite_code } : { name: form.name, species: form.species, birth_date: form.birth_date || null, breed: form.breed, sex: form.sex || null, neuter_status: form.neuter_status || null, baseline_weight_kg: form.baseline_weight_kg === '' ? null : Number(form.baseline_weight_kg), baseline_weight_recorded_on: form.baseline_weight_recorded_on || null, notes: form.notes, vet_contact: form.vet_contact };
      const result = await api(path, { method: editingPet ? 'PATCH' : 'POST', headers, body: JSON.stringify(body) });
      onSaved(result);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  return <Modal title={titles[kind]} onClose={onClose}><form className="form-stack" onSubmit={submit}>
    {kind === 'household' && <label>ชื่อบ้าน <span className="required-mark" aria-hidden="true">*</span><input required minLength="2" autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="เช่น บ้านของโมจิ" /></label>}
    {kind === 'join' && <label>รหัสเชิญ <span className="required-mark" aria-hidden="true">*</span><input required autoFocus value={form.invite_code} onChange={e => setForm({ ...form, invite_code: e.target.value.toUpperCase() })} placeholder="กรอกรหัสจากเจ้าของบ้าน" /></label>}
    {isPet && <><label>ชื่อสัตว์เลี้ยง <span className="required-mark" aria-hidden="true">*</span><input required autoFocus maxLength="120" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="เช่น โมจิ" /></label><div className="form-grid"><label>ประเภท<SelectField value={form.species} onChange={e => setForm({ ...form, species: e.target.value })}><option value="dog">สุนัข</option><option value="cat">แมว</option></SelectField></label><label>สายพันธุ์<input maxLength="120" value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} placeholder="เช่น โกลเด้นรีทรีฟเวอร์" /></label></div><div className="form-grid"><label>เพศ<SelectField value={form.sex} onChange={e => setForm({ ...form, sex: e.target.value })}><option value="">ยังไม่ระบุ</option><option value="male">ผู้</option><option value="female">เมีย</option><option value="unknown">ไม่ทราบ</option></SelectField></label><label>สถานะทำหมัน<SelectField value={form.neuter_status} onChange={e => setForm({ ...form, neuter_status: e.target.value })}><option value="">ยังไม่ระบุ</option><option value="neutered">ทำหมันแล้ว</option><option value="not_neutered">ยังไม่ทำหมัน</option><option value="unknown">ไม่ทราบ</option></SelectField></label></div><div className="form-grid"><label>วันเกิด (ถ้าทราบ)<DatePicker value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} /></label><label>ติดต่อสัตวแพทย์<input value={form.vet_contact} onChange={e => setForm({ ...form, vet_contact: e.target.value })} placeholder="เบอร์หรือชื่อคลินิก" /></label></div><fieldset className="profile-weight"><legend>น้ำหนักตั้งต้น</legend><label>น้ำหนัก (กก.)<input type="number" min="0.001" step="0.001" inputMode="decimal" value={form.baseline_weight_kg} onChange={e => setForm({ ...form, baseline_weight_kg: e.target.value })} /></label><label>วันที่ชั่ง<DatePicker value={form.baseline_weight_recorded_on} onChange={e => setForm({ ...form, baseline_weight_recorded_on: e.target.value })} /></label></fieldset><label>ข้อมูลที่ควรรู้<textarea rows="3" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="ข้อควรระวังทั่วไป; ข้อมูลสุขภาพระยะยาวเพิ่มในสมุดสุขภาพ" /></label></>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions"><button type="button" className="button ghost" disabled={saving} onClick={onClose}>ยกเลิก</button><button className="button primary" disabled={saving || !canSubmit}>{saving ? 'กำลังบันทึก…' : kind === 'join' ? 'เข้าร่วมบ้าน' : 'บันทึก'}</button></div>
  </form></Modal>;
}

function TaskCard({ task, onComplete, onSkip, busy }) {
  const done = task.display_status === 'completed' || task.display_status === 'skipped';
  return <article className={`task-card task-${task.display_status}`}><div className="task-time"><Icon name="clock" size={17} /><span>{formatBangkokTime(task.scheduled_at)}</span></div><div className="task-details"><div className="task-title-row"><h3>{task.title}</h3><span className={`status status-${task.display_status}`}>{STATUS[task.display_status] || task.display_status}</span></div><p><span className="pet-name">{task.pet_name}</span><span className="dot-separator">·</span>{ACTIVITIES[task.activity_type] || task.activity_type}</p>{done && task.completed_by_name && <small>โดย {task.completed_by_name}</small>}</div><div className="task-actions">{done ? <span className="task-done-icon"><Icon name={task.display_status === 'completed' ? 'check' : 'skip'} size={19} /></span> : <><button className="button complete" disabled={busy} onClick={() => onComplete(task.id)}><Icon name="check" size={17} />เสร็จแล้ว</button><button className="button skip" disabled={busy} onClick={() => onSkip(task.id)} aria-label={`ข้ามงาน ${task.title} ของ ${task.pet_name}`}>ข้าม</button></>}</div></article>;
}

function LegacyTodayView({ tasks, pets, onComplete, onSkip, onAddPet, onAddRoutine, busyId, canManage }) {
  const [filter, setFilter] = useState('all');
  const completed = tasks.filter(task => task.display_status === 'completed').length;
  const remaining = tasks.filter(task => ['pending', 'overdue'].includes(task.display_status)).length;
  const overdue = tasks.filter(task => task.display_status === 'overdue').length;
  const filtered = tasks.filter(task => filter === 'all' || (filter === 'todo' ? ['pending', 'overdue'].includes(task.display_status) : task.display_status === filter));
  return <><section className="today-hero"><div className="hero-copy"><span className="hero-label"><Icon name="sparkle" size={17} /> TODAY&apos;S CARE</span><h2>ทุกเรื่องเล็ก ๆ<br />คือความใส่ใจ</h2><p>ดูงานที่ต้องทำให้เพื่อนตัวน้อย แล้วอัปเดตให้ทุกคนในบ้านรู้พร้อมกัน</p>{(canManage || !pets.length) && <button className="button hero-button" onClick={pets.length ? onAddRoutine : onAddPet}><Icon name="plus" size={18} />{pets.length ? 'เพิ่มกิจวัตร' : 'เพิ่มสัตว์เลี้ยง'}</button>}</div><div className="hero-visual" aria-hidden="true"><span className="hero-circle circle-one" /><span className="hero-circle circle-two" /><span className="hero-icon"><Icon name="paw" size={86} /></span><span className="hero-mini mini-one"><Icon name="check" size={23} /></span><span className="hero-mini mini-two"><Icon name="sparkle" size={25} /></span></div></section>
    <section className="summary-grid" aria-label="ภาพรวมวันนี้"><div className="summary-card"><span>งานทั้งหมด</span><strong>{tasks.length}</strong><small>รายการในวันนี้</small></div><div className="summary-card"><span>เสร็จแล้ว</span><strong>{completed}</strong><small>ดูแลเรียบร้อย</small></div><div className="summary-card"><span>ยังรออยู่</span><strong>{remaining}</strong><small>{overdue ? `${overdue} รายการเลยเวลา` : 'ตามตารางวันนี้'}</small></div></section>
    <section className="content-card"><div className="section-header"><div><span className="section-kicker">แผนดูแลประจำวัน</span><h2>งานดูแลวันนี้</h2><p>เรียงตามเวลา เพื่อให้รู้ว่าต้องทำอะไรก่อน</p></div><span className="date-badge">{new Date().toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric' })}</span></div><div className="filter-row" role="group" aria-label="กรองงาน">{[['all', 'ทั้งหมด'], ['todo', 'รอดำเนินการ'], ['completed', 'เสร็จแล้ว'], ['skipped', 'ข้ามแล้ว']].map(([value, label]) => <button key={value} className={filter === value ? 'filter-chip active' : 'filter-chip'} onClick={() => setFilter(value)} aria-pressed={filter === value}>{label}</button>)}</div>{!tasks.length ? <EmptyState icon="calendar" title="วันนี้ยังไม่มีงาน" description={pets.length ? 'เมื่อเจ้าของบ้านเพิ่มกิจวัตร งานจะปรากฏที่นี่' : 'เริ่มจากเพิ่มสุนัขหรือแมวในบ้านก่อน'} action={pets.length ? canManage ? 'เพิ่มกิจวัตร' : undefined : 'เพิ่มสัตว์เลี้ยง'} onAction={pets.length ? onAddRoutine : onAddPet} /> : filtered.length ? <div className="task-list">{filtered.map(task => <TaskCard key={task.id} task={task} onComplete={onComplete} onSkip={onSkip} busy={busyId === task.id} />)}</div> : <EmptyState icon="check" title="ไม่มีงานในหมวดนี้" description="ลองเลือกตัวกรองอื่นเพื่อดูรายการทั้งหมด" />}</section></>;
}

function PetsView({ pets, onAdd, onEdit, onArchive, isOwner }) {
  return <section className="content-card"><div className="section-header"><div><span className="section-kicker">เพื่อนในบ้าน</span><h2>สัตว์เลี้ยงในบ้าน</h2><p>ข้อมูลที่ทุกคนใช้ดูแลร่วมกัน</p></div><button className="button primary" onClick={onAdd}><Icon name="plus" size={18} />เพิ่มสัตว์เลี้ยง</button></div>{pets.length ? <div className="pet-grid">{pets.map(pet => <article className="pet-card" key={pet.id}><div className="pet-card-top"><PetAvatar pet={pet} size="large" /><span className="pet-type">{pet.species === 'cat' ? 'แมว' : 'สุนัข'}</span></div><h3>{pet.name}</h3>{pet.birth_date && <p>วันเกิด {new Date(pet.birth_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}{pet.notes && <p className="pet-note">{pet.notes}</p>}{pet.vet_contact && <div className="pet-vet">สัตวแพทย์: {pet.vet_contact}</div>}<div className="manage-actions"><button className="button ghost" onClick={() => onEdit(pet)}>แก้ไข</button>{isOwner && <button className="button danger" onClick={() => onArchive(pet)}><Icon name="trash" size={17}/>ลบสัตว์เลี้ยง</button>}</div></article>)}</div> : <EmptyState title="ยังไม่มีสัตว์เลี้ยงในบ้าน" description="เพิ่มเพื่อนตัวแรก แล้วจึงสร้างกิจวัตรของเขา" action="เพิ่มสัตว์เลี้ยง" onAction={onAdd} />}</section>;
}

function HistoryView({ history, pets, currentId, headers }) {
  const [petId, setPetId] = useState('all');
  const [activity, setActivity] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [results, setResults] = useState(history);
  const [historySearch,setHistorySearch]=useState('');
  const [filterError, setFilterError] = useState('');
  const historyPets = useMemo(() => [...pets, ...history.filter(item => !pets.some(pet => pet.id === item.pet_id)).map(item => ({ id: item.pet_id, name: `${item.pet_name} (ลบแล้ว)` }))].filter((pet, index, list) => list.findIndex(item => item.id === pet.id) === index), [pets, history]);
  useEffect(() => { if (petId !== 'all' && !historyPets.some(pet => pet.id === petId)) setPetId('all'); }, [petId, historyPets]);
  useEffect(() => {
    let cancelled = false;
    if (petId === 'all' && activity === 'all' && !from && !to) { setResults(history); setFilterError(''); return; }
    const params = new URLSearchParams();
    if (petId !== 'all') params.set('pet_id', petId);
    if (activity !== 'all') params.set('activity_type', activity);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    api(`/households/${currentId}/history?${params}`, { headers }).then(data => { if (!cancelled) { setResults(data.history || []); setFilterError(''); } }).catch(error => { if (!cancelled) setFilterError(error.message); });
    return () => { cancelled = true; };
  }, [petId, activity, from, to, currentId, headers, history]);
  return <section className="content-card"><div className="section-header"><div><span className="section-kicker">งานที่ทำไปแล้ว</span><h2>ประวัติงานดูแล</h2><p>ดูงานตามกิจวัตรที่สมาชิกทำเสร็จหรือข้าม · เหตุการณ์สุขภาพดูได้ใน ไทม์ไลน์ของสัตว์</p></div></div><div className="history-filters"><label>ค้นหางานหรือผู้บันทึก<SearchField value={historySearch} onChange={e=>setHistorySearch(e.target.value)}/></label><label>สัตว์เลี้ยง<SelectField value={petId} onChange={event => setPetId(event.target.value)}><option value="all">ทุกตัว</option>{historyPets.map(pet => <option key={pet.id} value={pet.id} data-description={pet.species === 'cat' ? 'แมว' : 'สุนัข'}>{pet.name}</option>)}</SelectField></label><label>กิจกรรม<SelectField value={activity} onChange={event => setActivity(event.target.value)}><option value="all">ทุกประเภท</option>{Object.entries(ACTIVITIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField></label><label>ตั้งแต่<DatePicker value={from} max={to || undefined} onChange={event => setFrom(event.target.value)} /></label><label>ถึง<DatePicker value={to} min={from || undefined} onChange={event => setTo(event.target.value)} /></label></div>{filterError && <p className="form-error" role="alert">{filterError}</p>}{results.length ? <div className="history-list">{results.filter(item=>[item.title,item.pet_name,item.completed_by_name,item.notes].join(' ').toLowerCase().includes(historySearch.toLowerCase())).map(item => <article className="history-item" key={item.id}><span className={`history-symbol ${item.status}`}><Icon name={item.status === 'completed' ? 'check' : 'skip'} size={18} /></span><div><h3>{item.title}</h3><p>{item.pet_name} <span className="dot-separator">·</span> {item.completed_by_name || 'ไม่ระบุผู้ทำ'}</p><small>{new Date(item.completed_at || item.scheduled_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>{item.notes && <p className="history-note">หมายเหตุ: {item.notes}</p>}</div><span className={`status status-${item.status}`}>{STATUS[item.status] || item.status}</span></article>)}</div> : <EmptyState icon="history" title="ยังไม่มีประวัติในรายการนี้" description="ลองปรับตัวกรองหรือทำงานดูแลรายการแรก" />}</section>;
}

function HouseholdView({ household, members, onCreate, onJoin, onCopy, onTrash, apiClient, onUpdated }) {
  if (!household) return <section className="content-card household-start"><span className="empty-icon"><Icon name="users" size={29} /></span><h2>เริ่มจากสร้างบ้านของเรา</h2><p>สร้างบ้านใหม่หรือเข้าร่วมบ้านที่ได้รับคำเชิญ เพื่อดูแลสัตว์เลี้ยงร่วมกัน</p><div><button type="button" className="button primary" onClick={onCreate}><Icon name="plus" size={18} />สร้างบ้าน</button><button type="button" className="button secondary" onClick={onJoin}>เข้าร่วมด้วยรหัส</button></div></section>;
  const owner = household.role === 'owner';
  const expiry = household.invite_expires_at ? new Date(household.invite_expires_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' }) : null;
  const inviteExpired = household.invite_expires_at && new Date(household.invite_expires_at) < new Date();
  return <div className="household-workspace">
    <header className="content-card household-intro"><div><span className="section-kicker">บ้านของเรา</span><h2>{household.name}</h2><p>พื้นที่กลางสำหรับตารางและข้อมูลการดูแลของทุกคน</p></div><div className="household-intro-meta"><span className="role-badge">{owner ? 'เจ้าของบ้าน' : 'สมาชิก'}</span><span><Icon name="users" size={17} />{members.length} คนในบ้าน</span></div></header>
    <div className="household-layout">
      <section className="content-card household-members"><header className="section-header"><div><span className="section-kicker">คนที่ดูแลด้วยกัน</span><h3>สมาชิกในบ้าน</h3><p>สมาชิกทุกคนเห็นแผนและประวัติการดูแลร่วมกัน</p></div><span className="household-count">{members.length} คน</span></header><div className="member-list">{members.map(member => <div className="member-row" key={member.id}><span className="member-avatar">{member.name?.slice(0, 1) || 'U'}</span><div><strong>{member.name}</strong><small>{member.email}</small></div><span className="member-role">{member.role === 'owner' ? 'เจ้าของบ้าน' : 'สมาชิก'}</span></div>)}</div></section>
      <section className="content-card invite-card"><span className="section-kicker">ชวนคนในบ้าน</span><h3>ดูแลไปด้วยกัน</h3><p>ส่งรหัสเชิญให้คนที่อยากชวนมาดูแลสัตว์เลี้ยงในบ้านนี้</p>{household.invite_code ? <><div className="invite-code"><span className="invite-code-label">รหัสคำเชิญ</span><strong>{household.invite_code}</strong><button type="button" className="button secondary" onClick={onCopy} disabled={inviteExpired}><Icon name="copy" size={17} />คัดลอกรหัส</button></div><p className={`invite-expiry${inviteExpired ? ' expired' : ''}`}><Icon name="clock" size={16} />{inviteExpired ? 'รหัสหมดอายุแล้ว · เปลี่ยนรหัสเชิญในส่วนสิทธิ์ด้านล่าง' : `ใช้ได้ถึง ${expiry || 'ยังไม่กำหนด'}`}</p></> : <p className="invite-owner-note">รหัสเชิญจะแสดงให้เจ้าของบ้านคัดลอกและส่งต่อ</p>}</section>
    </div>
    <MemberTools household={household} members={members} api={apiClient} onUpdated={onUpdated} />
    <section className="content-card household-other-actions"><header><span className="section-kicker">บ้านและการเข้าร่วม</span><h3>จัดการบ้านอื่น ๆ</h3><p>สร้างพื้นที่ใหม่ หรือเข้าร่วมบ้านที่มีคนชวนไว้แล้ว</p></header><div className="household-other-buttons"><button type="button" className="button secondary" onClick={onCreate}><Icon name="plus" size={18} />สร้างบ้านใหม่</button><button type="button" className="button ghost" onClick={onJoin}><Icon name="users" size={18} />เข้าร่วมบ้านอื่น</button></div>{owner && <div className="household-danger-zone"><div><strong>ลบบ้านนี้</strong><p>ใช้เมื่อไม่ต้องการให้บ้านนี้แสดงในรายการอีก</p></div><button type="button" className="button danger" onClick={() => onTrash(household)}><Icon name="trash" size={17} />ลบบ้าน</button></div>}</section>
  </div>;
}

function TrashHouseholdModal({ household, busy, onClose, onConfirm }) {
  const [confirmation, setConfirmation] = useState('');
  const matches = confirmation === household.name;
  return <Modal title="ลบบ้าน" description="บ้านจะถูกซ่อนจากสมาชิกทุกคนและจะไม่แสดงในหน้า บ้านของเรา แต่ข้อมูลเดิมจะยังถูกเก็บไว้อย่างปลอดภัย" onClose={onClose}><form className="form-stack" onSubmit={event => { event.preventDefault(); if (matches) onConfirm(); }}><label>พิมพ์ชื่อบ้าน “{household.name}” เพื่อยืนยัน<input autoFocus value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" /></label><div className="form-actions"><button type="button" className="button ghost" onClick={onClose}>ยกเลิก</button><button className="button danger" disabled={!matches || busy}>{busy ? 'กำลังลบ…' : 'ยืนยันลบบ้าน'}</button></div></form></Modal>;
}

function SettingsView({ session, household, headers, onUpdated, apiClient, refreshWorkspace }) {
  const confirm = useConfirmation();
  const [name, setName] = useState(session.user?.name || '');
  const [houseName, setHouseName] = useState(household?.name || '');
  const [settings, setSettings] = useState({ notifications_enabled: true, lead_minutes: 60, health_reminder_days: 30 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => { setHouseName(household?.name || ''); }, [household?.name]);
  useEffect(() => { let cancelled = false; api('/auth/settings', { headers }).then(data => { if (!cancelled) setSettings(data.settings); }).catch(err => { if (!cancelled) setError(err.message); }).finally(() => { if (!cancelled) setLoading(false); }); return () => { cancelled = true; }; }, [headers]);
  async function save(event, kind) {
    event.preventDefault();
    if (!await confirm({ title: 'บันทึกการตั้งค่า?', description: kind === 'name' ? `เปลี่ยนชื่อที่แสดงเป็น “${name}”` : kind === 'house' ? `เปลี่ยนชื่อบ้านเป็น “${houseName}”` : `การแจ้งเตือน: ${settings.notifications_enabled ? 'เปิด' : 'ปิด'} · เตือนงานล่วงหน้า ${settings.lead_minutes} นาที · เตือนสุขภาพล่วงหน้า ${settings.health_reminder_days} วัน`, confirmLabel: 'ยืนยันบันทึก' })) return;
    setSaving(kind); setError(''); setNotice('');
    try {
      const path = kind === 'name' ? '/auth/me' : kind === 'house' ? `/households/${household.id}` : '/auth/settings';
      const body = kind === 'name' ? { name } : kind === 'house' ? { name: houseName } : settings;
      const result = await api(path, { method: 'PATCH', headers, body: JSON.stringify(body) });
      if (kind === 'name') { const next = { ...session, user: result.user }; window.localStorage.setItem('pawroutine_session', JSON.stringify(next)); onUpdated(next); }
      else if (kind === 'house') onUpdated();
      else onUpdated();
      setNotice('บันทึกการตั้งค่าแล้ว');
    } catch (err) { setError(`${err.message} กรุณาตรวจข้อมูลแล้วลองอีกครั้ง`); }
    finally { setSaving(''); }
  }
  return <section className="content-card settings-view"><div className="section-header"><div><span className="section-kicker">พื้นที่ของเรา</span><h2>ตั้งค่า PetRoutine</h2><p>ข้อมูลที่ใช้จริงกับบัญชีและบ้านของคุณ</p></div></div>{error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="settings-success" role="status">{notice}</p>}{loading ? <div className="settings-skeleton" aria-busy="true" role="status" aria-label="กำลังโหลดการตั้งค่า"><i /><i /><i /></div> : <div className="settings-grid"><div className="settings-card appearance-card"><h3>รูปแบบการแสดงผล</h3><p>เลือกพื้นหลังที่สบายตาสำหรับการใช้งานของคุณ ระบบจะจำไว้บนอุปกรณ์นี้</p><ThemeToggle showLabel /></div><form className="settings-card form-stack" onSubmit={event => save(event, 'name')}><h3>ข้อมูลบัญชี</h3><label>ชื่อที่แสดง <span className="required-mark" aria-hidden="true">*</span><input required minLength="2" maxLength="120" value={name} onChange={event => setName(event.target.value)} /></label><p className="muted">อีเมล: {session.user?.email}</p><button className="button primary" disabled={Boolean(saving) || name.trim().length < 2}>{saving === 'name' ? 'กำลังบันทึก…' : 'บันทึกชื่อ'}</button></form><form className="settings-card form-stack" onSubmit={event => save(event, 'notifications')}><h3>แจ้งเตือนในเว็บ</h3><label className="checkbox-row"><input type="checkbox" checked={settings.notifications_enabled} onChange={event => setSettings({ ...settings, notifications_enabled: event.target.checked })} /> เปิดการแจ้งเตือน</label><label>เตือนงานล่วงหน้า<SelectField value={settings.lead_minutes} onChange={event => setSettings({ ...settings, lead_minutes: Number(event.target.value) })}><option value="0">เมื่อถึงเวลา</option><option value="15">15 นาที</option><option value="30">30 นาที</option><option value="60">1 ชั่วโมง</option><option value="120">2 ชั่วโมง</option><option value="1440">1 วัน</option></SelectField></label><label>เตือนวัคซีน/นัดหมายล่วงหน้า<SelectField value={settings.health_reminder_days} onChange={event => setSettings({ ...settings, health_reminder_days: Number(event.target.value) })}>{[7, 14, 30, 60, 90].map(days => <option key={days} value={days}>{days} วัน</option>)}</SelectField></label><p className="muted">รวมกำหนดสุขภาพและรายการติดตาม แสดงเมื่อเปิดเว็บไซต์เท่านั้น ยังไม่ส่งอีเมลหรือ การแจ้งเตือนแบบพุช</p><button className="button primary" disabled={Boolean(saving)}>{saving === 'notifications' ? 'กำลังบันทึก…' : 'บันทึกการแจ้งเตือน'}</button></form>{household?.role === 'owner' && <form className="settings-card form-stack" onSubmit={event => save(event, 'house')}><h3>บ้านของเรา</h3><label>ชื่อบ้าน <span className="required-mark" aria-hidden="true">*</span><input required minLength="2" maxLength="120" value={houseName} onChange={event => setHouseName(event.target.value)} /></label><button className="button primary" disabled={Boolean(saving) || houseName.trim().length < 2}>{saving === 'house' ? 'กำลังบันทึก…' : 'บันทึกชื่อบ้าน'}</button></form>}<AiSettings householdId={household.id} headers={headers} /><div className="settings-card"><h3>ความเป็นส่วนตัวและข้อมูล</h3><p>AI ช่วยค้นและสรุปบันทึก คุณจัดการความยินยอมได้ในส่วน AI</p><p>แสดงเวลาประเทศไทย (Asia/Bangkok) แจ้งเตือนเมื่อเปิดเว็บไซต์</p></div></div>}</section>;
}

function MoreView({ onNavigate, onLogout }) {
  return <section className="content-card more-view"><span className="section-kicker">เพิ่มเติม</span><h2>เพิ่มเติม</h2><div className="more-list">{NAV.filter(item => ['routines', 'history', 'household', 'settings'].includes(item.id)).map(item => <button key={item.id} className="nav-item" onClick={() => onNavigate(item.id)}><Icon name={item.icon} /><span>{item.label}</span><Icon name="chevron" size={17} /></button>)}<button className="nav-item logout" onClick={onLogout}><Icon name="logout" /><span>ออกจากระบบ</span></button></div></section>;
}

function NotificationItem({ item, busy, onDelete, onOpen }) {
  let kind = 'งานดูแล';
  let title = item.title;
  let detail;
  if (item.type === 'health_due') {
    kind = item.entry_type === 'vaccination' ? 'วัคซีน' : 'นัดหมาย';
    const status = item.status === 'overdue' ? 'เลยกำหนด' : item.status === 'due_today' ? 'ครบกำหนดวันนี้' : `กำหนด ${new Date(`${String(item.due_date).slice(0, 10)}T00:00:00+07:00`).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium' })}`;
    detail = `${item.pet_name} · ${status}`;
  } else if (item.type === 'wellness_alert') {
    const names = { food_intake: 'การกินอาหาร', water_intake: 'การดื่มน้ำ', activity_level: 'กิจกรรม', sleep_amount: 'การนอน', stool_condition: 'การขับถ่าย', mood: 'อารมณ์', weight_kg: 'น้ำหนัก' };
    const status = item.status === 'overdue' ? 'เลยวันติดตาม' : item.status === 'due_today' ? 'ติดตามวันนี้' : item.status === 'upcoming' ? `ติดตาม ${new Date(`${String(item.due_date).slice(0, 10)}T00:00:00+07:00`).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium' })}` : 'รอวางแผนติดตาม';
    kind = 'ติดตามสุขภาพ';
    title = names[item.metric] || item.metric;
    detail = `${item.pet_name} · ${status}${item.assigned_to_name ? ` · ${item.assigned_to_name}` : ''}`;
  } else {
    detail = `${item.pet_name} · ${item.status === 'overdue' ? 'เลยเวลา' : 'ใกล้ถึงเวลา'} ${new Date(item.scheduled_at).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' })}`;
  }
  return <div className={`notification-item notification-${item.status}`}><span className="notification-item-icon" aria-hidden="true"><Icon name={item.type === 'task' ? 'clock' : item.type === 'health_due' ? 'calendar' : 'alert'} size={19}/></span><button type="button" className="notification-copy notification-open" onClick={() => onOpen(item)}><span className="notification-type">{kind}</span><strong>{title}</strong><p>{detail}</p><span className="notification-open-label">ดูรายละเอียด <Icon name="arrow" size={13}/></span></button><button type="button" className="icon-button notification-delete" disabled={busy} onClick={() => onDelete(item)} aria-label={`ลบแจ้งเตือน ${title}`} title="ลบแจ้งเตือน"><Icon name="trash" size={17} /></button></div>;
}

function NotificationPanel({ notifications, busyId, onDelete, onDeleteAll, onOpen, onClose, onSettings }) {
  const urgent = notifications.filter(item => item.status === 'overdue' || item.status === 'due_today' || item.status === 'attention');
  const upcoming = notifications.filter(item => !urgent.includes(item));
  const busy = busyId.startsWith('notification:') || busyId === 'notifications:all';
  const group = (label, items) => items.length ? <div className="notification-group" key={label}><h3>{label}<span>{items.length}</span></h3><div className="notification-list">{items.map(item => <NotificationItem key={item.notification_key || `${item.type || 'task'}:${item.id}`} item={item} busy={busy} onDelete={onDelete} onOpen={onOpen} />)}</div></div> : null;
  return <section className="notification-panel" aria-label="รายการแจ้งเตือน"><header className="notification-panel-head"><div><span className="section-kicker">ข่าวสารล่าสุด</span><h2>การแจ้งเตือน</h2><p>{notifications.length ? `${notifications.length} รายการที่ต้องดูแล` : 'ไม่มีรายการที่ต้องดูแล'}</p></div><button type="button" className="icon-button" onClick={onClose} aria-label="ปิดรายการแจ้งเตือน"><Icon name="close" size={18} /></button></header>{notifications.length ? <><div className="notification-panel-actions"><span>ของบ้านนี้</span><button type="button" className="notification-clear-all" disabled={busy} onClick={onDeleteAll}><Icon name="trash" size={16}/>{busyId === 'notifications:all' ? 'กำลังลบ…' : 'ลบทั้งหมด'}</button></div><div className="notification-scroll">{group('ควรดูตอนนี้', urgent)}{group('กำลังจะถึง', upcoming)}</div></> : <div className="notification-empty"><span><Icon name="check" size={24}/></span><strong>เรียบร้อยแล้ว</strong><p>หากมีงานหรือกำหนดสุขภาพใหม่ ระบบจะแสดงที่นี่</p></div>}<footer className="notification-panel-footer"><button type="button" onClick={onSettings}><Icon name="settings" size={17}/>ตั้งค่าการแจ้งเตือน <Icon name="arrow" size={15}/></button></footer></section>;
}

export default function Page() {
  const confirm = useConfirmation();
  const [hydrated, setHydrated] = useState(false);
  const [session, setSession] = useState(null);
  const [publicMode, setPublicMode] = useState('landing');
  const [view, setView] = useState('today');
  const [households, setHouseholds] = useState([]);
  const [currentId, setCurrentId] = useState('');
  const [household, setHousehold] = useState(null);
  const [members, setMembers] = useState([]);
  const [pets, setPets] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [petFocus, setPetFocus] = useState(null);
  const [calendarFocus, setCalendarFocus] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [busyId, setBusyId] = useState('');
  const [modal, setModal] = useState('');
  const [quickAddContext, setQuickAddContext] = useState({});
  const [aiChatRequest, setAiChatRequest] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [undoActivity, setUndoActivity] = useState(null);
  const [undoBusy, setUndoBusy] = useState(false);
  const workspaceRequestRef = useRef(0);
  const notificationWrapRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const headers = useMemo(() => session?.token ? { Authorization: `Bearer ${session.token}` } : {}, [session]);
  const appApi = useCallback((path, options = {}) => api(path, { ...options, headers: { ...headers, ...(options.headers || {}) } }), [headers]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!showNotifications) return undefined;
    const closeOutside = event => {
      if (!document.querySelector('.confirmation-backdrop') && !notificationWrapRef.current?.contains(event.target)) setShowNotifications(false);
    };
    const closeEscape = event => {
      if (event.key === 'Escape' && !document.querySelector('.confirmation-backdrop')) {
        setShowNotifications(false);
        notificationButtonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeEscape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', closeEscape); };
  }, [showNotifications]);

  useEffect(() => {
    try { const saved = window.localStorage.getItem('pawroutine_session'); if (saved) setSession(JSON.parse(saved)); } catch { window.localStorage.removeItem('pawroutine_session'); }
    const initial = window.location.hash.slice(1); if (NAV.some(item => item.id === initial) || initial === 'more') setView(initial);
    function onHashChange() { const next = window.location.hash.slice(1); if (NAV.some(item => item.id === next) || next === 'more') setView(next); }
    window.addEventListener('hashchange', onHashChange); setHydrated(true);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const loadHouseholds = useCallback(async (preferredId) => {
    const result = await api('/households', { headers });
    const list = result.households || [];
    setHouseholds(list);
    const storedId = window.localStorage.getItem('pawroutine_household');
    const selected = list.find(item => item.id === preferredId) || list.find(item => item.id === currentId) || list.find(item => item.id === storedId) || list[0];
    setCurrentId(selected?.id || '');
    return selected;
  }, [headers, currentId]);

  const loadWorkspace = useCallback(async () => {
    if (!currentId || !session) return;
    const requestId = ++workspaceRequestRef.current;
    setLoading(true); setError('');
    try {
      const [houseData, memberData, petData, taskData, historyData, notificationData] = await Promise.all([
        api(`/households/${currentId}`, { headers }), api(`/households/${currentId}/members`, { headers }), api(`/households/${currentId}/pets`, { headers }), api(`/households/${currentId}/tasks/today`, { headers }), api(`/households/${currentId}/history`, { headers }), api(`/households/${currentId}/notifications`, { headers }),
      ]);
      const petList = petData.pets || [];
      const routineResults = await Promise.all(petList.map(pet => api(`/pets/${pet.id}/routines`, { headers })));
      if (requestId !== workspaceRequestRef.current) return;
      setHousehold(houseData.household); setMembers(memberData.members || []); setPets(petList); setTasks(taskData.tasks || []); setHistory(historyData.history || []); setNotifications(notificationData.notifications || []);
      setLastSynced(new Date());
      setRoutines(routineResults.flatMap(result => result.routines || []));
    } catch (err) { if (requestId === workspaceRequestRef.current) setError(err.message); }
    finally { if (requestId === workspaceRequestRef.current) setLoading(false); }
  }, [currentId, headers, session]);

  useEffect(() => { if (!session) return; loadHouseholds().catch(err => setError(err.message)); }, [session]);
  useEffect(() => { loadWorkspace(); }, [loadWorkspace]);

  useEffect(() => {
    if (!session || !currentId) return;
    const refresh = () => { if (document.visibilityState === 'visible' && !busyId && !modal) loadWorkspace(); };
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', refresh);
    const timer=window.setInterval(refresh,60000);
    return () => { window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);window.clearInterval(timer); };
  }, [session,currentId,loadWorkspace,busyId,modal]);
  function login(data) { window.localStorage.setItem('pawroutine_session', JSON.stringify(data)); setSession(data); }
  function logout() { workspaceRequestRef.current += 1; window.localStorage.removeItem('pawroutine_session'); window.localStorage.removeItem('pawroutine_household'); setSession(null); setHouseholds([]); setCurrentId(''); setHousehold(null); setNotifications([]); setView('today'); setPublicMode('landing'); window.location.hash = ''; }
  function navigate(next) { setError(''); setNotice(''); if (next !== 'pets') setPetFocus(null); if (next !== 'calendar') setCalendarFocus(''); setView(next); window.location.hash = next; document.getElementById('main-content')?.focus(); }
  function openNotification(item) {
    setShowNotifications(false);
    if (item.type === 'task') {
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      const scheduledDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(item.scheduled_at));
      if (scheduledDate === today) navigate('today');
      else { setCalendarFocus(scheduledDate); navigate('calendar'); }
      return;
    }
    setPetFocus({ petId: item.pet_id, tab: 'health', healthTab: item.type === 'health_due' ? 'profile' : 'summary' });
    navigate('pets');
  }
  function selectHousehold(id) { workspaceRequestRef.current += 1; setCurrentId(id); window.localStorage.setItem('pawroutine_household', id); setHousehold(null); setPets([]); setTasks([]); setHistory([]); setNotifications([]); setRoutines([]); navigate('today'); }
  async function saved(kind, result) {
    setModal(''); setNotice(kind === 'household' ? 'สร้างบ้านเรียบร้อย' : kind === 'join' ? 'เข้าร่วมบ้านเรียบร้อย' : kind === 'pet' ? 'เพิ่มสัตว์เลี้ยงเรียบร้อย' : kind === 'routine' ? 'เพิ่มกิจวัตรเรียบร้อย' : 'บันทึกการแก้ไขแล้ว');
    if (kind === 'household' || kind === 'join') { const selected = await loadHouseholds(result.household?.id); if (selected) window.localStorage.setItem('pawroutine_household', selected.id); }
    else await loadWorkspace();
    if (kind === 'pet' && result.pet?.id) { setPetFocus({ petId: result.pet.id, tab: 'overview' }); navigate('pets'); setNotice('เพิ่มสัตว์เลี้ยงเรียบร้อย'); }
  }
  async function updateTask(id, action, notes = '') {
    setBusyId(id); setError('');
    try { await api(`/tasks/${id}/${action}`, { method: 'POST', headers, body: JSON.stringify({ notes }) }); setNotice(action === 'complete' ? 'บันทึกว่างานเสร็จแล้ว' : 'ข้ามงานนี้แล้ว'); await loadWorkspace(); }
    catch (err) { setError(err.message); await loadWorkspace(); }
    finally { setBusyId(''); setModal(''); }
  }
  async function mutateCurrentTask(task, action, payload = {}) {
    const titles = { complete: 'บันทึกว่างานเสร็จแล้ว?', skip: 'ข้ามงานนี้?', reschedule: 'เลื่อนเวลางาน?', reassign: 'เปลี่ยนผู้รับผิดชอบ?', reopen: 'แก้ไขการกดผิด?' };
    const detail = action === 'reschedule' ? `เวลาใหม่: ${new Date(payload.scheduled_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}` : action === 'reassign' ? `ผู้รับผิดชอบ: ${members.find(member => member.id === payload.assigned_user_id)?.name || 'ทุกคนในบ้าน'}` : action === 'skip' ? `เหตุผล: ${payload.skip_reason}` : action === 'reopen' ? `งานจะกลับเป็นรอดำเนินการ · ${payload.reason || ''}` : payload.notes || 'สมาชิกในบ้านจะเห็นว่างานนี้ทำเสร็จแล้ว';
    if (!await confirm({ title: titles[action] || 'ยืนยันการเปลี่ยนแปลง?', description: `“${task.title}” · ${detail}`, confirmLabel: action === 'skip' ? 'ยืนยันข้ามงาน' : 'ยืนยัน', danger: action === 'skip' })) return;
    setBusyId(task.id); setError('');
    const mutationHeaders = { ...headers, 'idempotency-key': crypto.randomUUID() };
    const method = ['complete', 'skip'].includes(action) ? 'POST' : 'PATCH';
    const path = method === 'POST' ? `/tasks/${task.id}/${action}` : `/tasks/${task.id}`;
    try {
      const result = await api(path, { method, headers: mutationHeaders, body: JSON.stringify({ ...payload, action, expected_version: task.mutation_version }) });
      setUndoActivity(result.activity || null);
      setNotice(action === 'complete' ? 'บันทึกว่างานเสร็จแล้ว' : action === 'skip' ? 'ข้ามงานแล้ว' : 'อัปเดตงานแล้ว');
      await loadWorkspace();
    } catch (err) { setError(err.message); await loadWorkspace(); }
    finally { setBusyId(''); }
  }
  async function completeHealthFollowUp(task) {
    if (!await confirm({ title: 'บันทึกว่าติดตามแล้ว?', description: `ยืนยันว่าติดตาม “${task.title}” เรียบร้อยแล้ว`, confirmLabel: 'ยืนยันติดตามแล้ว' })) return;
    setBusyId(task.id); setError('');
    try {
      await appApi(`/wellness-alerts/${task.id}/follow-up/complete`, { method: 'POST', body: '{}' });
      setNotice('บันทึกว่าติดตามสุขภาวะแล้ว');
      await loadWorkspace();
    } catch (err) { setError(err.message); await loadWorkspace(); }
    finally { setBusyId(''); }
  }
  async function changeScheduledHealth(task, action, skipReason = '') {
    const title = action === 'complete' ? 'บันทึกว่ารายการนี้เสร็จแล้ว?' : action === 'skip' ? 'ข้ามรายการนี้?' : 'แก้ไขการกดผิด?';
    const description = action === 'skip' ? `“${task.title}” · เหตุผล: ${skipReason}`
      : action === 'reopen' ? `“${task.title}” จะกลับเป็นรายการที่รอดูแล` : `ยืนยันว่า “${task.title}” เรียบร้อยแล้ว`;
    if (!await confirm({ title, description, confirmLabel: action === 'skip' ? 'ยืนยันข้าม' : 'ยืนยัน', danger: action === 'skip' })) return;
    setBusyId(task.id); setError('');
    try {
      await api(`/scheduled-health/${task.source_type}/${task.id}/${action}`, {
        method: 'POST', headers, body: JSON.stringify({ skip_reason: skipReason }),
      });
      setNotice(action === 'complete' ? 'บันทึกว่าเสร็จแล้ว' : action === 'skip' ? 'ข้ามรายการแล้ว' : 'เปิดรายการอีกครั้งแล้ว');
      await loadWorkspace();
    } catch (err) { setError(err.message); await loadWorkspace(); }
    finally { setBusyId(''); }
  }
  async function undoLastTaskChange() {
    if (!undoActivity) return;
    if (!await confirm({ title: 'ย้อนกลับการเปลี่ยนแปลง?', description: 'งานจะกลับไปเป็นสถานะก่อนการเปลี่ยนแปลงครั้งล่าสุด', confirmLabel: 'ยืนยันย้อนกลับ' })) return;
    setUndoBusy(true); setError('');
    try { await api(`/activity/${undoActivity.id}/undo`, { method: 'POST', headers, body: '{}' }); setUndoActivity(null); setNotice('ย้อนกลับการเปลี่ยนแปลงแล้ว'); await loadWorkspace(); }
    catch (err) { setError(err.message); setUndoActivity(null); await loadWorkspace(); }
    finally { setUndoBusy(false); }
  }
  async function manage(path, method, body, success) {
    setError(''); setBusyId(path);
    try { await api(path, { method, headers, body: JSON.stringify(body || {}) }); setNotice(success); setModal(''); await loadWorkspace(); }
    catch (err) { setError(err.message); }
    finally { setBusyId(''); }
  }
  async function copyInvite() { try { await navigator.clipboard.writeText(household.invite_code); setNotice('คัดลอกรหัสเชิญแล้ว'); } catch { setError('คัดลอกไม่สำเร็จ กรุณาเลือกรหัสแล้วคัดลอกเอง'); } }
  async function dismissNotification(item) {
    const key = item.notification_key;
    if (!key || !currentId) return;
    if (!await confirm({ title: 'ลบการแจ้งเตือนนี้?', description: 'รายการนี้จะหายไปจากบัญชีของคุณ โดยงานหรือข้อมูลสุขภาพต้นทางยังอยู่', confirmLabel: 'ลบการแจ้งเตือน', danger: true })) return;
    setBusyId(`notification:${key}`); setError('');
    try {
      await api(`/households/${currentId}/notifications/dismiss`, { method: 'POST', headers, body: JSON.stringify({ notification_key: key }) });
      setNotifications(current => current.filter(notification => notification.notification_key !== key));
      setNotice('ลบแจ้งเตือนแล้ว');
    } catch (err) { setError(err.message); }
    finally { setBusyId(''); }
  }
  async function dismissAllNotifications() {
    const keys = [...new Set(notifications.map(item => item.notification_key).filter(Boolean))];
    if (!keys.length || !currentId) return;
    if (!await confirm({ title: `ลบการแจ้งเตือน ${keys.length} รายการ?`, description: 'รายการที่เห็นอยู่จะหายไปจากบัญชีของคุณ งานและข้อมูลสุขภาพยังอยู่ และการแจ้งเตือนใหม่จะปรากฏได้ตามปกติ', confirmLabel: 'ลบทั้งหมด', danger: true })) return;
    setBusyId('notifications:all'); setError('');
    try {
      await api(`/households/${currentId}/notifications/dismiss-all`, { method: 'POST', headers, body: JSON.stringify({ notification_keys: keys }) });
      const removed = new Set(keys);
      setNotifications(current => current.filter(item => !removed.has(item.notification_key)));
      setNotice(`ลบการแจ้งเตือน ${keys.length} รายการแล้ว`);
    } catch (err) { setError(err.message); }
    finally { setBusyId(''); }
  }
  async function trashCurrentHousehold() {
    if (!household) return;
    setBusyId(`trash:${household.id}`); setError('');
    try {
      await api(`/households/${household.id}/archive`, { method: 'POST', headers, body: '{}' });
      const remaining = households.filter(item => item.id !== household.id);
      const selected = remaining[0] || null;
      setModal(''); setHousehold(null); setNotice('ลบบ้านแล้ว');
      setHouseholds(remaining);
      setCurrentId(selected?.id || '');
      if (selected) window.localStorage.setItem('pawroutine_household', selected.id);
      else window.localStorage.removeItem('pawroutine_household');
      navigate(selected ? 'today' : 'household');
      try { await loadHouseholds(selected?.id); }
      catch { setNotice('ลบบ้านแล้ว แต่โหลดรายการล่าสุดไม่สำเร็จ กรุณาลองรีเฟรชหน้า'); }
    } catch (err) { setError(err.message); }
    finally { setBusyId(''); }
  }
  async function settingsUpdated(nextSession) { if (nextSession) setSession(nextSession); await loadHouseholds(); await loadWorkspace(); }

  if (!hydrated) return <div className="initial-loading" aria-label="กำลังเปิด PetRoutine"><Brand /></div>;
  if (!session) return publicMode === 'auth' ? <AuthScreen onLogin={login} onBack={() => setPublicMode('landing')} api={api} /> : <LandingPage onStart={() => setPublicMode('auth')} />;

  const activeLabel = NAV.find(item => item.id === view)?.label || (view === 'more' ? 'เพิ่มเติม' : 'วันนี้');
  const todayDate = new Date().toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const isOwner = household?.role === 'owner';
  const modalItem = modal.startsWith('editPet:') || modal.startsWith('archivePet:') ? pets.find(item => item.id === modal.split(':')[1]) : modal.startsWith('editRoutine:') || modal.startsWith('archiveRoutine:') ? routines.find(item => item.id === modal.split(':')[1]) : null;
  const newRoutineTemplate = modal.startsWith('routineForm:') ? getRoutineTemplate(modal.split(':')[1]) : null;
  const addingAppointment = newRoutineTemplate?.scheduleType === 'once' || modal.endsWith(':once');
  const aiCare = { api: appApi, householdId: currentId,
    onOpenAlert: petId => { setPetFocus({ petId, tab: 'health', healthTab: 'checkins' }); navigate('pets'); },
    onOpenSource: (petId, source) => { setPetFocus({ petId, tab: source.type === 'pet_profile' ? 'overview' : ['passport', 'wellness', 'wellness_alert', 'health_record'].includes(source.type) ? 'health' : source.type === 'routine' ? 'routines' : 'timeline', healthTab: source.type === 'passport' ? 'profile' : ['wellness', 'wellness_alert'].includes(source.type) ? 'checkins' : 'events', source }); navigate('pets'); },
    onOpenSettings: () => navigate('settings'),
    onOpenQuickAdd: () => { setQuickAddContext({ mode: 'ai' }); setModal('quickAdd'); },
    onOpenChat: () => setAiChatRequest(count => count + 1),
  };
  const content = view === 'today' ? <ProductTodayView lastSynced={lastSynced} onRefresh={loadWorkspace} onReopen={(task, reason) => mutateCurrentTask(task, 'reopen', { reason })} tasks={tasks} pets={pets} members={members} currentUserId={session.user?.id} busyId={busyId} loading={loading} onComplete={(task, notes) => mutateCurrentTask(task, 'complete', { notes })} onCompleteFollowUp={completeHealthFollowUp} onCompleteHealth={task => changeScheduledHealth(task, 'complete')} onSkipHealth={(task, reason) => changeScheduledHealth(task, 'skip', reason)} onReopenHealth={task => changeScheduledHealth(task, 'reopen')} onSkip={(task, skipReason, notes) => mutateCurrentTask(task, 'skip', { skip_reason: skipReason, notes })} onReschedule={(task, scheduledAt) => mutateCurrentTask(task, 'reschedule', { scheduled_at: scheduledAt })} onReassign={(task, assignedUserId) => mutateCurrentTask(task, 'reassign', { assigned_user_id: assignedUserId })} onAdd={() => setModal('quickAdd')} aiCare={aiCare} />
    : view === 'calendar' ? <CalendarView apiClient={appApi} members={members} pets={pets} onOpenPet={event => { setPetFocus({petId:event.pet_id,tab:event.source_type === 'task' || event.routine_id ? 'routines' : 'health'});navigate('pets'); }} key={calendarFocus || 'default'} currentId={currentId} headers={headers} initialDate={calendarFocus || undefined} onToday={() => navigate('today')} />
    : view === 'pets' ? <PetWorkspace busy={Boolean(busyId)} onEditRoutine={routine => setModal(`editRoutine:${routine.id}`)} onToggleRoutine={routine => manage(`/routines/${routine.id}`, 'PATCH', { active: !routine.active })} onArchiveRoutine={routine => setModal(`archiveRoutine:${routine.id}`)} onUpdated={loadWorkspace} key={`${petFocus?.petId || pets[0]?.id || 'empty'}:${petFocus?.tab || 'overview'}:${petFocus?.healthTab || 'summary'}:${petFocus?.source?.id || ''}`} pet={pets[0]} pets={pets} initialPetId={petFocus?.petId} initialTab={petFocus?.tab} initialHealthTab={petFocus?.healthTab} initialSource={petFocus?.source} onAdd={() => setModal('pet')} onAddHealthEvent={pet => { setQuickAddContext({ petId: pet.id, mode: 'health' }); setModal('quickAdd'); }} routines={routines} members={members} api={appApi} isOwner={isOwner} onEdit={pet => setModal(`editPet:${pet.id}`)} onArchive={pet => setModal(`archivePet:${pet.id}`)} onOpenRoutine={pet => { setQuickAddContext({ petId: pet.id }); setModal('routineForm:custom'); }} />
    : view === 'routines' ? <RoutinesView busy={Boolean(busyId)} pets={pets} routines={routines} members={members} isOwner={isOwner} onAdd={() => setModal('routineForm:custom')} onAddPet={() => setModal('pet')} onEdit={routine => setModal(`editRoutine:${routine.id}`)} onToggle={routine => manage(`/routines/${routine.id}`, 'PATCH', { active: !routine.active }, routine.active ? 'ปิดกิจวัตรชั่วคราวแล้ว' : 'เปิดกิจวัตรแล้ว')} onArchive={routine => setModal(`archiveRoutine:${routine.id}`)} />
    : view === 'history' ? <HistoryView history={history} pets={pets} currentId={currentId} headers={headers} />
    : view === 'settings' ? <SettingsView apiClient={appApi} refreshWorkspace={async () => { await loadHouseholds(); await loadWorkspace(); }} session={session} household={household} headers={headers} onUpdated={settingsUpdated} />
    : view === 'more' ? <MoreView onNavigate={navigate} onLogout={logout} />
    : <HouseholdView household={household} members={members} apiClient={appApi} onUpdated={async () => { await loadHouseholds(); await loadWorkspace(); }} onCreate={() => setModal('household')} onJoin={() => setModal('join')} onCopy={copyInvite} onTrash={item => setModal(`trashHouse:${item.id}`)} />;
  return <div className={`app-shell brand-workspace view-${view}`}><a className="skip-link" href="#main-content">ข้ามไปเนื้อหาหลัก</a><aside className="sidebar"><Brand /><div className="sidebar-label">พื้นที่ของเรา</div><div className="household-picker"><label htmlFor="household-select">บ้านที่กำลังดูแล</label><div className="select-wrap"><SelectField id="household-select" value={currentId} onChange={event => selectHousehold(event.target.value)} disabled={!households.length}>{households.length ? households.map(item => <option key={item.id} value={item.id}>{item.name}</option>) : <option value="">ยังไม่มีบ้าน</option>}</SelectField></div></div>{currentId && <button className="button primary sidebar-add" onClick={() => setModal('quickAdd')}><Icon name="plus" size={18} />เพิ่มรายการ</button>}<div className="sidebar-label nav-label">เมนูหลัก</div><nav className="side-nav" aria-label="เมนูหลัก">{NAV.map(item => <button key={item.id} className={view === item.id ? 'nav-item active' : 'nav-item'} aria-current={view === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}><Icon name={item.icon} size={20} /><span>{item.label}</span>{item.id === 'today' && tasks.filter(task => ['pending', 'overdue'].includes(task.display_status)).length > 0 && <span className="nav-count">{tasks.filter(task => ['pending', 'overdue'].includes(task.display_status)).length}</span>}</button>)}</nav><div className="sidebar-bottom"><div className="sidebar-tip"><Icon name="sparkle" size={18} /><p>ดูแลกันทุกวัน<br /><strong>ไปด้วยกัน</strong></p></div><button className="nav-item logout" onClick={logout}><Icon name="logout" size={20} /><span>ออกจากระบบ</span></button></div></aside>
    <main id="main-content" className="main-content" tabIndex="-1"><header className="topbar"><div><p className="eyebrow">{todayDate}</p><h1>{activeLabel}</h1></div><div className="topbar-right"><span className="header-house">{household?.name || 'PetRoutine'}</span><ThemeToggle/><div className="notification-wrap" ref={notificationWrapRef}><button ref={notificationButtonRef} type="button" className="icon-button notification-button" onClick={() => setShowNotifications(!showNotifications)} aria-label={`การแจ้งเตือน ${notifications.length} รายการ`} aria-expanded={showNotifications}><Icon name="bell" size={20} />{notifications.length > 0 && <span className="notification-count">{notifications.length}</span>}</button>{showNotifications && <NotificationPanel notifications={notifications} busyId={busyId} onDelete={dismissNotification} onDeleteAll={dismissAllNotifications} onOpen={openNotification} onClose={() => setShowNotifications(false)} onSettings={() => { setShowNotifications(false); navigate('settings'); }} />}</div><span className="user-avatar" title={session.user?.name}>{session.user?.name?.slice(0, 1) || 'U'}</span><button className="mobile-logout" onClick={logout} aria-label="ออกจากระบบ"><Icon name="logout" size={18} /></button></div></header>{error && <div className="alert error-alert" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="ปิดข้อความแจ้งเตือน"><Icon name="close" size={18} /></button></div>}{notice && <div className="alert notice-alert" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="ปิดข้อความแจ้งเตือน"><Icon name="close" size={18} /></button></div>}
    {!currentId && view !== 'household' ? <section className="onboarding"><span className="onboarding-icon"><Icon name="paw" size={42} /></span><span className="section-kicker">เริ่มกันเลย</span><h2>เริ่มต้นที่บ้านของเรา</h2><p>สร้างพื้นที่สำหรับดูแลสัตว์เลี้ยงร่วมกัน หรือเข้าร่วมบ้านที่มีคนชวนไว้แล้ว</p><div><button className="button primary" onClick={() => setModal('household')}><Icon name="plus" size={18} />สร้างบ้านใหม่</button><button className="button secondary" onClick={() => setModal('join')}>มีรหัสเชิญ? เข้าร่วมบ้าน</button></div></section> : loading && !household && view !== 'household' ? <div className="loading-panel skeleton-stack" role="status" aria-busy="true" aria-label="กำลังโหลดข้อมูลของบ้าน">{[0,1,2].map(item => <div className="skeleton-activity" key={item}><i /><span><i /><i /></span></div>)}</div> : <div className="page-grid"><div className="page-main">{content}</div></div>}
    </main><nav className="bottom-nav" aria-label="เมนูบนมือถือ">{MOBILE_NAV.map(item => <button key={item.id} className={view === item.id || (item.id === 'more' && ['routines', 'history', 'household', 'settings'].includes(view)) ? 'bottom-item active' : 'bottom-item'} aria-current={view === item.id ? 'page' : undefined} onClick={() => item.id === 'add' ? setModal('quickAdd') : navigate(item.id)}><Icon name={item.icon} size={21} /><span>{item.label}</span></button>)}</nav>
    {(['household', 'join', 'pet'].includes(modal) || modal.startsWith('editPet:')) && <WorkspaceForm key={modal} kind={modal.split(':')[0]} pets={pets} members={members} item={modalItem} currentId={currentId} headers={headers} onClose={() => setModal('')} onSaved={result => saved(modal.split(':')[0], result)} />}
    {modal === 'quickAdd' && <QuickAddSheet pets={pets} initialPetId={quickAddContext.petId} initialMode={quickAddContext.mode || 'choices'} api={appApi} onClose={() => { setModal(''); setQuickAddContext({}); }} onSaved={loadWorkspace} onSelect={(choice, template) => setModal(choice === 'appointment' ? 'routineForm:once' : choice === 'template' ? `routineForm:${template.id}` : 'routineForm:custom')} />}
    {modal.startsWith('routineForm:') && <Modal title={addingAppointment ? 'เพิ่มงานครั้งเดียว' : 'เพิ่มกิจวัตร'} description={addingAppointment ? 'เลือกสัตว์เลี้ยง งาน วันที่ และเวลา รายละเอียดเพิ่มเติมมีให้เลือกด้านล่าง'  : 'กรอกข้อมูลที่จำเป็นก่อน และเปิดตัวเลือกเพิ่มเติมได้เมื่อต้องการ'} onClose={() => setModal('')}><RoutineForm pets={pets} members={members} initial={(() => { const now = bangkokInput(); if (!newRoutineTemplate) return addingAppointment ? { pet_id: quickAddContext.petId, type: 'once', date: now.slice(0, 10), times: [now.slice(11, 16)] } : { pet_id: quickAddContext.petId }; return { title: newRoutineTemplate.title, activity_type: newRoutineTemplate.activity_type, times: addingAppointment ? [now.slice(11, 16)] : newRoutineTemplate.times, type: newRoutineTemplate.scheduleType || 'weekly', ...(addingAppointment ? { date: now.slice(0, 10) } : {}) }; })()} onCancel={() => setModal('')} onSubmit={async input => { const result = await appApi(`/pets/${input.pet_id}/routines`, { method: 'POST', body: JSON.stringify(input) }); await saved('routine', result); }} /></Modal>}
    {modal.startsWith('editRoutine:') && modalItem && <Modal title="แก้ไขกิจวัตร" description="ฟิลด์ที่จำเป็นจะแสดงทันที ส่วนการมอบหมายและช่วงพักอยู่ในตัวเลือกเพิ่มเติม" onClose={() => setModal('')}><RoutineForm key={modalItem.id} pets={pets} members={members} initial={(() => { const schedule = modalItem.schedule_value || {}; const pause = schedule.pauses?.[0] || {}; return { id: modalItem.id, pet_id: modalItem.pet_id, title: modalItem.title, activity_type: modalItem.activity_type, type: schedule.type || 'weekly', times: schedule.times || [schedule.time || bangkokInput().slice(11, 16)], days: schedule.days || [0, 1, 2, 3, 4, 5, 6], date: schedule.date || bangkokInput().slice(0, 10), interval_days: schedule.interval_days || 2, start_date: schedule.start_date || bangkokInput().slice(0, 10), end_date: schedule.end_date || '', pause_from: pause.from || '', pause_to: pause.to || '', assigned_user_id: modalItem.assigned_user_id || '', instructions: modalItem.instructions || '' }; })()} onCancel={() => setModal('')} onSubmit={async input => { const { pet_id: ignoredPetId, ...body } = input; const result = await appApi(`/routines/${modalItem.id}`, { method: 'PATCH', body: JSON.stringify(body) }); await saved('editRoutine', result); }} /></Modal>}
    {(modal.startsWith('skip:') || modal.startsWith('complete:')) && <TaskNoteModal action={modal.split(':')[0]} onClose={() => setModal('')} onConfirm={notes => updateTask(modal.split(':')[1], modal.split(':')[0], notes)} busy={Boolean(busyId)} />}
    {(modal.startsWith('archivePet:') || modal.startsWith('archiveRoutine:')) && <Modal title="ลบรายการ" description={`ลบ ${modalItem?.name || modalItem?.title || 'รายการนี้'} ออกจากรายการที่ใช้งาน โดยประวัติการดูแลยังคงอยู่`} onClose={() => setModal('')}><div className="form-actions"><button className="button ghost" onClick={() => setModal('')}>ยกเลิก</button><button className="button danger" disabled={Boolean(busyId)} onClick={() => manage(modal.startsWith('archivePet:') ? `/pets/${modalItem.id}/archive` : `/routines/${modalItem.id}/archive`, 'POST', {}, 'ลบรายการแล้ว')}>{busyId ? 'กำลังบันทึก…' : 'ยืนยันลบ'}</button></div></Modal>}
    {modal.startsWith('trashHouse:') && household?.id === modal.split(':')[1] && <TrashHouseholdModal household={household} busy={busyId === `trash:${household.id}`} onClose={() => setModal('')} onConfirm={trashCurrentHousehold} />}
    {currentId && <AiChatWidget key={currentId} householdId={currentId} pets={pets} api={appApi} openRequest={aiChatRequest} onOpenSource={(petId, source) => { setPetFocus({ petId, tab: source.type === 'pet_profile' ? 'overview' : source.type === 'passport' ? 'health' : source.type === 'routine' ? 'routines' : 'timeline', healthTab: source.type === 'passport' ? 'profile' : 'summary', source }); navigate('pets'); }} />}
    <UndoBar activity={undoActivity} onUndo={undoLastTaskChange} onDismiss={() => setUndoActivity(null)} busy={undoBusy} />
  </div>;
}

function TaskNoteModal({ action, onClose, onConfirm, busy }) {
  const [notes, setNotes] = useState('');
  const skipping = action === 'skip';
  return <Modal title={skipping ? 'ข้ามงานนี้' : 'บันทึกว่างานเสร็จแล้ว'} description="เพิ่มหมายเหตุให้คนในบ้านเข้าใจได้ (ไม่บังคับ)" onClose={onClose}><form className="form-stack" onSubmit={event => { event.preventDefault(); onConfirm(notes); }}><label>หมายเหตุ<textarea rows="3" maxLength={1000} value={notes} onChange={event => setNotes(event.target.value)} placeholder={skipping ? 'เช่น วันนี้ไม่สะดวกพาเดินเล่น' : 'เช่น กินอาหารหมดแล้ว'} /></label><div className="form-actions"><button type="button" className="button ghost" onClick={onClose}>ยกเลิก</button><button className={`button ${skipping ? 'danger' : 'primary'}`} disabled={busy}>{busy ? 'กำลังบันทึก…' : skipping ? 'ยืนยันข้ามงาน' : 'ยืนยันเสร็จแล้ว'}</button></div></form></Modal>;
}
