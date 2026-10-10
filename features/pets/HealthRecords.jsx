"use client";

import { useCallback, useEffect, useState } from 'react';

const TYPES = { weight: 'น้ำหนัก', vaccination: 'วัคซีน', medication: 'บันทึกยา', appointment: 'นัดหมาย', observation: 'ข้อสังเกต', other: 'อื่น ๆ' };

export default function HealthRecords({ petId, api }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState('');
  const load = useCallback(() => api(`/pets/${petId}/health-records`).then(data => { setItems(data.items || []); setError(''); }).catch(problem => setError(problem.message)), [api, petId]);
  useEffect(() => { load(); }, [load]);
  function startEdit(item) {
    const recorded = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(item.recorded_at)).replace(' ', 'T');
    setEditing({ id: item.id, title: item.title, details: item.details || '', numeric_value: item.numeric_value ?? '', unit: item.unit || '', recorded_at: recorded });
  }
  async function save(event) {
    event.preventDefault(); setBusy(editing.id); setError('');
    try { await api(`/health-records/${editing.id}`, { method: 'PATCH', body: JSON.stringify({ title: editing.title, details: editing.details, numeric_value: editing.numeric_value === '' ? null : Number(editing.numeric_value), unit: editing.unit || null, recorded_at: new Date(editing.recorded_at).toISOString() }) }); setEditing(null); await load(); }
    catch (problem) { setError(problem.message); }
    finally { setBusy(''); }
  }
  async function archive(item) {
    if (!window.confirm(`เก็บข้อมูล “${item.title}” ออกจากรายการที่ใช้งานหรือไม่?`)) return;
    setBusy(item.id); setError('');
    try { await api(`/health-records/${item.id}/archive`, { method: 'POST', body: '{}' }); await load(); }
    catch (problem) { setError(problem.message); }
    finally { setBusy(''); }
  }
  return <section><header className="subview-head"><div><h3>ข้อมูลสุขภาพ</h3><p>ข้อมูลที่ผู้ใช้กรอกเอง ไม่ใช่คำวินิจฉัยหรือคำแนะนำการรักษา</p></div></header>{error && <p className="form-error" role="alert">{error} <button onClick={load}>ลองอีกครั้ง</button></p>}{items.length ? <div className="record-list">{items.map(item => <article key={item.id}>{editing?.id === item.id ? <form className="form-stack" onSubmit={save}><label>ชื่อรายการ<input required maxLength="160" value={editing.title} onChange={event => setEditing({ ...editing, title: event.target.value })} /></label><label>วันและเวลา<input required type="datetime-local" value={editing.recorded_at} onChange={event => setEditing({ ...editing, recorded_at: event.target.value })} /></label>{item.record_type === 'weight' && <div className="form-grid"><label>ค่า<input required type="number" min="0" step="0.001" value={editing.numeric_value} onChange={event => setEditing({ ...editing, numeric_value: event.target.value })} /></label><label>หน่วย<input required maxLength="30" value={editing.unit} onChange={event => setEditing({ ...editing, unit: event.target.value })} /></label></div>}<label>รายละเอียด<textarea maxLength="5000" value={editing.details} onChange={event => setEditing({ ...editing, details: event.target.value })} /></label><div className="form-actions"><button type="button" className="button ghost" onClick={() => setEditing(null)}>ยกเลิก</button><button className="button primary" disabled={busy === item.id}>บันทึกการแก้ไข</button></div></form> : <><strong>{item.title}</strong><span>{TYPES[item.record_type]}</span><p>{item.details}</p>{item.numeric_value != null && <b>{item.numeric_value} {item.unit}</b>}<time>{new Date(item.recorded_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}</time>{item.can_edit && <div className="manage-actions"><button className="button ghost" onClick={() => startEdit(item)}>แก้ไข</button><button className="button subtle-danger" disabled={busy === item.id} onClick={() => archive(item)}>เก็บข้อมูลเก่า</button></div>}</>}</article>)}</div> : !error && <div className="empty-state"><h3>ยังไม่มีข้อมูลสุขภาพ</h3><p>เพิ่มได้จากเมนู “เพิ่มข้อมูลสุขภาพ”</p></div>}<span hidden>{Object.keys(TYPES).join(' ')}</span></section>;
}
