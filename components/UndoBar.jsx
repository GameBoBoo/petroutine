"use client";

export default function UndoBar({ activity, message = 'บันทึกการเปลี่ยนแปลงแล้ว', onUndo, onDismiss, busy = false }) {
  if (!activity) return null;
  return <div className="undo-bar" aria-live="polite" role="status"><span>{message}</span><button type="button" onClick={onUndo} disabled={busy}>ย้อนกลับ</button><button type="button" className="undo-dismiss" onClick={onDismiss} aria-label="ปิดข้อความ">×</button></div>;
}
