"use client";

import DateTimePicker from '../../components/DateTimePicker.jsx';
import { useConfirmation } from '../../components/ConfirmationProvider.jsx';
import { HEALTH_RECORD_OPTIONS } from '../../lib/form-options.js';
import { useCallback, useEffect, useRef, useState } from 'react';
import Pagination from '../../components/Pagination.jsx';

const TYPES = Object.fromEntries(HEALTH_RECORD_OPTIONS.map(([value,label])=>[value,label]));

export default function HealthRecords({ petId, api, onAdd }) {
  const confirm = useConfirmation();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState('');
  const [page, setPage] = useState(1);
  const listTopRef = useRef(null);
  const pageSize = 10;
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);

  const load = useCallback(() => api(`/pets/${petId}/health-records`).then(data => {
    setItems(data.items || []);
    setPage(1);
    setError('');
  }).catch(problem => setError(problem.message)), [api, petId]);
  useEffect(() => { load(); }, [load]);

  function startEdit(item) {
    const recorded = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(new Date(item.recorded_at)).replace(' ', 'T');
    setEditing({ id: item.id, title: item.title, details: item.details || '', numeric_value: item.numeric_value ?? '', unit: item.unit || '', recorded_at: recorded });
  }

  async function save(event) {
    event.preventDefault();
    if (!await confirm({ title: 'บันทึกการแก้ไขข้อมูลสุขภาพ?', description: `บันทึกการเปลี่ยนแปลงของ “${editing.title}” ให้สมาชิกในบ้านเห็น`, confirmLabel: 'ยืนยันบันทึก' })) return;
    setBusy(editing.id);
    setError('');
    try {
      await api(`/health-records/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: editing.title, details: editing.details, numeric_value: editing.numeric_value === '' ? null : Number(editing.numeric_value), unit: editing.unit || null, recorded_at: new Date(editing.recorded_at).toISOString() }),
      });
      setEditing(null);
      await load();
    } catch (problem) { setError(problem.message); }
    finally { setBusy(''); }
  }

  async function archive(item) {
    if (!await confirm({ title: 'ลบบันทึกสุขภาพ?', description: `ลบ “${item.title}” ออกจากรายการและข้อมูลสุขภาพที่ใช้งาน ประวัติการเปลี่ยนแปลงยังคงอยู่`, danger: true })) return;
    setBusy(item.id);
    setError('');
    try {
      await api(`/health-records/${item.id}/archive`, { method: 'POST', body: '{}' });
      await load();
    } catch (problem) { setError(problem.message); }
    finally { setBusy(''); }
  }

  return <section>
    <header className="subview-head">
      <div><h3>บันทึกเหตุการณ์สุขภาพ</h3><p>บันทึกเหตุการณ์ที่เกิดขึ้นแล้ว เช่น การชั่งน้ำหนัก การให้ยาตามคำสั่ง หรือการพบสัตวแพทย์</p></div>
      {onAdd && <button type="button" className="button primary" onClick={onAdd}>เพิ่มเหตุการณ์</button>}
    </header>
    {error && <p className="form-error" role="alert">{error} <button onClick={load}>ลองอีกครั้ง</button></p>}
    {items.length > 0 && <>
      <div className="record-list" ref={listTopRef}>
        {pageItems.map(item => <article key={item.id}>
          {editing?.id === item.id ? <form className="form-stack" onSubmit={save}>
            <label>ชื่อรายการ <span className="required-mark" aria-hidden="true">*</span><input required maxLength="160" value={editing.title} onChange={event => setEditing({ ...editing, title: event.target.value })} /></label>
            <label>วันและเวลา <span className="required-mark" aria-hidden="true">*</span><DateTimePicker required value={editing.recorded_at} onChange={event => setEditing({ ...editing, recorded_at: event.target.value })} /></label>
            {item.record_type === 'weight' && <div className="form-grid">
              <label>ค่า <span className="required-mark" aria-hidden="true">*</span><input required type="number" min="0" step="0.001" value={editing.numeric_value} onChange={event => setEditing({ ...editing, numeric_value: event.target.value })} /></label>
              <label>หน่วย <span className="required-mark" aria-hidden="true">*</span><input required maxLength="30" value={editing.unit} onChange={event => setEditing({ ...editing, unit: event.target.value })} /></label>
            </div>}
            <label>รายละเอียด<textarea maxLength="5000" value={editing.details} onChange={event => setEditing({ ...editing, details: event.target.value })} /></label>
            <div className="form-actions"><button type="button" className="button ghost" onClick={() => setEditing(null)}>ยกเลิก</button><button className="button primary" disabled={busy === item.id || !editing.title.trim() || !editing.recorded_at || (item.record_type === 'weight' && (!editing.numeric_value || Number(editing.numeric_value) < 0 || !editing.unit.trim()))}>บันทึกการแก้ไข</button></div>
          </form> : <>
            <strong>{item.title}</strong><span>{TYPES[item.record_type]}</span><p>{item.details}</p>
            {item.numeric_value != null && <b>{item.numeric_value} {item.unit}</b>}
            <time>{new Date(item.recorded_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}</time>
            {item.can_edit && <div className="manage-actions"><button className="button ghost" onClick={() => startEdit(item)}>แก้ไข</button><button className="button subtle-danger" disabled={busy === item.id} onClick={() => archive(item)}>ลบ</button></div>}
          </>}
        </article>)}
      </div>
      <Pagination page={page} pageSize={pageSize} total={items.length} onPageChange={setPage} scrollRef={listTopRef} />
    </>}
    {items.length === 0 && !error && <div className="empty-state"><h3>ยังไม่มีเหตุการณ์สุขภาพ</h3><p>บันทึกเหตุการณ์ที่เกิดขึ้นแล้วเพื่อเก็บไว้ในประวัติของสัตว์ตัวนี้</p>{onAdd && <button className="button secondary" onClick={onAdd}>เพิ่มเหตุการณ์แรก</button>}</div>}
    <span hidden>{Object.keys(TYPES).join(' ')}</span>
  </section>;
}
