"use client";
import SearchField from '../../components/SearchField.jsx';

import SelectField from '../../components/SelectField.jsx';
import DatePicker from '../../components/DatePicker.jsx';
import Pagination from '../../components/Pagination.jsx';
import { useCallback, useEffect, useRef, useState } from 'react';

const PAGE_SIZE = 25;
const SOURCE_NAMES = {
  task: 'งานตามกิจวัตร', care_entry: 'ดูแลนอกตาราง', health_record: 'ข้อมูลสุขภาพ',
  passport_entry: 'สมุดสุขภาพ', wellness_log: 'เช็กอินรายวัน', wellness_alert: 'การเปลี่ยนแปลงสุขภาวะ', activity: 'การเปลี่ยนแปลง',
};

export default function PetTimeline({ petId, api, focusSource = null }) {
  const [pages, setPages] = useState([]);
  const [cursors, setCursors] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(() => ({ q: '', source_type: focusSource?.type === 'wellness' ? 'wellness_log' : focusSource?.type || '', from: focusSource?.date ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Bangkok' }).format(new Date(focusSource.date)) : '', to: focusSource?.date ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Bangkok' }).format(new Date(focusSource.date)) : '' }));
  const listTopRef = useRef(null);

  const fetchPage = useCallback(async (next = null) => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE) });
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    if (next) params.set('cursor', next);
    try {
      const data = await api(`/pets/${petId}/timeline?${params}`);
      setError('');
      return data;
    } catch (problem) {
      setError(problem.message);
      return null;
    }
  }, [api, petId, filters]);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    setPage(1);
    setPages([]);
    setCursors([]);
    const data = await fetchPage();
    if (data) {
      setPages([data.items || []]);
      setCursors([data.next_cursor || null]);
    }
    setLoading(false);
  }, [fetchPage]);
  useEffect(() => { loadFirstPage(); }, [loadFirstPage]);

  async function changePage(nextPage) {
    if (nextPage < 1) return;
    if (pages[nextPage - 1]) {
      setPage(nextPage);
      return;
    }
    const cursor = cursors[page - 1];
    if (!cursor) return;
    setLoading(true);
    const data = await fetchPage(cursor);
    if (data) {
      setPages(current => [...current, data.items || []]);
      setCursors(current => [...current, data.next_cursor || null]);
      setPage(nextPage);
    }
    setLoading(false);
  }

  const currentItems = pages[page - 1] || [];
  const hasNext = Boolean(cursors[page - 1]);
  const total = (page - 1) * PAGE_SIZE + currentItems.length + (hasNext ? PAGE_SIZE : 0);

  return <section>
    <div className="timeline-filters"><label>ค้นหารายการหรือผู้บันทึก<SearchField maxLength={120} value={filters.q} onChange={e=>setFilters({...filters,q:e.target.value})}/></label>
      <label>แหล่งข้อมูล<SelectField value={filters.source_type} onChange={event => setFilters({ ...filters, source_type: event.target.value })}><option value="">ทั้งหมด</option>{Object.entries(SOURCE_NAMES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField></label>
      <label>ตั้งแต่<DatePicker value={filters.from} max={filters.to || undefined} onChange={event => setFilters({ ...filters, from: event.target.value })} /></label>
      <label>ถึง<DatePicker value={filters.to} min={filters.from || undefined} onChange={event => setFilters({ ...filters, to: event.target.value })} /></label>
    </div>
    {error && <p className="form-error" role="alert">{error} <button onClick={loadFirstPage}>ลองอีกครั้ง</button></p>}
    {currentItems.length > 0 ? <>
      <div className="timeline-list" ref={listTopRef} aria-busy={loading}>
        {currentItems.map(item => <article className="timeline-item" style={focusSource?.id === item.source_id ? { outline: '2px solid var(--ink)' } : undefined} key={item.sort_key || `${item.source_type}:${item.source_id}`}>
          <header className="timeline-item-head"><span className={`timeline-type timeline-type-${item.source_type}`}>{SOURCE_NAMES[item.source_type] || item.source_type}</span><time dateTime={item.event_at}>{new Date(item.event_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' })}</time></header>
          <div className="timeline-item-content"><strong>{item.title}</strong>{item.notes && <p>{item.notes}</p>}<small>บันทึกโดย {item.actor_name || 'ระบบ'}</small></div>
        </article>)}
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={changePage} scrollRef={listTopRef} disabled={loading} />
    </> : !loading && !error && <div className="empty-state"><h3>ไม่พบรายการในไทม์ไลน์</h3><p>ลองปรับแหล่งข้อมูลหรือช่วงวันที่</p></div>}
    {loading && !currentItems.length && <p role="status">กำลังโหลดไทม์ไลน์…</p>}
  </section>;
}
