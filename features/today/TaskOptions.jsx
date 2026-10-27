"use client";
import SelectField from '../../components/SelectField.jsx';
import DateTimePicker from '../../components/DateTimePicker.jsx';
import Icon from '../../components/Icon.jsx';

export default function TaskOptions({ task, members, busy, currentUserId, scheduledAt, setScheduledAt, assignee, setAssignee, notes, setNotes, onReschedule, onReassign }) {
  const timeChanged = scheduledAt && new Date(`${scheduledAt}:00+07:00`).getTime() !== new Date(task.scheduled_at).getTime();
  return <details className="task-options">
    <summary><span>ตัวเลือกงาน</span><Icon name="down" size={16}/></summary>
    <div className="task-options-body">
      <p className="task-options-hint">ปรับเฉพาะงานครั้งนี้ กิจวัตรครั้งอื่นยังใช้ตารางเดิม</p>
      <div className="task-options-grid">
        <section className="task-option-section"><header><Icon name="clock" size={18}/><h4>เลื่อนเวลา</h4></header><label>วันและเวลาใหม่<DateTimePicker value={scheduledAt} disabled={busy} onChange={event=>setScheduledAt(event.target.value)}/></label><button type="button" className="button secondary" disabled={busy||!timeChanged} onClick={()=>onReschedule(task,new Date(`${scheduledAt}:00+07:00`).toISOString())}>บันทึกเวลาใหม่</button></section>
        <section className="task-option-section"><header><Icon name="user" size={18}/><h4>ผู้รับผิดชอบ</h4></header><label>มอบหมายงานให้<SelectField value={assignee} disabled={busy} onChange={event=>setAssignee(event.target.value)}><option value="">ทุกคนในบ้าน</option>{members.map(member=><option key={member.id} value={member.id} data-description={member.email}>{member.name}</option>)}</SelectField></label><div className="task-assignee-actions"><button type="button" className="button secondary" disabled={busy||assignee===(task.assigned_user_id||'')} onClick={()=>onReassign(task,assignee||null)}>บันทึกผู้รับผิดชอบ</button>{currentUserId&&task.assigned_user_id!==currentUserId&&<button type="button" className="button ghost" disabled={busy} onClick={()=>onReassign(task,currentUserId)}>รับงานนี้เอง</button>}</div></section>
      </div>
      <label className="task-option-notes">หมายเหตุเมื่อทำเสร็จ <span className="task-option-optional">(ไม่จำเป็น)</span><textarea rows={2} maxLength={1000} disabled={busy} value={notes} onChange={event=>setNotes(event.target.value)} placeholder="เช่น เติมน้ำใหม่และล้างถ้วยแล้ว"/><span className="task-option-help">หมายเหตุจะบันทึกพร้อมงานเมื่อกด “เสร็จแล้ว”</span></label>
    </div>
  </details>;
}
