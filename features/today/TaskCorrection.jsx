"use client";
import Icon from "../../components/Icon.jsx";
import { useId, useState } from 'react';

export default function TaskCorrection({ task, busy, onReopen }) {
  const [reason, setReason] = useState('');
  const id = useId();
  return <details className="task-correction">
    <summary><span>แก้ไขการกดผิด</span><Icon name="down" size={16}/></summary>
    <form className="task-correction-form" onSubmit={event => { event.preventDefault(); if (!busy && reason.trim()) onReopen(task, reason.trim()); }}>
      <div className="task-correction-intro"><h4>เปิดงานกลับมาทำใหม่</h4><p id={`${id}-help`}>หากกดเสร็จหรือข้ามโดยไม่ได้ตั้งใจ ระบุเหตุผลเพื่อเปลี่ยนงานกลับเป็นรอทำ พร้อมเก็บประวัติการแก้ไข</p></div>
      <label htmlFor={`${id}-reason`}>เหตุผลที่เปิดงานใหม่ <span aria-hidden="true">*</span></label>
      <textarea id={`${id}-reason`} rows={2} required maxLength={500} disabled={busy} value={reason} onChange={event => setReason(event.target.value)} aria-describedby={`${id}-help ${id}-count`} placeholder="เช่น กดเสร็จโดยไม่ได้ตั้งใจ ยังไม่ได้ให้อาหาร" />
      <div className="task-correction-footer"><small id={`${id}-count`}>{reason.length}/500 ตัวอักษร · ผู้บันทึกหรือเจ้าของบ้านแก้ไขได้</small><button type="submit" className="button secondary" disabled={busy || !reason.trim()}>{busy ? 'กำลังเปิดงานใหม่…' : 'เปิดงานใหม่'}</button></div>
    </form>
  </details>;
}
