"use client";

import { useMemo, useState } from 'react';
import TaskCard from './TaskCard.jsx';

function Section({ title, tasks, ...props }) {
  if (!tasks.length) return null;
  return <section className="today-section"><h2>{title}<span>{tasks.length}</span></h2><div className="task-list">{tasks.map(task => <TaskCard key={task.id} task={task} {...props} />)}</div></section>;
}

export default function TodayView({ tasks = [], pets = [], members = [], currentUserId, busyId, onComplete, onSkip, onReschedule, onReassign, onAdd }) {
  const [scope, setScope] = useState('everyone');
  const [petId, setPetId] = useState('all');
  const [status, setStatus] = useState('all');
  const filtered = useMemo(() => tasks.filter(task => {
    const taskStatus = task.display_status || task.status;
    return (scope === 'everyone' || task.assigned_user_id === currentUserId)
      && (petId === 'all' || task.pet_id === petId)
      && (status === 'all' || taskStatus === status || (status === 'done' && ['completed', 'skipped'].includes(taskStatus)));
  }), [tasks, scope, petId, status, currentUserId]);
  const attention = filtered.filter(task => (task.display_status || task.status) === 'overdue');
  const upcoming = filtered.filter(task => (task.display_status || task.status) === 'pending');
  const completed = filtered.filter(task => ['completed', 'skipped'].includes(task.display_status || task.status));
  const cardProps = { members, onComplete, onSkip, onReschedule, onReassign };
  return <div className="today-workflow"><header className="today-heading"><div><span className="section-kicker">TODAY</span><h2>งานดูแลวันนี้</h2><p>สิ่งที่ต้องทำ เรียงให้เห็นสิ่งเร่งด่วนก่อน</p></div><button className="button primary" onClick={onAdd}>เพิ่มรายการ</button></header><div className="today-filters"><div role="group" aria-label="ผู้รับผิดชอบ"><button className={scope === 'mine' ? 'filter-chip active' : 'filter-chip'} onClick={() => setScope('mine')}>งานของฉัน</button><button className={scope === 'everyone' ? 'filter-chip active' : 'filter-chip'} onClick={() => setScope('everyone')}>ทุกคน</button></div><label>สัตว์เลี้ยง<select value={petId} onChange={event => setPetId(event.target.value)}><option value="all">ทุกตัว</option>{pets.map(pet => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</select></label><label>สถานะ<select value={status} onChange={event => setStatus(event.target.value)}><option value="all">ทุกสถานะ</option><option value="overdue">เลยเวลา</option><option value="pending">กำลังจะถึง</option><option value="done">เสร็จ/ข้าม</option></select></label></div>{!filtered.length ? <div className="empty-state"><h3>ไม่พบงานตามตัวกรอง</h3><p>ลองเปลี่ยนผู้รับผิดชอบ สัตว์เลี้ยง หรือสถานะ</p></div> : <><Section title="ต้องดูแลก่อน" tasks={attention} busy={attention.some(task => task.id === busyId)} {...cardProps} /><Section title="รายการถัดไป" tasks={upcoming} busy={upcoming.some(task => task.id === busyId)} {...cardProps} /><details className="today-completed"><summary>เสร็จแล้ว ({completed.length})</summary><Section title="เสร็จแล้ว" tasks={completed} {...cardProps} /></details></>}</div>;
}
