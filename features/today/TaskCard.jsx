"use client";
import SelectField from '../../components/SelectField.jsx';
import TaskOptions from './TaskOptions.jsx';
import TaskCorrection from './TaskCorrection.jsx';

import { useEffect, useState } from 'react';
import Icon from '../../components/Icon.jsx';

const bangkokDateTime = value => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date(value)).replace(' ', 'T');

export default function TaskCard({ task, members = [], busy, currentUserId, onReopen, onComplete, onCompleteFollowUp, onCompleteHealth, onSkipHealth, onReopenHealth, onSkip, onReschedule, onReassign }) {
  const [notes,setNotes]=useState('');
  const [assignee,setAssignee]=useState(task.assigned_user_id || '');
  const [reason, setReason] = useState('ไม่สะดวกตามเวลา');
  const [otherReason, setOtherReason] = useState('');
  const [scheduledAt, setScheduledAt] = useState(bangkokDateTime(task.scheduled_at));
  useEffect(() => { setAssignee(task.assigned_user_id || ''); setScheduledAt(bangkokDateTime(task.scheduled_at)); }, [task.assigned_user_id, task.scheduled_at]);
  const done = ['completed', 'skipped'].includes(task.display_status || task.status);
  const scheduledHealth = task.read_only && ['passport_due', 'health_appointment', 'wellness_follow_up'].includes(task.source_type);
  const actionableHealth = ['passport_due', 'health_appointment'].includes(task.source_type);
  const canReopenHealth = done && actionableHealth && (task.completed_by === currentUserId || members.some(member => member.id === currentUserId && member.role === 'owner'));
  const overdue = (task.display_status || task.status) === 'overdue';
  const overdueMinutes = Math.max(1, Math.floor((Date.now() - new Date(task.scheduled_at).getTime()) / 60000));
  const overdueText = overdueMinutes >= 1440
    ? `${Math.floor(overdueMinutes / 1440)} วัน ${Math.floor((overdueMinutes % 1440) / 60)} ชม.`
    : overdueMinutes >= 60
      ? `${Math.floor(overdueMinutes / 60)} ชม. ${overdueMinutes % 60} นาที`
      : `${overdueMinutes} นาที`;
  return <article className={`task-card task-${task.display_status || task.status}${actionableHealth ? ' task-health' : ''}`}>
    <div className={`task-time${overdue ? ' task-time-overdue' : ''}`}>{overdue ? <Icon name="alert" size={17} /> : <Icon name="clock" size={17} />}<time dateTime={task.scheduled_at}>{task.all_day ? 'ทั้งวัน' : new Date(task.scheduled_at).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' })}</time></div>
    <div className="task-details"><div className="task-title-row"><h3>{task.title}</h3>{overdue && <span className="task-overdue-badge"><Icon name="alert" size={13} />เลยเวลา {overdueText}</span>}</div><p className="task-pet-label"><Icon name="paw" size={16} /><strong>{task.pet_name || 'ไม่ระบุสัตว์เลี้ยง'}</strong>{task.read_only && task.source_label ? ` · ${task.source_label}` : ''}</p>
      <p className="muted">{done ? `บันทึกโดย ${task.completed_by_name || members.find(m=>m.id===task.completed_by)?.name || 'ไม่ระบุ'}` : `ผู้รับผิดชอบ: ${members.find(m=>m.id===task.assigned_user_id)?.name || 'ทุกคน'}`}</p>{done && (task.skip_reason || task.notes) && <p className="task-outcome-note"><strong>{task.status === 'skipped' || task.display_status === 'skipped' ? 'เหตุผลที่ข้าม:' : 'หมายเหตุ:'}</strong> {task.skip_reason && task.skip_reason !== task.notes ? `${task.skip_reason}${task.notes ? ` · ${task.notes}` : ''}` : task.notes || task.skip_reason}</p>}
    </div>
    <div className="task-actions">{scheduledHealth ? task.source_type === 'wellness_follow_up' ? done ? <span className="status status-completed">ติดตามแล้ว</span> : <button type="button" className="button complete" disabled={busy} onClick={() => onCompleteFollowUp(task)}><Icon name="check" size={17} />เสร็จแล้ว</button> : done ? <span className={`status status-${task.status}`}>{task.status === 'skipped' ? 'ข้ามแล้ว' : 'เสร็จแล้ว'}</span> : <><button type="button" className="button complete" disabled={busy} onClick={() => onCompleteHealth(task)}><Icon name="check" size={17} />เสร็จแล้ว</button><label className="skip-reason"><span className="sr-only">เหตุผลที่ข้าม</span><SelectField value={reason} onChange={event => setReason(event.target.value)}><option>ไม่สะดวกตามเวลา</option><option>สัตว์เลี้ยงไม่พร้อม</option><option>ทำแล้วแต่ไม่ได้บันทึก</option><option>อื่น ๆ</option></SelectField></label>{reason === 'อื่น ๆ' && <label className="skip-other-reason"><span className="sr-only">ระบุเหตุผลเพิ่มเติม</span><input value={otherReason} onChange={event => setOtherReason(event.target.value)} maxLength={160} placeholder="ระบุเหตุผลเพิ่มเติม" aria-label="ระบุเหตุผลเพิ่มเติม" /></label>}<button type="button" className="button skip" disabled={busy || (reason === 'อื่น ๆ' && !otherReason.trim())} onClick={() => onSkipHealth(task, reason === 'อื่น ๆ' ? otherReason.trim() : reason)}>ข้าม</button></> : done ? <span className="task-done-icon"><Icon name={task.display_status === 'skipped' || task.status === 'skipped' ? 'skip' : 'check'} /></span> : <><button className="button complete" disabled={busy} onClick={() => onComplete(task, notes || null)}><Icon name="check" size={17} />เสร็จแล้ว</button><label className="skip-reason"><span className="sr-only">เหตุผลที่ข้าม</span><SelectField value={reason} onChange={event => setReason(event.target.value)}><option>ไม่สะดวกตามเวลา</option><option>สัตว์เลี้ยงไม่พร้อม</option><option>ทำแล้วแต่ไม่ได้บันทึก</option><option>อื่น ๆ</option></SelectField></label>{reason === 'อื่น ๆ' && <label className="skip-other-reason"><span className="sr-only">ระบุเหตุผลเพิ่มเติม</span><input value={otherReason} onChange={event => setOtherReason(event.target.value)} maxLength={1000} placeholder="ระบุเหตุผลเพิ่มเติม" aria-label="ระบุเหตุผลเพิ่มเติม" /></label>}<button className="button skip" disabled={busy || (reason === 'อื่น ๆ' && !otherReason.trim())} onClick={() => onSkip(task, reason === 'อื่น ๆ' ? otherReason.trim() : reason, reason === 'อื่น ๆ' ? otherReason.trim() : '')}>ข้าม</button></>}{canReopenHealth && <button type="button" className="button ghost" disabled={busy} onClick={() => onReopenHealth(task)}>แก้ไขการกดผิด</button>}</div>
    {done && !task.read_only && onReopen && <TaskCorrection task={task} busy={busy} onReopen={onReopen}/> }
    {!done && !scheduledHealth && !task.read_only && <TaskOptions task={task} members={members} busy={busy} currentUserId={currentUserId} scheduledAt={scheduledAt} setScheduledAt={setScheduledAt} assignee={assignee} setAssignee={setAssignee} notes={notes} setNotes={setNotes} onReschedule={onReschedule} onReassign={onReassign}/> }
  </article>;
}
