"use client";
import SelectField from '../../components/SelectField.jsx';
import { useMemo, useState } from 'react';
import TaskCard from './TaskCard.jsx';
import TodayCareDoodle from './TodayCareDoodle.jsx';
import AiCareBrief from './AiCareBrief.jsx';

function Section({ title, tasks, sectionClass = '', ...props }) {
  if (!tasks.length) return null;
  return <section className={`today-section ${sectionClass}`}><h2>{title}<span>{tasks.length}</span></h2><div className="task-list">{tasks.map(task => <TaskCard key={`${task.source_type || 'task'}:${task.id}`} task={task} {...props} />)}</div></section>;
}

const taskStatus = task => task.display_status || task.status;
const taskTime = task => task.all_day ? 'ทั้งวัน' : new Date(task.scheduled_at).toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' });

export default function TodayView({ tasks = [], pets = [], members = [], currentUserId, busyId, loading = false, lastSynced, onRefresh, onReopen, onComplete, onCompleteFollowUp, onCompleteHealth, onSkipHealth, onReopenHealth, onSkip, onReschedule, onReassign, onAdd, aiCare }) {
  const [scope, setScope] = useState('everyone');
  const [petId, setPetId] = useState('all');
  const [status, setStatus] = useState('all');
  const filtered = useMemo(() => tasks.filter(task => {
    const state = taskStatus(task);
    return (scope === 'everyone' || !task.assigned_user_id || task.assigned_user_id === currentUserId)
      && (petId === 'all' || task.pet_id === petId)
      && (status === 'all' || state === status || (status === 'done' && ['completed', 'skipped'].includes(state)));
  }), [tasks, scope, petId, status, currentUserId]);
  const attention = filtered.filter(task => taskStatus(task) === 'overdue');
  const scheduledHealth = filtered.filter(task => task.read_only && ['passport_due', 'health_appointment', 'wellness_follow_up'].includes(task.source_type) && !['completed', 'skipped'].includes(taskStatus(task)));
  const upcoming = filtered.filter(task => !task.read_only && taskStatus(task) === 'pending');
  const recorded = filtered.filter(task => task.read_only && !['passport_due', 'health_appointment', 'wellness_follow_up'].includes(task.source_type));
  const completed = filtered.filter(task => ['completed', 'skipped'].includes(taskStatus(task)) && (!task.read_only || ['passport_due', 'health_appointment', 'wellness_follow_up'].includes(task.source_type)));
  const actionable = tasks.filter(task => !task.read_only || ['passport_due', 'health_appointment', 'wellness_follow_up'].includes(task.source_type));
  const doneCount = actionable.filter(task => ['completed', 'skipped'].includes(taskStatus(task))).length;
  const pendingCount = actionable.filter(task => ['pending', 'overdue'].includes(taskStatus(task))).length;
  const overdueCount = actionable.filter(task => taskStatus(task) === 'overdue').length;
  const progress = actionable.length ? Math.round(doneCount / actionable.length * 100) : 0;
  const nextTasks = tasks.filter(task => ['pending', 'overdue'].includes(taskStatus(task)) && (!task.read_only || ['passport_due', 'health_appointment', 'wellness_follow_up'].includes(task.source_type))).sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at)).slice(0, 3);
  const cardProps = { members, currentUserId, onReopen, busy: Boolean(busyId), onComplete, onCompleteFollowUp, onCompleteHealth, onSkipHealth, onReopenHealth, onSkip, onReschedule, onReassign };

  return <div className="today-workflow today-dashboard">
    <div className="today-dashboard-top">
      <section className="today-welcome" aria-labelledby="today-welcome-title">
        <div className="today-welcome-copy"><span className="today-welcome-kicker">A LITTLE CARE GOES A LONG WAY</span><h2 id="today-welcome-title">{doneCount ? 'วันนี้ดูแลกันได้ดีมากเลย' : pendingCount ? 'วันนี้เริ่มดูแลไปด้วยกัน' : 'วันนี้พักใจได้สบาย ๆ'}</h2><p>{actionable.length ? `จัดการแล้ว ${doneCount} จาก ${actionable.length} รายการ ${pendingCount ? 'ยังมีงานที่รอเราอยู่' : 'ครบแล้ววันนี้'}` : 'เริ่มต้นวันดี ๆ ด้วยการเพิ่มงานดูแลเพื่อนในบ้าน'}</p><div className="today-welcome-actions"><a className="today-welcome-link" href="#today-tasks">ดูงานวันนี้ <span aria-hidden="true">→</span></a><span><strong>{progress}%</strong> ของวันนี้</span></div></div><TodayCareDoodle />
      </section>
      <section className="today-next-card" aria-labelledby="today-next-title"><div className="today-card-head"><div><span className="section-kicker">รายการถัดไป</span><h2 id="today-next-title">สิ่งที่ต้องดูแล</h2><p>มองงานถัดไปได้ในแวบเดียว</p></div><a href="#today-tasks">ดูทั้งหมด <span aria-hidden="true">→</span></a></div>{nextTasks.length ? <ol className="today-next-list">{nextTasks.map(task => <li key={`${task.source_type || 'task'}:${task.id}`}><time dateTime={task.scheduled_at}>{taskTime(task)}</time><span><strong>{task.title}</strong><small>{task.pet_name || 'เพื่อนในบ้าน'}{taskStatus(task) === 'overdue' ? ' · เลยเวลา' : ''}</small></span></li>)}</ol> : <p className="today-next-empty">ยังไม่มีงานที่รอดูแลในวันนี้</p>}</section>
    </div>
    <section className="today-brand-summary" aria-label="สรุปงานดูแล"><div><span>งานที่รอดูแล</span><strong>{pendingCount}<small>รายการ</small></strong></div><div><span>เลยเวลาแล้ว</span><strong>{overdueCount}<small>รายการ</small></strong></div><div><span>จัดการแล้ว</span><strong>{doneCount}<small>รายการ</small></strong></div></section>
    {aiCare && <AiCareBrief {...aiCare} pets={pets} />}
    <section className="today-task-area" id="today-tasks"><header className="today-heading"><div><span className="section-kicker">ดูแลประจำวัน</span><h2>งานดูแลวันนี้</h2><p>สิ่งที่ต้องทำ นัดหมาย และรายการที่บันทึกในวันนี้</p></div><button className="button primary" onClick={onAdd}>เพิ่มรายการ</button></header><div className="sync-summary"><span role="status">{lastSynced ? `อัปเดตล่าสุด ${lastSynced.toLocaleTimeString('th-TH',{timeZone:'Asia/Bangkok',hour:'2-digit',minute:'2-digit'})}` : 'กำลังตรวจข้อมูล'}</span><button className="button ghost" disabled={loading} onClick={onRefresh}>อัปเดตข้อมูล</button></div><div className="today-filters"><div role="group" aria-label="ผู้รับผิดชอบ"><button className={scope === 'mine' ? 'filter-chip active' : 'filter-chip'} onClick={() => setScope('mine')}>งานของฉัน</button><button className={scope === 'everyone' ? 'filter-chip active' : 'filter-chip'} onClick={() => setScope('everyone')}>ทุกคน</button></div><label>สัตว์เลี้ยง<SelectField value={petId} onChange={event => setPetId(event.target.value)}><option value="all">ทุกตัว</option>{pets.map(pet => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</SelectField></label><label>สถานะ<SelectField value={status} onChange={event => setStatus(event.target.value)}><option value="all">ทุกสถานะ</option><option value="overdue">เลยเวลา</option><option value="pending">กำลังจะถึง</option><option value="done">เสร็จ/บันทึก/ข้าม</option></SelectField></label></div>{loading && !tasks.length ? <div className="skeleton-stack" aria-busy="true" role="status" aria-label="กำลังโหลดงานวันนี้">{[0, 1, 2].map(item => <div className="skeleton-task" key={item}><i /><span><i /><i /></span><i /></div>)}</div> : !filtered.length ? <div className="empty-state"><h3>ไม่พบงานตามตัวกรอง</h3><p>ลองเปลี่ยนผู้รับผิดชอบ สัตว์เลี้ยง หรือสถานะ</p></div> : <><Section title="เลยเวลา · ต้องดูแลก่อน" sectionClass="today-overdue-section" tasks={attention} busy={attention.some(task => task.id === busyId)} {...cardProps} /><Section title="กำหนดสุขภาพวันนี้" tasks={scheduledHealth} busy={scheduledHealth.some(task => task.id === busyId)} {...cardProps} /><Section title="รายการถัดไป" tasks={upcoming} busy={upcoming.some(task => task.id === busyId)} {...cardProps} /><Section title="บันทึกวันนี้" tasks={recorded} {...cardProps} /><details className="today-completed"><summary>เสร็จแล้ว ({completed.length})</summary><Section title="เสร็จแล้ว" tasks={completed} {...cardProps} /></details></>}</section>
  </div>;
}
