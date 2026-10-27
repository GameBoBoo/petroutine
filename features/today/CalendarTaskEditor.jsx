"use client";
import { useState } from 'react';
import Modal from '../../components/Modal.jsx';
import { useConfirmation } from '../../components/ConfirmationProvider.jsx';
import DateTimePicker from '../../components/DateTimePicker.jsx';
import SelectField from '../../components/SelectField.jsx';
export default function CalendarTaskEditor({ event, householdId, members, api, onClose, onSaved }) {
  const confirm = useConfirmation();
  const [time,setTime]=useState(new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(event.scheduled_at)).replace(' ','T'));
  const [assignee,setAssignee]=useState(event.assigned_user_id||'');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
  async function save(action){
    if (!await confirm({ title: action === 'reschedule' ? 'ยืนยันเลื่อนเวลางาน?' : 'ยืนยันเปลี่ยนผู้รับผิดชอบ?', description: `“${event.title}” · ${action === 'reschedule' ? new Date(`${time}:00+07:00`).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' }) : members.find(member => member.id === assignee)?.name || 'ทุกคนในบ้าน'} · เปลี่ยนเฉพาะงานครั้งนี้`, confirmLabel: 'ยืนยันการเปลี่ยนแปลง' })) return;
    setBusy(true);setError('');try{let task=event;
    if(!task.id){const r=await api(`/households/${householdId}/calendar/materialize`,{method:'POST',body:JSON.stringify({routine_id:event.routine_id,scheduled_at:event.scheduled_at})});task=r.task;}
    await api(`/tasks/${task.id}`,{method:'PATCH',headers:{'idempotency-key':crypto.randomUUID()},body:JSON.stringify({action,expected_version:task.mutation_version,...(action==='reschedule'?{scheduled_at:new Date(`${time}:00+07:00`).toISOString()}:{assigned_user_id:assignee||null})})});await onSaved();onClose();
  }catch(e){setError(e.message);}finally{setBusy(false);}}
  return <Modal title={event.title} description="แก้เฉพาะงานครั้งนี้ ตารางกิจวัตรครั้งอื่นยังเป็นเวลาเดิม" onClose={onClose}><div className="form-stack calendar-task-editor"><div className="calendar-edit-section"><label>วันที่และเวลา<DateTimePicker value={time} onChange={e=>setTime(e.target.value)}/></label><button className="button secondary" disabled={busy||!time} onClick={()=>save('reschedule')}>ยืนยันเลื่อนเฉพาะครั้งนี้</button></div><div className="calendar-edit-section"><label>ผู้รับผิดชอบ<SelectField value={assignee} onChange={e=>setAssignee(e.target.value)}><option value="">ทุกคนในบ้าน</option>{members.map(m=><option value={m.id} key={m.id} data-description={m.email}>{m.name}</option>)}</SelectField></label><button className="button secondary" disabled={busy} onClick={()=>save('reassign')}>ยืนยันผู้รับผิดชอบเฉพาะครั้งนี้</button></div>{error&&<p className="form-error" role="alert">{error} กรุณาปิดแล้วเปิดรายการล่าสุดอีกครั้ง</p>}</div></Modal>;
}
