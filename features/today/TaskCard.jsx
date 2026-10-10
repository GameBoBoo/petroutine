"use client";

import { useState } from 'react';
import Icon from '../../components/Icon.jsx';

export default function TaskCard({ task, members = [], busy, onComplete, onSkip, onReschedule, onReassign }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('ไม่สะดวกตามเวลา');
  const [scheduledAt, setScheduledAt] = useState(new Date(task.scheduled_at).toISOString().slice(0, 16));
  const done = ['completed', 'skipped'].includes(task.display_status || task.status);
  return <article className={`task-card task-${task.display_status || task.status}`}>
    <div className="task-time"><Icon name="clock" size={17} /><time dateTime={task.scheduled_at}>{new Date(task.scheduled_at).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' })}</time></div>
    <div className="task-details"><h3>{task.title}</h3><p>{task.pet_name}</p>{task.notes && <small>หมายเหตุ: {task.notes}</small>}
      {!done && <button type="button" className="task-note-toggle" aria-expanded={noteOpen} onClick={() => setNoteOpen(value => !value)}>เพิ่มหมายเหตุ</button>}
      {noteOpen && !done && <label className="inline-note">หมายเหตุ (ไม่บังคับ)<textarea maxLength={1000} value={notes} onChange={event => setNotes(event.target.value)} /></label>}
      {!done && <details className="task-more"><summary>ตัวเลือกงาน</summary><div className="task-edit-grid"><label>เลื่อนเวลา<input type="datetime-local" value={scheduledAt} onChange={event => setScheduledAt(event.target.value)} /></label><button type="button" disabled={busy} onClick={() => onReschedule(task, new Date(scheduledAt).toISOString())}>เลื่อนเวลา</button><label>เปลี่ยนผู้รับผิดชอบ<select value={task.assigned_user_id || ''} onChange={event => onReassign(task, event.target.value || null)}><option value="">ทุกคน</option>{members.map(member => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label></div></details>}
    </div>
    <div className="task-actions">{done ? <span className="task-done-icon"><Icon name="check" /></span> : <><button className="button complete" disabled={busy} onClick={() => onComplete(task, notes)}><Icon name="check" size={17} />เสร็จแล้ว</button><label className="skip-reason"><span className="sr-only">เหตุผลที่ข้าม</span><select value={reason} onChange={event => setReason(event.target.value)}><option>ไม่สะดวกตามเวลา</option><option>สัตว์เลี้ยงไม่พร้อม</option><option>ทำแล้วแต่ไม่ได้บันทึก</option><option>อื่น ๆ</option></select></label><button className="button skip" disabled={busy} onClick={() => onSkip(task, reason, notes)}>ข้าม</button></>}</div>
  </article>;
}
