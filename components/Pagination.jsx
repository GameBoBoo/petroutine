"use client";

export default function Pagination({ page, pageSize = 10, total, onPageChange, scrollRef, disabled = false }) {
  const pageCount = Math.ceil(total / pageSize);
  if (pageCount <= 1) return null;
  function go(nextPage) {
    onPageChange(nextPage);
    requestAnimationFrame(() => scrollRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  return <nav className="pagination" aria-label="เปลี่ยนหน้ารายการ">
    <span>{first}–{last} จาก {total}</span>
    <div><button type="button" className="button secondary" disabled={disabled || page <= 1} onClick={() => go(page - 1)}>ก่อนหน้า</button>
      <span aria-live="polite">หน้า {page} / {pageCount}</span>
      <button type="button" className="button secondary" disabled={disabled || page >= pageCount} onClick={() => go(page + 1)}>ถัดไป</button></div>
  </nav>;
}
