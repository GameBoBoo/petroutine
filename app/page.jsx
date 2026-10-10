"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { formatBangkokTime } from '../lib/calendar.js';
import ProductTodayView from '../features/today/TodayView.jsx';
import UndoBar from '../components/UndoBar.jsx';
import QuickAddSheet from '../features/quick-add/QuickAddSheet.jsx';
import RoutineForm from '../features/routines/RoutineForm.jsx';
import { getRoutineTemplate } from '../features/routines/templates.js';
import PetWorkspace from '../features/pets/PetWorkspace.jsx';
import ActivityView from '../features/activity/ActivityView.jsx';

const API = '/api/v1';
const NAV = [
  { id: 'today', label: 'วันนี้', icon: 'home' },
  { id: 'calendar', label: 'ปฏิทิน', icon: 'calendar' },
  { id: 'pets', label: 'สัตว์เลี้ยง', icon: 'paw' },
  { id: 'routines', label: 'กิจวัตร', icon: 'clock' },
  { id: 'history', label: 'ประวัติ', icon: 'history' },
  { id: 'activity', label: 'ประวัติการเปลี่ยนแปลง', icon: 'history' },
  { id: 'household', label: 'บ้านของเรา', icon: 'users' },
  { id: 'settings', label: 'ตั้งค่า', icon: 'settings' },
];
const MOBILE_NAV = [NAV[0], NAV[1], { id: 'add', label: 'เพิ่ม', icon: 'plus' }, NAV[2], { id: 'more', label: 'เพิ่มเติม', icon: 'more' }];
const ACTIVITIES = { feeding: 'ให้อาหาร', water: 'เติมน้ำ', walk: 'พาเดินเล่น', grooming: 'ดูแลขน', medication: 'บันทึกยา', vet: 'พบสัตวแพทย์', bathing: 'อาบน้ำ', supplies: 'ซื้อของ', observation: 'ข้อสังเกต', other: 'อื่น ๆ' };
const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
const STATUS = { pending: 'รอดำเนินการ', overdue: 'เลยเวลา', completed: 'เสร็จแล้ว', skipped: 'ข้ามแล้ว' };

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error?.message || 'เชื่อมต่อไม่สำเร็จ กรุณาลองอีกครั้ง');
    error.status = response.status;
    throw error;
  }
  return data;
}

function Icon({ name, size = 20 }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7v10H3V10Z" /><path d="M9 20v-7h6v7" /></>,
    paw: <><path d="M8 11c-1.4 0-2.5-1.1-2.5-2.5S6.6 6 8 6s2.5 1.1 2.5 2.5S9.4 11 8 11ZM16 11c-1.4 0-2.5-1.1-2.5-2.5S14.6 6 16 6s2.5 1.1 2.5 2.5S17.4 11 16 11Z" /><path d="M12 12c-3.2 0-5.5 2.2-5.5 4.4 0 1.2.8 2.1 2 2.1 1.2 0 2.1-.9 3.5-1.4 1.4.5 2.3 1.4 3.5 1.4 1.2 0 2-.9 2-2.1C17.5 14.2 15.2 12 12 12Z" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18M8 14h3M8 17h7" /></>,
    history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l4 2" /></>,
    users: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-2a6 6 0 0 1 12 0v2H3ZM17 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    down: <path d="m6 9 6 6 6-6" />,
    close: <path d="M5 5l14 14M19 5 5 19" />,
    logout: <><path d="M10 17l5-5-5-5M15 12H3M21 4v16" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    sparkle: <><path d="m12 2 1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2ZM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    skip: <><path d="m5 5 14 14M19 5 5 19" /></>,
    dog: <><path d="M7 8 4 5 3 10l3 2v4a6 6 0 0 0 12 0v-4l3-2-1-5-3 3M7 8c3-2 7-2 10 0" /><path d="M9 14h.01M15 14h.01M10 17c1.3 1.2 2.7 1.2 4 0" /></>,
    cat: <><path d="M5 11 4 4l5 3c2-.7 4-.7 6 0l5-3-1 7v5a7 7 0 0 1-14 0v-5Z" /><path d="M9 14h.01M15 14h.01m-4 3 1 1 1-1M3 16l4 1m14-1-4 1" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.86 2.86-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.57V21H10v-.03A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.86-2.86.06-.06A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3 14h-.03v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.34-1.88L4.2 7.06 7.06 4.2l.06.06A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3.03V3h4v.03A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.86 2.86-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.57 1H21v4h-.03a1.7 1.7 0 0 0-1.57 1Z" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
    more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name] || paths.paw}</svg>;
}

function Brand({ light = false }) {
  return <div className={`brand ${light ? 'brand-light' : ''}`}><img src="/assets/brand/logo-horizontal.svg" alt="PawRoutine" /></div>;
}

function LandingPage({ onStart }) {
  return <div className="landing"><a className="skip-link" href="#landing-main">ข้ามไปเนื้อหาหลัก</a><header className="landing-header"><Brand /><nav aria-label="เมนูเว็บไซต์"><a href="#features">ฟีเจอร์</a><a href="#faq">คำถามที่พบบ่อย</a><button className="button primary" onClick={onStart}>เริ่มต้นใช้งาน</button></nav></header><main id="landing-main"><section className="landing-hero"><div className="landing-copy"><span className="section-kicker">PET CARE, TOGETHER</span><h1>ดูแลสัตว์เลี้ยงไปด้วยกัน <em>ในทุกวัน</em></h1><p>จัดตารางให้อาหาร พาเดินเล่น นัดสัตวแพทย์ และบันทึกว่าใครดูแลแล้ว ให้ทุกคนในบ้านเห็นข้อมูลเดียวกัน</p><button className="button primary" onClick={onStart}>เริ่มต้นใช้งาน <Icon name="arrow" size={18} /></button><small>สำหรับสุนัขและแมว · เริ่มใช้ได้โดยไม่ต้องมีข้อมูลตัวอย่าง</small></div><div className="landing-visual"><img src="/assets/illustrations/hero-family.png" alt="" /></div></section><section id="features" className="landing-features"><div className="landing-section-heading"><span className="section-kicker">HOW WE CARE</span><h2>เรื่องเล็ก ๆ ที่ช่วยให้ดูแลกันง่ายขึ้น</h2></div><div className="landing-feature-grid"><article><img src="/assets/illustrations/shared-tasks.png" alt="" loading="lazy" /><h3>รู้ว่าวันนี้ต้องทำอะไร</h3><p>ดูงานของสุนัขและแมว เรียงตามเวลา พร้อมสถานะที่อัปเดตจริง</p></article><article><img src="/assets/illustrations/reminders.png" alt="" loading="lazy" /><h3>ไม่พลาดวันที่สำคัญ</h3><p>ดูปฏิทินกิจวัตรและนัดหมายครั้งเดียว พร้อมการเตือนภายในเว็บ</p></article><article><img src="/assets/illustrations/family-sync.png" alt="" loading="lazy" /><h3>ทุกคนในบ้านรู้พร้อมกัน</h3><p>สมาชิกเห็นประวัติ ผู้รับผิดชอบ และบันทึกการดูแลชุดเดียวกัน</p></article></div></section><section id="faq" className="landing-faq"><h2>คำถามที่พบบ่อย</h2><details><summary>ใช้กับสัตว์เลี้ยงประเภทไหน?</summary><p>ขณะนี้รองรับสุนัขและแมว</p></details><details><summary>ต้องติดตั้งแอปในโทรศัพท์ไหม?</summary><p>ไม่ต้อง PawRoutine เป็นเว็บไซต์ที่ใช้ได้ทั้งคอมพิวเตอร์และมือถือ</p></details><details><summary>ระบบส่งข้อความหรืออีเมลเตือนไหม?</summary><p>ขณะนี้การแจ้งเตือนแสดงภายในเว็บไซต์เมื่อเปิดใช้งาน ยังไม่ส่งอีเมลหรือ push notification</p></details></section></main><footer className="landing-footer"><Brand /><p>ดูแลทุกวัน ไปด้วยกัน</p></footer></div>;
}

function PetAvatar({ pet, size = 'normal' }) {
  return <span className={`pet-avatar ${pet.species} ${size}`} aria-hidden="true"><Icon name={pet.species === 'cat' ? 'cat' : 'dog'} size={size === 'large' ? 36 : 24} /></span>;
}

function AuthScreen({ onLogin, onBack }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault(); setError(''); setLoading(true);
    try { onLogin(await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify(form) })); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }
  return <main className="auth-layout">
    <section className="auth-story" aria-label="เกี่ยวกับ PawRoutine">
      <button className="auth-back" type="button" onClick={onBack}>← กลับหน้าแรก</button><Brand light />
      <div className="auth-story-inner"><span className="story-kicker">พื้นที่เล็ก ๆ สำหรับความรักที่ยิ่งใหญ่</span><h1>ทุกวันของเขา<br /><em>เราดูแลไปด้วยกัน</em></h1><p>ตารางดูแลสัตว์เลี้ยงที่ทำให้ทุกคนในบ้านรู้ตรงกัน ใครทำอะไรแล้ว และอะไรยังรออยู่</p><div className="story-art" aria-hidden="true"><span className="story-orbit orbit-one" /><span className="story-orbit orbit-two" /><span className="story-pet story-dog"><Icon name="dog" size={58} /></span><span className="story-pet story-cat"><Icon name="cat" size={48} /></span><span className="story-spark"><Icon name="sparkle" size={34} /></span></div></div>
      <div className="story-footer">DOGS & CATS · ONE HAPPY HOME</div>
    </section>
    <section className="auth-panel"><div className="auth-card"><span className="eyebrow">WELCOME TO PAWROUTINE</span><h2>{mode === 'login' ? 'ยินดีต้อนรับกลับ' : 'เริ่มดูแลไปด้วยกัน'}</h2><p className="muted">{mode === 'login' ? 'เข้าสู่ระบบเพื่อดูตารางดูแลวันนี้' : 'สร้างบัญชีเพื่อจัดกิจวัตรของสุนัขและแมว'}</p><form onSubmit={submit} className="form-stack">
      {mode === 'register' && <label>ชื่อของคุณ<input required minLength="2" autoComplete="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="ชื่อที่สมาชิกในบ้านรู้จัก" /></label>}
      <label>อีเมล<input required type="email" autoComplete="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" /></label>
      <label>รหัสผ่าน<span className="password-field"><input required minLength={mode === 'register' ? 8 : undefined} type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="อย่างน้อย 8 ตัวอักษร" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}>{showPassword ? 'ซ่อน' : 'แสดง'}</button></span></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button primary full" disabled={loading}>{loading ? 'กำลังดำเนินการ…' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}<Icon name="arrow" size={18} /></button>
    </form><p className="auth-switch">{mode === 'login' ? 'ยังไม่มีบัญชี?' : 'มีบัญชีอยู่แล้ว?'} <button type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'สร้างบัญชีใหม่' : 'เข้าสู่ระบบ'}</button></p></div></section>
  </main>;
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
      if (event.key === 'Escape') closeRef.current();
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const controls = [...dialogRef.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled)')];
      if (!controls.length) return;
      if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); previous?.focus?.(); };
  }, []);
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}><section ref={dialogRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-top"><div><span className="eyebrow">PAWROUTINE</span><h2 id="modal-title">{title}</h2>{description && <p className="muted">{description}</p>}</div><button className="icon-button" type="button" onClick={onClose} aria-label="ปิดหน้าต่าง"><Icon name="close" /></button></div>{children}</section></div>;
}

function WorkspaceForm({ kind, pets, members, item, currentId, headers, onClose, onSaved }) {
  const editingPet = kind === 'editPet';
  const editingRoutine = kind === 'editRoutine';
  const isPet = kind === 'pet' || editingPet;
  const isRoutine = kind === 'routine' || editingRoutine;
  const [form, setForm] = useState({ name: item?.name || '', invite_code: '', species: item?.species || 'dog', birth_date: item?.birth_date ? String(item.birth_date).slice(0, 10) : '', notes: item?.notes || '', vet_contact: item?.vet_contact || '', pet_id: item?.pet_id || pets[0]?.id || '', title: item?.title || '', activity_type: item?.activity_type || 'feeding', schedule_type: item?.schedule_value?.type || 'weekly', date: item?.schedule_value?.date || '', time: item?.schedule_value?.time || '08:00', days: item?.schedule_value?.days || [0, 1, 2, 3, 4, 5, 6], instructions: item?.instructions || '', assigned_user_id: item?.assigned_user_id || '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const titles = { household: 'สร้างบ้านใหม่', join: 'เข้าร่วมบ้าน', pet: 'เพิ่มสัตว์เลี้ยง', routine: 'เพิ่มกิจวัตร', editPet: 'แก้ไขข้อมูลสัตว์เลี้ยง', editRoutine: 'แก้ไขกิจวัตร' };
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const path = kind === 'household' ? '/households' : kind === 'join' ? '/households/join' : editingPet ? `/pets/${item.id}` : kind === 'pet' ? `/households/${currentId}/pets` : editingRoutine ? `/routines/${item.id}` : `/pets/${form.pet_id}/routines`;
      const body = kind === 'household' ? { name: form.name } : kind === 'join' ? { invite_code: form.invite_code } : isPet ? { name: form.name, species: form.species, birth_date: form.birth_date || null, notes: form.notes, vet_contact: form.vet_contact } : { title: form.title, activity_type: form.activity_type, schedule_type: form.schedule_type, date: form.date, time: form.time, days: form.days, instructions: form.instructions, assigned_user_id: form.assigned_user_id || null };
      const result = await api(path, { method: editingPet || editingRoutine ? 'PATCH' : 'POST', headers, body: JSON.stringify(body) });
      onSaved(result);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }
  function toggleDay(day) { setForm({ ...form, days: form.days.includes(day) ? form.days.filter(value => value !== day) : [...form.days, day].sort() }); }
  return <Modal title={titles[kind]} description={isRoutine ? 'กิจวัตรจะปรากฏในงานวันนี้ตามวันที่คุณเลือก' : undefined} onClose={onClose}><form className="form-stack" onSubmit={submit}>
    {kind === 'household' && <label>ชื่อบ้าน<input required minLength="2" autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="เช่น บ้านของโมจิ" /></label>}
    {kind === 'join' && <label>รหัสเชิญ<input required autoFocus value={form.invite_code} onChange={e => setForm({ ...form, invite_code: e.target.value.toUpperCase() })} placeholder="กรอกรหัสจากเจ้าของบ้าน" /></label>}
    {isPet && <><label>ชื่อสัตว์เลี้ยง<input required autoFocus value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="เช่น โมจิ" /></label><label>ประเภท<select value={form.species} onChange={e => setForm({ ...form, species: e.target.value })}><option value="dog">สุนัข</option><option value="cat">แมว</option></select></label><div className="form-grid"><label>วันเกิด (ถ้าทราบ)<input type="date" value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} /></label><label>ติดต่อสัตวแพทย์<input value={form.vet_contact} onChange={e => setForm({ ...form, vet_contact: e.target.value })} placeholder="เบอร์หรือชื่อคลินิก" /></label></div><label>ข้อมูลที่ควรรู้<textarea rows="3" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="เช่น แพ้อาหาร หรือข้อควรระวัง" /></label></>}
    {isRoutine && <><label>สำหรับสัตว์เลี้ยง<select required value={form.pet_id} disabled={editingRoutine} onChange={e => setForm({ ...form, pet_id: e.target.value })}>{pets.map(pet => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select></label><label>ชื่อกิจกรรม<input required autoFocus value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="เช่น ให้อาหารเช้า" /></label><div className="form-grid"><label>ประเภท<select value={form.activity_type} onChange={e => setForm({ ...form, activity_type: e.target.value })}>{Object.entries(ACTIVITIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>เวลา<input required type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></label></div><label>กำหนดการ<select value={form.schedule_type} onChange={e => setForm({ ...form, schedule_type: e.target.value })}><option value="weekly">ทำซ้ำทุกสัปดาห์</option><option value="once">ครั้งเดียว</option></select></label>{form.schedule_type === 'once' ? <label>วันที่นัดหมาย<input required type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></label> : <fieldset className="weekday-field"><legend>ทำซ้ำวันไหน</legend><div className="weekday-list">{WEEKDAYS.map((day, index) => <button key={day} type="button" className={form.days.includes(index) ? 'day-pill selected' : 'day-pill'} aria-pressed={form.days.includes(index)} onClick={() => toggleDay(index)}>{day}</button>)}</div></fieldset>}<label>ผู้รับผิดชอบ<select value={form.assigned_user_id} onChange={e => setForm({ ...form, assigned_user_id: e.target.value })}><option value="">ทุกคนในบ้าน</option>{members.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label><label>วิธีดูแล (ถ้ามี)<textarea rows="3" value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} placeholder="รายละเอียดที่สมาชิกในบ้านควรรู้" /></label></>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-actions"><button type="button" className="button ghost" onClick={onClose}>ยกเลิก</button><button className="button primary" disabled={saving || (isRoutine && (!pets.length || (form.schedule_type === 'weekly' && !form.days.length) || (form.schedule_type === 'once' && !form.date)))}>{saving ? 'กำลังบันทึก…' : kind === 'join' ? 'เข้าร่วมบ้าน' : 'บันทึก'}</button></div>
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
    <section className="content-card"><div className="section-header"><div><span className="section-kicker">DAILY PLAN</span><h2>งานดูแลวันนี้</h2><p>เรียงตามเวลา เพื่อให้รู้ว่าต้องทำอะไรก่อน</p></div><span className="date-badge">{new Date().toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric' })}</span></div><div className="filter-row" role="group" aria-label="กรองงาน">{[['all', 'ทั้งหมด'], ['todo', 'รอดำเนินการ'], ['completed', 'เสร็จแล้ว'], ['skipped', 'ข้ามแล้ว']].map(([value, label]) => <button key={value} className={filter === value ? 'filter-chip active' : 'filter-chip'} onClick={() => setFilter(value)} aria-pressed={filter === value}>{label}</button>)}</div>{!tasks.length ? <EmptyState icon="calendar" title="วันนี้ยังไม่มีงาน" description={pets.length ? 'เมื่อเจ้าของบ้านเพิ่มกิจวัตร งานจะปรากฏที่นี่' : 'เริ่มจากเพิ่มสุนัขหรือแมวในบ้านก่อน'} action={pets.length ? canManage ? 'เพิ่มกิจวัตร' : undefined : 'เพิ่มสัตว์เลี้ยง'} onAction={pets.length ? onAddRoutine : onAddPet} /> : filtered.length ? <div className="task-list">{filtered.map(task => <TaskCard key={task.id} task={task} onComplete={onComplete} onSkip={onSkip} busy={busyId === task.id} />)}</div> : <EmptyState icon="check" title="ไม่มีงานในหมวดนี้" description="ลองเลือกตัวกรองอื่นเพื่อดูรายการทั้งหมด" />}</section></>;
}

function PetsView({ pets, onAdd, onEdit, onArchive, isOwner }) {
  return <section className="content-card"><div className="section-header"><div><span className="section-kicker">OUR COMPANIONS</span><h2>สัตว์เลี้ยงในบ้าน</h2><p>ข้อมูลที่ทุกคนใช้ดูแลร่วมกัน</p></div><button className="button primary" onClick={onAdd}><Icon name="plus" size={18} />เพิ่มสัตว์เลี้ยง</button></div>{pets.length ? <div className="pet-grid">{pets.map(pet => <article className="pet-card" key={pet.id}><div className="pet-card-top"><PetAvatar pet={pet} size="large" /><span className="pet-type">{pet.species === 'cat' ? 'แมว' : 'สุนัข'}</span></div><h3>{pet.name}</h3>{pet.birth_date && <p>วันเกิด {new Date(pet.birth_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>}{pet.notes && <p className="pet-note">{pet.notes}</p>}{pet.vet_contact && <div className="pet-vet">สัตวแพทย์: {pet.vet_contact}</div>}<div className="manage-actions"><button className="button ghost" onClick={() => onEdit(pet)}>แก้ไข</button>{isOwner && <button className="button subtle-danger" onClick={() => onArchive(pet)}>เก็บข้อมูลเก่า</button>}</div></article>)}</div> : <EmptyState title="ยังไม่มีสัตว์เลี้ยงในบ้าน" description="เพิ่มเพื่อนตัวแรก แล้วจึงสร้างกิจวัตรของเขา" action="เพิ่มสัตว์เลี้ยง" onAction={onAdd} />}</section>;
}

function RoutinesView({ pets, routines, members, onAdd, onAddPet, onEdit, onToggle, onArchive, isOwner }) {
  return <section className="content-card"><div className="section-header"><div><span className="section-kicker">CARE RHYTHM</span><h2>กิจวัตรและนัดหมาย</h2><p>ทุกกิจกรรมที่ตั้งไว้สำหรับสมาชิกตัวน้อย</p></div>{isOwner && <button className="button primary" onClick={pets.length ? onAdd : onAddPet}><Icon name="plus" size={18} />{pets.length ? 'เพิ่มกิจวัตร' : 'เพิ่มสัตว์เลี้ยง'}</button>}</div>{routines.length ? <div className="routine-list">{routines.map(routine => { const pet = pets.find(item => item.id === routine.pet_id); const schedule = routine.schedule_value || {}; const days = Array.isArray(schedule.days) ? schedule.days : [0, 1, 2, 3, 4, 5, 6]; const assignee = members.find(item => item.id === routine.assigned_user_id); return <article className="routine-card" key={routine.id}><span className="routine-icon"><Icon name="calendar" size={22} /></span><div className="routine-body"><div className="routine-heading"><h3>{routine.title}</h3><span className={`status ${routine.active ? 'status-active' : 'status-skipped'}`}>{routine.active ? 'ใช้งานอยู่' : 'ปิดใช้งาน'}</span></div><p>{pet?.name || 'สัตว์เลี้ยง'} <span className="dot-separator">·</span> {ACTIVITIES[routine.activity_type] || routine.activity_type}</p><div className="routine-meta"><span><Icon name="clock" size={16} />{schedule.time || '09:00'} น.</span><span>{schedule.type === 'once' ? `ครั้งเดียว · ${schedule.date}` : days.length === 7 ? 'ทุกวัน' : days.map(day => WEEKDAYS[day]).join(' · ')}</span><span>ผู้รับผิดชอบ: {assignee?.name || 'ทุกคน'}</span></div>{routine.instructions && <p className="routine-instruction">{routine.instructions}</p>}{isOwner && <div className="manage-actions"><button className="button ghost" onClick={() => onEdit(routine)}>แก้ไข</button><button className="button ghost" onClick={() => onToggle(routine)}>{routine.active ? 'ปิดชั่วคราว' : 'เปิดใช้งาน'}</button><button className="button subtle-danger" onClick={() => onArchive(routine)}>เก็บข้อมูลเก่า</button></div>}</div></article>; })}</div> : <EmptyState icon="calendar" title="ยังไม่มีกิจวัตร" description={pets.length ? 'กำหนดเวลาให้อาหาร เติมน้ำ หรือกิจกรรมอื่นเพื่อเริ่มดูแลร่วมกัน' : 'เพิ่มสัตว์เลี้ยงก่อน แล้วค่อยตั้งกิจวัตรให้เขา'} action={isOwner ? pets.length ? 'เพิ่มกิจวัตร' : 'เพิ่มสัตว์เลี้ยง' : undefined} onAction={pets.length ? onAdd : onAddPet} />}</section>;
}

function HistoryView({ history, pets, currentId, headers }) {
  const [petId, setPetId] = useState('all');
  const [activity, setActivity] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [results, setResults] = useState(history);
  const [filterError, setFilterError] = useState('');
  const historyPets = useMemo(() => [...pets, ...history.filter(item => !pets.some(pet => pet.id === item.pet_id)).map(item => ({ id: item.pet_id, name: `${item.pet_name} (เก็บข้อมูลแล้ว)` }))].filter((pet, index, list) => list.findIndex(item => item.id === pet.id) === index), [pets, history]);
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
  return <section className="content-card"><div className="section-header"><div><span className="section-kicker">CARE LOG</span><h2>ประวัติการดูแล</h2><p>ดูว่าใครดูแลอะไร และเมื่อไร</p></div></div><div className="history-filters"><label>สัตว์เลี้ยง<select value={petId} onChange={event => setPetId(event.target.value)}><option value="all">ทุกตัว</option>{historyPets.map(pet => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select></label><label>กิจกรรม<select value={activity} onChange={event => setActivity(event.target.value)}><option value="all">ทุกประเภท</option>{Object.entries(ACTIVITIES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>ตั้งแต่<input type="date" value={from} max={to || undefined} onChange={event => setFrom(event.target.value)} /></label><label>ถึง<input type="date" value={to} min={from || undefined} onChange={event => setTo(event.target.value)} /></label></div>{filterError && <p className="form-error" role="alert">{filterError}</p>}{results.length ? <div className="history-list">{results.map(item => <article className="history-item" key={item.id}><span className={`history-symbol ${item.status}`}><Icon name={item.status === 'completed' ? 'check' : 'skip'} size={18} /></span><div><h3>{item.title}</h3><p>{item.pet_name} <span className="dot-separator">·</span> {item.completed_by_name || 'ไม่ระบุผู้ทำ'}</p><small>{new Date(item.completed_at || item.scheduled_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</small>{item.notes && <p className="history-note">หมายเหตุ: {item.notes}</p>}</div><span className={`status status-${item.status}`}>{STATUS[item.status] || item.status}</span></article>)}</div> : <EmptyState icon="history" title="ยังไม่มีประวัติในรายการนี้" description="ลองปรับตัวกรองหรือทำงานดูแลรายการแรก" />}</section>;
}

function HouseholdView({ household, members, trash, busyId, onCreate, onJoin, onCopy, onTrash, onRestore }) {
  return <div className="household-layout"><section className="content-card"><div className="section-header"><div><span className="section-kicker">THE PEOPLE WHO CARE</span><h2>{household?.name || 'บ้านของเรา'}</h2><p>ทุกคนที่ช่วยกันดูแลสัตว์เลี้ยง</p></div><span className="role-badge">{household?.role === 'owner' ? 'เจ้าของบ้าน' : 'สมาชิก'}</span></div><div className="member-list">{members.map(member => <div className="member-row" key={member.id}><span className="member-avatar">{member.name?.slice(0, 1) || 'U'}</span><div><strong>{member.name}</strong><small>{member.email}</small></div><span className="member-role">{member.role === 'owner' ? 'เจ้าของบ้าน' : 'สมาชิก'}</span></div>)}</div></section><aside className="household-side"><div className="content-card invite-card"><span className="section-kicker">INVITE YOUR PEOPLE</span><h3>ดูแลไปด้วยกัน</h3><p>ส่งรหัสนี้ให้คนในบ้าน เพื่อให้เห็นตารางและประวัติชุดเดียวกัน</p>{household?.invite_code ? <div className="invite-code"><strong>{household.invite_code}</strong><button className="icon-button" onClick={onCopy} aria-label="คัดลอกรหัสเชิญ"><Icon name="copy" size={18} /></button></div> : <p className="muted">รหัสเชิญจะแสดงกับเจ้าของบ้าน</p>}</div><div className="content-card house-actions"><h3>จัดการบ้าน</h3><button className="button secondary full" onClick={onCreate}><Icon name="plus" size={18} />สร้างบ้านใหม่</button><button className="button ghost full" onClick={onJoin}><Icon name="users" size={18} />เข้าร่วมบ้านอื่น</button>{household?.role === 'owner' && <button className="button subtle-danger full" onClick={() => onTrash(household)}>ย้ายบ้านไปถังขยะ</button>}</div>{trash.length > 0 && <div className="content-card house-actions"><span className="section-kicker">TRASH</span><h3>ถังขยะ</h3><p className="muted">บ้านที่กู้คืนได้พร้อมข้อมูลเดิมทั้งหมด</p>{trash.map(item => <div className="member-row" key={item.id}><div><strong>{item.name}</strong><small>ย้ายเมื่อ {new Date(item.archived_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}</small></div><button className="button ghost" disabled={busyId === `restore:${item.id}`} onClick={() => onRestore(item.id)}>{busyId === `restore:${item.id}` ? 'กำลังกู้คืน…' : 'กู้คืนบ้าน'}</button></div>)}</div>}</aside></div>;
}

function TrashHouseholdModal({ household, busy, onClose, onConfirm }) {
  const [confirmation, setConfirmation] = useState('');
  const matches = confirmation === household.name;
  return <Modal title="ย้ายบ้านไปถังขยะ" description="บ้านจะหายจากสมาชิกทุกคนชั่วคราว แต่ข้อมูลทั้งหมดจะยังอยู่และเจ้าของบ้านกู้คืนได้" onClose={onClose}><form className="form-stack" onSubmit={event => { event.preventDefault(); if (matches) onConfirm(); }}><label>พิมพ์ชื่อบ้าน “{household.name}” เพื่อยืนยัน<input autoFocus value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" /></label><div className="form-actions"><button type="button" className="button ghost" onClick={onClose}>ยกเลิก</button><button className="button danger" disabled={!matches || busy}>{busy ? 'กำลังย้าย…' : 'ย้ายบ้านไปถังขยะ'}</button></div></form></Modal>;
}

function CalendarView({ currentId, headers, onToday }) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const [month, setMonth] = useState(`${today.slice(0, 7)}-01`);
  const [selected, setSelected] = useState(today);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const dates = useMemo(() => {
    const first = new Date(`${month}T00:00:00.000Z`);
    const start = Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), 1 - first.getUTCDay());
    return Array.from({ length: 42 }, (_, index) => new Date(start + index * 86_400_000).toISOString().slice(0, 10));
  }, [month]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    api(`/households/${currentId}/calendar?from=${dates[0]}&to=${dates.at(-1)}`, { headers })
      .then(data => { if (!cancelled) setEvents(data.events || []); })
      .catch(err => { if (!cancelled) setError(`${err.message} ลองเปลี่ยนเดือนอีกครั้ง`); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currentId, dates, headers]);
  function moveMonth(delta) {
    const date = new Date(`${month}T00:00:00.000Z`);
    date.setUTCMonth(date.getUTCMonth() + delta);
    const next = date.toISOString().slice(0, 10);
    setMonth(next); setSelected(next);
  }
  const selectedEvents = events.filter(event => event.date === selected);
  return <section className="content-card calendar-view"><div className="section-header"><div><span className="section-kicker">CARE CALENDAR</span><h2>ปฏิทินการดูแล</h2><p>ตารางจริงจากกิจวัตรและนัดหมายของบ้าน</p></div></div><div className="calendar-toolbar"><button type="button" className="icon-button" onClick={() => moveMonth(-1)} aria-label="เดือนก่อนหน้า">‹</button><h3>{new Date(`${month}T00:00:00.000Z`).toLocaleDateString('th-TH', { timeZone: 'UTC', month: 'long', year: 'numeric' })}</h3><button type="button" className="icon-button" onClick={() => moveMonth(1)} aria-label="เดือนถัดไป">›</button><button type="button" className="button secondary" onClick={() => { setMonth(`${today.slice(0, 7)}-01`); setSelected(today); }}>วันนี้</button></div><div className="calendar-grid" role="group" aria-label="เลือกวันที่"><div className="calendar-weekdays">{WEEKDAYS.map(day => <span key={day}>{day}</span>)}</div><div className="calendar-days">{dates.map(date => { const count = events.filter(event => event.date === date).length; return <button key={date} type="button" className={`calendar-day ${date.slice(0, 7) !== month.slice(0, 7) ? 'outside' : ''} ${date === selected ? 'selected' : ''} ${date === today ? 'today' : ''}`} aria-pressed={date === selected} aria-label={`${new Date(`${date}T00:00:00.000Z`).toLocaleDateString('th-TH', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })} ${count} รายการ`} onClick={() => setSelected(date)}><span>{Number(date.slice(-2))}</span>{count > 0 && <small>{count} งาน</small>}</button>; })}</div></div><div className="calendar-agenda"><div className="section-header"><div><h3>{new Date(`${selected}T00:00:00.000Z`).toLocaleDateString('th-TH', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' })}</h3><p>{selectedEvents.length} รายการ</p></div>{selected === today && <button className="button secondary" onClick={onToday}>ไปหน้างานวันนี้</button>}</div>{error ? <p className="form-error" role="alert">{error}</p> : loading ? <p role="status">กำลังโหลดปฏิทิน…</p> : selectedEvents.length ? <div className="calendar-event-list">{selectedEvents.map(event => <article className="calendar-event" key={event.id || `${event.routine_id}-${event.date}`}><span className="calendar-event-time">{new Date(event.scheduled_at).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' })}</span><div><strong>{event.title}</strong><p>{event.pet_name} · {ACTIVITIES[event.activity_type] || event.activity_type}</p></div><span className={`status status-${event.status}`}>{STATUS[event.status] || 'กำลังจะถึง'}</span></article>)}</div> : <EmptyState icon="calendar" title="ไม่มีงานในวันนี้" description="เลือกวันอื่นหรือเพิ่มกิจวัตรเพื่อดูตารางการดูแล" />}</div></section>;
}

function SettingsView({ session, household, headers, onUpdated }) {
  const [name, setName] = useState(session.user?.name || '');
  const [houseName, setHouseName] = useState(household?.name || '');
  const [settings, setSettings] = useState({ notifications_enabled: true, lead_minutes: 60 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => { setHouseName(household?.name || ''); }, [household?.name]);
  useEffect(() => { let cancelled = false; api('/auth/settings', { headers }).then(data => { if (!cancelled) setSettings(data.settings); }).catch(err => { if (!cancelled) setError(err.message); }).finally(() => { if (!cancelled) setLoading(false); }); return () => { cancelled = true; }; }, [headers]);
  async function save(event, kind) {
    event.preventDefault(); setSaving(kind); setError(''); setNotice('');
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
  return <section className="content-card settings-view"><div className="section-header"><div><span className="section-kicker">YOUR SPACE</span><h2>ตั้งค่า PawRoutine</h2><p>ข้อมูลที่ใช้จริงกับบัญชีและบ้านของคุณ</p></div></div>{error && <p className="form-error" role="alert">{error}</p>}{notice && <p className="settings-success" role="status">{notice}</p>}{loading ? <p role="status">กำลังโหลดการตั้งค่า…</p> : <div className="settings-grid"><form className="settings-card form-stack" onSubmit={event => save(event, 'name')}><h3>ข้อมูลบัญชี</h3><label>ชื่อที่แสดง<input required minLength="2" maxLength="120" value={name} onChange={event => setName(event.target.value)} /></label><p className="muted">อีเมล: {session.user?.email}</p><button className="button primary" disabled={Boolean(saving)}>{saving === 'name' ? 'กำลังบันทึก…' : 'บันทึกชื่อ'}</button></form><form className="settings-card form-stack" onSubmit={event => save(event, 'notifications')}><h3>แจ้งเตือนในเว็บ</h3><label className="checkbox-row"><input type="checkbox" checked={settings.notifications_enabled} onChange={event => setSettings({ ...settings, notifications_enabled: event.target.checked })} /> เปิดการแจ้งเตือน</label><label>เตือนล่วงหน้า<select value={settings.lead_minutes} onChange={event => setSettings({ ...settings, lead_minutes: Number(event.target.value) })}><option value="0">เมื่อถึงเวลา</option><option value="15">15 นาที</option><option value="30">30 นาที</option><option value="60">1 ชั่วโมง</option><option value="120">2 ชั่วโมง</option><option value="1440">1 วัน</option></select></label><p className="muted">แสดงเมื่อเปิดเว็บไซต์เท่านั้น ยังไม่ส่งอีเมลหรือ push notification</p><button className="button primary" disabled={Boolean(saving)}>{saving === 'notifications' ? 'กำลังบันทึก…' : 'บันทึกการแจ้งเตือน'}</button></form>{household?.role === 'owner' && <form className="settings-card form-stack" onSubmit={event => save(event, 'house')}><h3>บ้านของเรา</h3><label>ชื่อบ้าน<input required minLength="2" maxLength="120" value={houseName} onChange={event => setHouseName(event.target.value)} /></label><button className="button primary" disabled={Boolean(saving)}>{saving === 'house' ? 'กำลังบันทึก…' : 'บันทึกชื่อบ้าน'}</button></form>}</div>}</section>;
}

function MoreView({ onNavigate, onLogout }) {
  return <section className="content-card more-view"><span className="section-kicker">MORE</span><h2>เพิ่มเติม</h2><div className="more-list">{NAV.filter(item => ['routines', 'history', 'activity', 'household', 'settings'].includes(item.id)).map(item => <button key={item.id} className="nav-item" onClick={() => onNavigate(item.id)}><Icon name={item.icon} /><span>{item.label}</span><Icon name="chevron" size={17} /></button>)}<button className="nav-item logout" onClick={onLogout}><Icon name="logout" /><span>ออกจากระบบ</span></button></div></section>;
}

export default function Page() {
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
  const [trashedHouseholds, setTrashedHouseholds] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [modal, setModal] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [undoActivity, setUndoActivity] = useState(null);
  const [undoBusy, setUndoBusy] = useState(false);
  const workspaceRequestRef = useRef(0);
  const headers = useMemo(() => session?.token ? { Authorization: `Bearer ${session.token}` } : {}, [session]);
  const appApi = useCallback((path, options = {}) => api(path, { ...options, headers: { ...headers, ...(options.headers || {}) } }), [headers]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

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
      setRoutines(routineResults.flatMap(result => result.routines || []));
    } catch (err) { if (requestId === workspaceRequestRef.current) setError(err.message); }
    finally { if (requestId === workspaceRequestRef.current) setLoading(false); }
  }, [currentId, headers, session]);

  const loadTrash = useCallback(async () => {
    if (!session) return;
    const result = await api('/households/trash', { headers });
    setTrashedHouseholds(result.households || []);
  }, [headers, session]);

  useEffect(() => { if (!session) return; loadHouseholds().catch(err => setError(err.message)); }, [session]);
  useEffect(() => { loadWorkspace(); }, [loadWorkspace]);
  useEffect(() => { if (view === 'household') loadTrash().catch(err => setError(err.message)); }, [view, loadTrash]);

  function login(data) { window.localStorage.setItem('pawroutine_session', JSON.stringify(data)); setSession(data); }
  function logout() { workspaceRequestRef.current += 1; window.localStorage.removeItem('pawroutine_session'); window.localStorage.removeItem('pawroutine_household'); setSession(null); setHouseholds([]); setTrashedHouseholds([]); setCurrentId(''); setHousehold(null); setNotifications([]); setView('today'); setPublicMode('landing'); window.location.hash = ''; }
  function navigate(next) { setView(next); window.location.hash = next; document.getElementById('main-content')?.focus(); }
  function selectHousehold(id) { workspaceRequestRef.current += 1; setCurrentId(id); window.localStorage.setItem('pawroutine_household', id); setHousehold(null); setPets([]); setTasks([]); setHistory([]); setNotifications([]); setRoutines([]); navigate('today'); }
  async function saved(kind, result) {
    setModal(''); setNotice(kind === 'household' ? 'สร้างบ้านเรียบร้อย' : kind === 'join' ? 'เข้าร่วมบ้านเรียบร้อย' : kind === 'pet' ? 'เพิ่มสัตว์เลี้ยงเรียบร้อย' : kind === 'routine' ? 'เพิ่มกิจวัตรเรียบร้อย' : 'บันทึกการแก้ไขแล้ว');
    if (kind === 'household' || kind === 'join') { const selected = await loadHouseholds(result.household?.id); if (selected) window.localStorage.setItem('pawroutine_household', selected.id); }
    else await loadWorkspace();
  }
  async function updateTask(id, action, notes = '') {
    setBusyId(id); setError('');
    try { await api(`/tasks/${id}/${action}`, { method: 'POST', headers, body: JSON.stringify({ notes }) }); setNotice(action === 'complete' ? 'บันทึกว่างานเสร็จแล้ว' : 'ข้ามงานนี้แล้ว'); await loadWorkspace(); }
    catch (err) { setError(err.message); await loadWorkspace(); }
    finally { setBusyId(''); setModal(''); }
  }
  async function mutateCurrentTask(task, action, payload = {}) {
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
  async function undoLastTaskChange() {
    if (!undoActivity) return;
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
  async function trashCurrentHousehold() {
    if (!household) return;
    setBusyId(`trash:${household.id}`); setError('');
    try {
      const result = await api(`/households/${household.id}/archive`, { method: 'POST', headers, body: '{}' });
      const remaining = households.filter(item => item.id !== household.id);
      const selected = remaining[0] || null;
      setModal(''); setHousehold(null); setNotice('ย้ายบ้านไปถังขยะแล้ว');
      setHouseholds(remaining);
      setTrashedHouseholds(current => [result.household, ...current.filter(item => item.id !== result.household.id)]);
      setCurrentId(selected?.id || '');
      if (selected) window.localStorage.setItem('pawroutine_household', selected.id);
      else window.localStorage.removeItem('pawroutine_household');
      navigate(selected ? 'today' : 'household');
      try { await Promise.all([loadHouseholds(selected?.id), loadTrash()]); }
      catch { setNotice('ย้ายบ้านไปถังขยะแล้ว แต่โหลดรายการล่าสุดไม่สำเร็จ กรุณาลองรีเฟรชหน้า'); }
    } catch (err) { setError(err.message); }
    finally { setBusyId(''); }
  }
  async function restoreTrashedHousehold(id) {
    setBusyId(`restore:${id}`); setError('');
    try {
      const result = await api(`/households/${id}/restore`, { method: 'POST', headers, body: '{}' });
      const restored = { ...result.household, role: 'owner' };
      setTrashedHouseholds(current => current.filter(item => item.id !== id));
      setHouseholds(current => [restored, ...current.filter(item => item.id !== id)]);
      setCurrentId(id); setHousehold(restored);
      window.localStorage.setItem('pawroutine_household', id);
      setNotice('กู้คืนบ้านและข้อมูลทั้งหมดแล้ว'); navigate('household');
      try { await Promise.all([loadHouseholds(id), loadTrash()]); }
      catch { setNotice('กู้คืนบ้านแล้ว แต่โหลดรายการล่าสุดไม่สำเร็จ กรุณาลองรีเฟรชหน้า'); }
    } catch (err) { setError(err.message); }
    finally { setBusyId(''); }
  }
  async function settingsUpdated(nextSession) { if (nextSession) setSession(nextSession); await loadHouseholds(); await loadWorkspace(); }

  if (!hydrated) return <div className="initial-loading" aria-label="กำลังเปิด PawRoutine"><Brand /></div>;
  if (!session) return publicMode === 'auth' ? <AuthScreen onLogin={login} onBack={() => setPublicMode('landing')} /> : <LandingPage onStart={() => setPublicMode('auth')} />;

  const activeLabel = NAV.find(item => item.id === view)?.label || (view === 'more' ? 'เพิ่มเติม' : 'วันนี้');
  const todayDate = new Date().toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const isOwner = household?.role === 'owner';
  const modalItem = modal.startsWith('editPet:') || modal.startsWith('archivePet:') ? pets.find(item => item.id === modal.split(':')[1]) : modal.startsWith('editRoutine:') || modal.startsWith('archiveRoutine:') ? routines.find(item => item.id === modal.split(':')[1]) : null;
  const content = view === 'today' ? <ProductTodayView tasks={tasks} pets={pets} members={members} currentUserId={session.user?.id} busyId={busyId} onComplete={(task, notes) => mutateCurrentTask(task, 'complete', { notes })} onSkip={(task, skipReason, notes) => mutateCurrentTask(task, 'skip', { skip_reason: skipReason, notes })} onReschedule={(task, scheduledAt) => mutateCurrentTask(task, 'reschedule', { scheduled_at: scheduledAt })} onReassign={(task, assignedUserId) => mutateCurrentTask(task, 'reassign', { assigned_user_id: assignedUserId })} onAdd={() => setModal('quickAdd')} />
    : view === 'calendar' ? <CalendarView currentId={currentId} headers={headers} onToday={() => navigate('today')} />
    : view === 'pets' ? <PetWorkspace pets={pets} routines={routines} api={appApi} isOwner={isOwner} onAdd={() => setModal('pet')} onEdit={pet => setModal(`editPet:${pet.id}`)} onArchive={pet => setModal(`archivePet:${pet.id}`)} />
    : view === 'routines' ? <RoutinesView pets={pets} routines={routines} members={members} isOwner={isOwner} onAdd={() => setModal('routineForm:custom')} onAddPet={() => setModal('pet')} onEdit={routine => setModal(`editRoutine:${routine.id}`)} onToggle={routine => manage(`/routines/${routine.id}`, 'PATCH', { active: !routine.active }, routine.active ? 'ปิดกิจวัตรชั่วคราวแล้ว' : 'เปิดกิจวัตรแล้ว')} onArchive={routine => setModal(`archiveRoutine:${routine.id}`)} />
    : view === 'history' ? <HistoryView history={history} pets={pets} currentId={currentId} headers={headers} />
    : view === 'activity' ? <ActivityView householdId={currentId} members={members} pets={pets} api={appApi} />
    : view === 'settings' ? <SettingsView session={session} household={household} headers={headers} onUpdated={settingsUpdated} />
    : view === 'more' ? <MoreView onNavigate={navigate} onLogout={logout} />
    : <HouseholdView household={household} members={members} trash={trashedHouseholds} busyId={busyId} onCreate={() => setModal('household')} onJoin={() => setModal('join')} onCopy={copyInvite} onTrash={item => setModal(`trashHouse:${item.id}`)} onRestore={restoreTrashedHousehold} />;
  return <div className="app-shell"><a className="skip-link" href="#main-content">ข้ามไปเนื้อหาหลัก</a><aside className="sidebar"><Brand /><div className="sidebar-label">YOUR SPACE</div><div className="household-picker"><label htmlFor="household-select">บ้านที่กำลังดู</label><div className="select-wrap"><select id="household-select" value={currentId} onChange={event => selectHousehold(event.target.value)} disabled={!households.length}>{households.length ? households.map(item => <option key={item.id} value={item.id}>{item.name}</option>) : <option value="">ยังไม่มีบ้าน</option>}</select><Icon name="down" size={17} /></div></div>{currentId && <button className="button primary sidebar-add" onClick={() => setModal('quickAdd')}><Icon name="plus" size={18} />เพิ่มรายการ</button>}<div className="sidebar-label nav-label">เมนูหลัก</div><nav className="side-nav" aria-label="เมนูหลัก">{NAV.map(item => <button key={item.id} className={view === item.id ? 'nav-item active' : 'nav-item'} aria-current={view === item.id ? 'page' : undefined} onClick={() => navigate(item.id)}><Icon name={item.icon} size={20} /><span>{item.label}</span>{item.id === 'today' && tasks.filter(task => ['pending', 'overdue'].includes(task.display_status)).length > 0 && <span className="nav-count">{tasks.filter(task => ['pending', 'overdue'].includes(task.display_status)).length}</span>}</button>)}</nav><div className="sidebar-bottom"><div className="sidebar-tip"><Icon name="sparkle" size={18} /><p>ดูแลทุกวัน<br /><strong>ไปด้วยกัน</strong></p></div><button className="nav-item logout" onClick={logout}><Icon name="logout" size={20} /><span>ออกจากระบบ</span></button></div></aside>
    <main id="main-content" className="main-content" tabIndex="-1"><header className="topbar"><div><p className="eyebrow">{todayDate}</p><h1>{activeLabel}</h1></div><div className="topbar-right"><span className="header-house">{household?.name || 'PawRoutine'}</span><div className="notification-wrap"><button className="icon-button notification-button" onClick={() => setShowNotifications(!showNotifications)} aria-label={`การแจ้งเตือน ${notifications.length} รายการ`} aria-expanded={showNotifications}><Icon name="bell" size={20} />{notifications.length > 0 && <span className="notification-count">{notifications.length}</span>}</button>{showNotifications && <section className="notification-panel" aria-label="รายการแจ้งเตือน"><div className="notification-panel-head"><h2>แจ้งเตือนในเว็บ</h2><button type="button" className="icon-button" onClick={() => setShowNotifications(false)} aria-label="ปิดรายการแจ้งเตือน"><Icon name="close" size={17} /></button></div>{notifications.length ? notifications.map(item => <div className="notification-item" key={item.id}><strong>{item.title}</strong><p>{item.pet_name} · {item.status === 'overdue' ? 'เลยเวลา' : 'ใกล้ถึงเวลา'} {new Date(item.scheduled_at).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' })}</p></div>) : <p className="muted">ไม่มีงานที่ต้องแจ้งเตือนตอนนี้</p>}<button className="button secondary full" onClick={() => { setShowNotifications(false); navigate('settings'); }}>ตั้งค่าการแจ้งเตือน</button></section>}</div><span className="user-avatar" title={session.user?.name}>{session.user?.name?.slice(0, 1) || 'U'}</span><button className="mobile-logout" onClick={logout} aria-label="ออกจากระบบ"><Icon name="logout" size={18} /></button></div></header>{error && <div className="alert error-alert" role="alert"><span>{error}</span><button onClick={() => setError('')} aria-label="ปิดข้อความแจ้งเตือน"><Icon name="close" size={18} /></button></div>}{notice && <div className="alert notice-alert" role="status"><span>{notice}</span><button onClick={() => setNotice('')} aria-label="ปิดข้อความแจ้งเตือน"><Icon name="close" size={18} /></button></div>}
    {!currentId && view !== 'household' ? <section className="onboarding"><span className="onboarding-icon"><Icon name="paw" size={42} /></span><span className="section-kicker">LET'S BEGIN</span><h2>เริ่มต้นที่บ้านของเรา</h2><p>สร้างพื้นที่สำหรับดูแลสัตว์เลี้ยงร่วมกัน หรือเข้าร่วมบ้านที่มีคนชวนไว้แล้ว</p><div><button className="button primary" onClick={() => setModal('household')}><Icon name="plus" size={18} />สร้างบ้านใหม่</button><button className="button secondary" onClick={() => setModal('join')}>มีรหัสเชิญ? เข้าร่วมบ้าน</button></div></section> : loading && !household && view !== 'household' ? <div className="loading-panel" role="status">กำลังโหลดข้อมูลของบ้าน…</div> : <div className="page-grid"><div className="page-main">{content}</div>{view !== 'household' && <aside className="context-rail"><section className="rail-card"><span className="section-kicker">YOUR COMPANIONS</span><div className="rail-title"><h2>เพื่อนในบ้าน</h2><button onClick={() => navigate('pets')} aria-label="ดูสัตว์เลี้ยงทั้งหมด"><Icon name="arrow" size={18} /></button></div>{pets.length ? <div className="rail-pets">{pets.slice(0, 4).map(pet => <div className="rail-pet" key={pet.id}><PetAvatar pet={pet} /><span><strong>{pet.name}</strong><small>{pet.species === 'cat' ? 'แมว' : 'สุนัข'}</small></span></div>)}</div> : <p className="rail-empty">เพิ่มสัตว์เลี้ยงเพื่อเริ่มจัดตารางดูแล</p>}<button className="rail-link" onClick={() => setModal('pet')}><Icon name="plus" size={17} />เพิ่มสัตว์เลี้ยง</button></section><section className="rail-card calm-card"><span className="section-kicker">A LITTLE REMINDER</span><h2>ดูแลด้วยความเข้าใจ</h2><p>ข้อมูลใน PawRoutine เป็นบันทึกกิจวัตร หากสัตว์เลี้ยงมีอาการผิดปกติ โปรดปรึกษาสัตวแพทย์</p></section></aside>}</div>}
    </main><nav className="bottom-nav" aria-label="เมนูบนมือถือ">{MOBILE_NAV.map(item => <button key={item.id} className={view === item.id || (item.id === 'more' && ['routines', 'history', 'activity', 'household', 'settings'].includes(view)) ? 'bottom-item active' : 'bottom-item'} aria-current={view === item.id ? 'page' : undefined} onClick={() => item.id === 'add' ? setModal('quickAdd') : navigate(item.id)}><Icon name={item.icon} size={21} /><span>{item.label}</span></button>)}</nav>
    {(['household', 'join', 'pet'].includes(modal) || modal.startsWith('editPet:') || modal.startsWith('editRoutine:')) && <WorkspaceForm key={modal} kind={modal.split(':')[0]} pets={pets} members={members} item={modalItem} currentId={currentId} headers={headers} onClose={() => setModal('')} onSaved={result => saved(modal.split(':')[0], result)} />}
    {modal === 'quickAdd' && <QuickAddSheet pets={pets} api={appApi} onClose={() => setModal('')} onSaved={loadWorkspace} onSelect={(choice, template) => setModal(choice === 'appointment' ? 'routineForm:vet' : choice === 'template' ? `routineForm:${template.id}` : 'routineForm:custom')} />}
    {modal.startsWith('routineForm:') && <Modal title="เพิ่มกิจวัตร" description="กรอกข้อมูลหลักก่อน แล้วเปิดตัวเลือกขั้นสูงได้เมื่อต้องการ" onClose={() => setModal('')}><RoutineForm pets={pets} members={members} initial={(() => { const template = getRoutineTemplate(modal.split(':')[1]); return template ? { title: template.title, activity_type: template.activity_type, times: template.times, type: template.scheduleType || 'weekly' } : {}; })()} onCancel={() => setModal('')} onSubmit={async input => { const result = await appApi(`/pets/${input.pet_id}/routines`, { method: 'POST', body: JSON.stringify(input) }); await saved('routine', result); }} /></Modal>}
    {(modal.startsWith('skip:') || modal.startsWith('complete:')) && <TaskNoteModal action={modal.split(':')[0]} onClose={() => setModal('')} onConfirm={notes => updateTask(modal.split(':')[1], modal.split(':')[0], notes)} busy={Boolean(busyId)} />}
    {(modal.startsWith('archivePet:') || modal.startsWith('archiveRoutine:')) && <Modal title="เก็บข้อมูลเก่า" description={`เก็บ ${modalItem?.name || modalItem?.title || 'รายการนี้'} ออกจากรายการที่ใช้งาน โดยประวัติการดูแลยังคงอยู่`} onClose={() => setModal('')}><div className="form-actions"><button className="button ghost" onClick={() => setModal('')}>ยกเลิก</button><button className="button danger" disabled={Boolean(busyId)} onClick={() => manage(modal.startsWith('archivePet:') ? `/pets/${modalItem.id}/archive` : `/routines/${modalItem.id}/archive`, 'POST', {}, 'เก็บข้อมูลเก่าแล้ว')}>{busyId ? 'กำลังบันทึก…' : 'ยืนยันเก็บข้อมูล'}</button></div></Modal>}
    {modal.startsWith('trashHouse:') && household?.id === modal.split(':')[1] && <TrashHouseholdModal household={household} busy={busyId === `trash:${household.id}`} onClose={() => setModal('')} onConfirm={trashCurrentHousehold} />}
    <UndoBar activity={undoActivity} onUndo={undoLastTaskChange} onDismiss={() => setUndoActivity(null)} busy={undoBusy} />
  </div>;
}

function TaskNoteModal({ action, onClose, onConfirm, busy }) {
  const [notes, setNotes] = useState('');
  const skipping = action === 'skip';
  return <Modal title={skipping ? 'ข้ามงานนี้' : 'บันทึกว่างานเสร็จแล้ว'} description="เพิ่มหมายเหตุให้คนในบ้านเข้าใจได้ (ไม่บังคับ)" onClose={onClose}><form className="form-stack" onSubmit={event => { event.preventDefault(); onConfirm(notes); }}><label>หมายเหตุ<textarea rows="3" maxLength={1000} value={notes} onChange={event => setNotes(event.target.value)} placeholder={skipping ? 'เช่น วันนี้ไม่สะดวกพาเดินเล่น' : 'เช่น กินอาหารหมดแล้ว'} /></label><div className="form-actions"><button type="button" className="button ghost" onClick={onClose}>ยกเลิก</button><button className={`button ${skipping ? 'danger' : 'primary'}`} disabled={busy}>{busy ? 'กำลังบันทึก…' : skipping ? 'ยืนยันข้ามงาน' : 'ยืนยันเสร็จแล้ว'}</button></div></form></Modal>;
}
