"use client";
import { useConfirmation } from '../../components/ConfirmationProvider.jsx';
import SelectField from '../../components/SelectField.jsx';
import DatePicker from '../../components/DatePicker.jsx';

import { useCallback, useEffect, useState } from 'react';

const METRIC_NAMES = {
  food_intake: 'การกินอาหาร', water_intake: 'การดื่มน้ำ', activity_level: 'กิจกรรม', sleep_amount: 'การนอน',
  stool_condition: 'การขับถ่าย', mood: 'อารมณ์', weight_kg: 'น้ำหนัก',
};
const VALUE_NAMES = {
  very_low: 'น้อยมาก', low: 'น้อยกว่าปกติ', usual: 'ตามปกติ', high: 'มากกว่าปกติ', very_high: 'มากมาก',
  normal: 'ปกติ', soft: 'นิ่ม', watery: 'เหลว', hard: 'แข็ง', not_observed: 'ยังไม่พบการขับถ่าย',
  bright: 'สดใส', quiet: 'เงียบกว่าปกติ', restless: 'กระสับกระส่าย', irritable: 'หงุดหงิด',
};
const STATUS_NAMES = { new: 'ใหม่', acknowledged: 'รับทราบแล้ว', monitoring: 'กำลังติดตาม', resolved: 'กลับสู่ปกติ' };
const RESOLUTION_NAMES = {
  returned_to_baseline: 'ข้อมูลกลับมาอยู่ในช่วงปกติ 2 วันต่อเนื่อง',
  source_changed: 'ข้อมูลต้นทางที่ใช้ตรวจจับถูกแก้ไขหรือลบ',
  direction_changed: 'ทิศทางการเปลี่ยนแปลงเปลี่ยนไป',
};
const dateText = value => new Date(`${String(value).slice(0, 10)}T00:00:00+07:00`).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium' });
function valueText(value, metric) {
  if (metric === 'weight_kg') return `${Number(value)} กก.`;
  return VALUE_NAMES[value] || value || 'ไม่มีข้อมูล';
}

function FollowUpForm({ item, members, busy, onCancel, onSave }) {
  const [form, setForm] = useState({
    assigned_user_id: item.assigned_to || '',
    follow_up_due_date: item.follow_up_due_date || '',
    follow_up_note: item.follow_up_note || '',
  });
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return <form className="alert-follow-up-form form-stack" onSubmit={event => { event.preventDefault(); onSave(item, form); }}>
    <fieldset><legend>วางแผนติดตามร่วมกัน</legend><div className="follow-up-fields"><label>ผู้ติดตาม<SelectField value={form.assigned_user_id} onChange={event => setForm({ ...form, assigned_user_id: event.target.value })}><option value="">ยังไม่มอบหมาย</option>{members.map(member => <option key={member.id} value={member.id} data-description={member.email}>{member.name}</option>)}</SelectField></label><label>วันติดตาม<DatePicker min={today} value={form.follow_up_due_date} onChange={event => setForm({ ...form, follow_up_due_date: event.target.value })} /></label></div><label>หมายเหตุสำหรับคนในบ้าน<textarea rows="3" maxLength="1000" value={form.follow_up_note} onChange={event => setForm({ ...form, follow_up_note: event.target.value })} placeholder="เช่น สังเกตการกินหลังมื้อเย็นและอัปเดตคืนนี้" /></label></fieldset>
    <div className="form-actions"><button type="button" className="button ghost" onClick={onCancel}>ยกเลิก</button><button className="button primary" disabled={busy}>{busy ? 'กำลังบันทึก…' : 'บันทึกการติดตาม'}</button></div>
  </form>;
}

function AlertCard({ item, members, busy, onTransition, onSaveFollowUp }) {
  const [editingFollowUp, setEditingFollowUp] = useState(false);
  const [result,setResult]=useState('');
  const observations = item.observed_value?.values || [];
  const baseline = item.baseline_value?.typical_value;
  return <article className={`wellness-alert-card status-${item.status}`}>
    <header><div><span className="alert-kicker">พบการเปลี่ยนแปลง</span><h5>{METRIC_NAMES[item.metric] || item.metric}</h5></div><span className="alert-status" role="status">{STATUS_NAMES[item.status] || item.status}</span></header>
    <div className="alert-comparison" aria-label="เปรียบเทียบค่าปกติกับค่าที่พบ">
      <div><span>ค่าปกติส่วนตัว</span><strong>{valueText(baseline, item.metric)}</strong><small>{dateText(item.baseline_start)} – {dateText(item.baseline_end)}</small></div>
      <span aria-hidden="true">→</span>
      <div><span>ค่าที่พบ 3 วัน</span><strong>{observations.map(value => valueText(value, item.metric)).join(' · ')}</strong><small>{dateText(item.observation_start)} – {dateText(item.observation_end)}</small></div>
    </div>
    <p className="alert-rule">{item.evidence?.rule_text}</p>
    {item.follow_up_result && <p><strong>ผลติดตาม:</strong> {item.follow_up_result}</p>}
    {!item.follow_up_completed_at && item.follow_up_due_date && item.status !== 'resolved' && <label>ผลที่สังเกตได้เมื่อทำการติดตาม<textarea maxLength={1000} value={result} onChange={e=>setResult(e.target.value)} placeholder="เลือกกรอกก่อนกดบันทึกว่าติดตามแล้ว"/></label>}
    {item.status !== 'resolved' && (item.assigned_to_name || item.follow_up_due_date || item.follow_up_note) && <dl className="alert-follow-up-summary"><div><dt>ผู้ติดตาม</dt><dd>{item.assigned_to_name || 'ยังไม่มอบหมาย'}</dd></div><div><dt>วันติดตาม</dt><dd>{item.follow_up_due_date ? dateText(item.follow_up_due_date) : 'ยังไม่กำหนด'}</dd></div>{item.follow_up_note && <div><dt>หมายเหตุ</dt><dd>{item.follow_up_note}</dd></div>}</dl>}
    {item.follow_up_completed_at && <p className="alert-resolution" role="status">ติดตามตามกำหนดแล้ว · หากต้องติดตามอีกครั้งให้กำหนดวันใหม่</p>}
    {item.status === 'resolved' && <p className="alert-resolution"><strong>เหตุผลที่ปิด:</strong> {RESOLUTION_NAMES[item.resolution_reason] || item.resolution_reason}</p>}
    <details className="alert-evidence"><summary>ดูหลักฐานที่ใช้ตรวจจับ</summary><ul>{(item.evidence?.observations || []).map(point => <li key={`${point.date}:${point.log_id}`}>{dateText(point.date)}: {valueText(point.value, item.metric)}</li>)}</ul><small>อ้างอิงเช็กอินทั้งหมด {item.source_log_ids?.length || 0} รายการ</small></details>
    {item.status !== 'resolved' && !editingFollowUp && <div className="manage-actions alert-actions">{item.status === 'new' && <button className="button secondary" disabled={busy} onClick={() => onTransition(item, 'acknowledge')}>รับทราบ</button>}{['new', 'acknowledged'].includes(item.status) && <button className="button primary" disabled={busy} onClick={() => onTransition(item, 'monitor')}>เริ่มติดตาม</button>}<button className="button ghost" disabled={busy} onClick={() => setEditingFollowUp(true)}>{item.follow_up_completed_at ? 'กำหนดวันติดตามครั้งถัดไป' : 'จัดการผู้ติดตาม'}</button>{!item.follow_up_completed_at && item.follow_up_due_date && <button className="button secondary" disabled={busy} onClick={()=>onTransition(item,'follow-up/complete',result)}>บันทึกว่าติดตามแล้ว</button>}</div>}
    {editingFollowUp && <FollowUpForm item={item} members={members} busy={busy} onCancel={() => setEditingFollowUp(false)} onSave={async (...args) => { if (await onSaveFollowUp(...args)) setEditingFollowUp(false); }} />}
  </article>;
}

export default function WellnessAlerts({ onOpenCheckIn, petId, members = [], api, refreshKey = 0 }) {
  const confirm = useConfirmation();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('active');
  const [busy, setBusy] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    try { const data = await api(`/pets/${petId}/wellness-alerts?status=${filter}&limit=50`); setItems(data.items || []); setError(''); }
    catch (problem) { setError(problem.message); }
    finally { setLoading(false); }
  }, [api, filter, petId]);
  useEffect(() => { load(); }, [load, refreshKey]);
  async function transition(item, action, result) {
    if (!await confirm({ title: action === 'follow-up/complete' ? 'บันทึกว่าติดตามแล้ว?' : action === 'monitor' ? 'เริ่มติดตามรายการนี้?' : 'รับทราบรายการนี้?', description: `${item.title || METRIC_NAMES[item.metric_key] || 'รายการสุขภาวะ'}${result ? ` · ผลการติดตาม: ${result}` : ''}`, confirmLabel: 'ยืนยัน' })) return;
    setBusy(item.id); setError('');
    try { await api(`/wellness-alerts/${item.id}/${action}`, { method: 'POST', body: JSON.stringify({result}) }); await load(); }
    catch (problem) { setError(problem.message); }
    finally { setBusy(''); }
  }
  async function saveFollowUp(item, input) {
    if (!await confirm({ title: 'บันทึกแผนติดตาม?', description: `ผู้ติดตาม: ${members.find(member => member.id === input.assigned_user_id)?.name || 'ยังไม่มอบหมาย'} · กำหนด: ${input.follow_up_due_date || 'ยังไม่ระบุ'}`, confirmLabel: 'ยืนยันบันทึก' })) return false;
    setBusy(item.id); setError('');
    try {
      await api(`/wellness-alerts/${item.id}/follow-up`, { method: 'PATCH', body: JSON.stringify({
        assigned_user_id: input.assigned_user_id || null,
        follow_up_due_date: input.follow_up_due_date || null,
        follow_up_note: input.follow_up_note || null,
      }) });
      await load();
      return true;
    } catch (problem) { setError(problem.message); return false; }
    finally { setBusy(''); }
  }
  return <section className="wellness-alerts" aria-labelledby="wellness-alert-title">
    <header className="alert-section-head"><div><h4 id="wellness-alert-title">การเปลี่ยนแปลงที่ควรสังเกต</h4><p>ระบบเปรียบเทียบเช็กอินกับค่าปกติส่วนตัว และจะแสดงเมื่อพบแนวโน้มต่อเนื่องเท่านั้น</p></div><div className="alert-filters" aria-label="กรองรายการติดตาม">{[['active', 'กำลังติดตาม'], ['resolved', 'กลับสู่ปกติ'], ['all', 'ทั้งหมด']].map(([value, label]) => <button type="button" key={value} className={filter === value ? 'filter-chip active' : 'filter-chip'} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div></header>
    {onOpenCheckIn && <button type="button" className="button secondary" onClick={onOpenCheckIn}>บันทึกข้อมูลเพิ่มเติมเพื่อติดตาม</button>}<p className="wellness-disclaimer">ข้อมูลนี้เป็นสัญญาณจากรูปแบบการบันทึก ไม่ใช่การวินิจฉัย หากกังวลหรือมีอาการฉุกเฉินควรติดต่อสัตวแพทย์</p>
    {error && <p className="form-error" role="alert">{error} <button onClick={load}>ลองอีกครั้ง</button></p>}
    {loading ? <p className="alert-loading" role="status">กำลังตรวจสอบการเปลี่ยนแปลง…</p> : items.length ? <div className="wellness-alert-list">{items.map(item => <AlertCard key={item.id} item={item} members={members} busy={busy === item.id} onTransition={transition} onSaveFollowUp={saveFollowUp} />)}</div> : !error && <div className="alert-empty" role="status"><strong>{filter === 'resolved' ? 'ยังไม่มีรายการที่กลับสู่ปกติ' : 'ยังไม่พบการเปลี่ยนแปลงต่อเนื่อง'}</strong><span>บันทึกเช็กอินต่อเนื่อง ระบบจะช่วยเปรียบเทียบกับค่าปกติส่วนตัว</span></div>}
  </section>;
}
