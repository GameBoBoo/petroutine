"use client";
import ManagementMenu, { ManagementControls } from '../../components/ManagementMenu.jsx';
import SearchField from '../../components/SearchField.jsx';

import SelectField from '../../components/SelectField.jsx';
import DatePicker from '../../components/DatePicker.jsx';
import Pagination from '../../components/Pagination.jsx';
import { useConfirmation } from '../../components/ConfirmationProvider.jsx';
import CareEntryEditor from './CareEntryEditor.jsx';
import { useCallback, useEffect, useRef, useState } from 'react';

const PAGE_SIZE = 25;
const SOURCE_NAMES = {
  task: 'งานตามกิจวัตร', care_entry: 'ดูแลนอกตาราง', health_record: 'ข้อมูลสุขภาพ',
  passport_entry: 'สมุดสุขภาพ', wellness_log: 'เช็กอินรายวัน', wellness_alert: 'การเปลี่ยนแปลงสุขภาวะ', activity: 'การเปลี่ยนแปลง',
};

export default function PetTimeline({ petId, householdId, currentUserId, isOwner = false, api, onUpdated, focusSource = null }) {
  const confirm = useConfirmation();
  const [pages, setPages] = useState([]);
  const [cursors, setCursors] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [careEntries, setCareEntries] = useState({});
  const [careError, setCareError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState('');
  const [filters, setFilters] = useState(() => ({ q: '', source_type: focusSource?.type === 'wellness' ? 'wellness_log' : focusSource?.type || '', from: focusSource?.date ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Bangkok' }).format(new Date(focusSource.date)) : '', to: focusSource?.date ? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Bangkok' }).format(new Date(focusSource.date)) : '' }));
  const listTopRef = useRef(null);

  const loadCareEntries = useCallback(async () => {
    if (!householdId) { setCareEntries({}); return; }
    try {
      const data = await api(`/households/${householdId}/care-entries`);
      setCareEntries(Object.fromEntries((data.items || []).filter(entry => entry.pet_id === petId && !entry.archived_at).map(entry => [entry.id, entry])));
      setCareError('');
    } catch (problem) {
      setCareEntries({});
      setCareError(problem.message);
    }
  }, [api, householdId, petId]);
  useEffect(() => { setEditing(null); loadCareEntries(); }, [loadCareEntries]);

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

  async function saveCareEntry(input) {
    if (!await confirm({ title: 'บันทึกการแก้ไขรายการดูแล?', description: `บันทึกการเปลี่ยนแปลงของ “${input.title}” ให้สมาชิกในบ้านเห็น`, confirmLabel: 'ยืนยันบันทึก' })) return;
    setBusy(editing.id);
    setActionError('');
    setNotice('');
    try {
      await api(`/care-entries/${editing.id}`, { method: 'PATCH', body: JSON.stringify(input) });
      setEditing(null);
      await Promise.all([loadFirstPage(), loadCareEntries(), onUpdated?.()]);
      setNotice('บันทึกการแก้ไขรายการดูแลแล้ว');
    } finally { setBusy(''); }
  }

  async function archiveCareEntry(entry) {
    if (!await confirm({ title: 'ลบบันทึกการดูแล?', description: `ลบ “${entry.title}” ออกจากรายการที่ใช้งาน ประวัติการดูแลและการเปลี่ยนแปลงยังคงอยู่`, danger: true })) return;
    setBusy(entry.id);
    setActionError('');
    setNotice('');
    try {
      await api(`/care-entries/${entry.id}/archive`, { method: 'POST', body: '{}' });
      await Promise.all([loadFirstPage(), loadCareEntries(), onUpdated?.()]);
      setNotice('ลบบันทึกการดูแลจากรายการที่ใช้งานแล้ว ประวัติยังคงอยู่');
    } catch (problem) { setActionError(problem.message); }
    finally { setBusy(''); }
  }

  const currentItems = pages[page - 1] || [];
  const hasNext = Boolean(cursors[page - 1]);
  const total = (page - 1) * PAGE_SIZE + currentItems.length + (hasNext ? PAGE_SIZE : 0);

  return <section>
    <header className="subview-head"><div><h3>ไทม์ไลน์การดูแล</h3><p>ดูบันทึกและจัดการรายการดูแลที่ผ่านมา</p></div><ManagementControls /></header>
    <div className="timeline-filters"><label>ค้นหารายการหรือผู้บันทึก<SearchField maxLength={120} value={filters.q} onChange={e=>setFilters({...filters,q:e.target.value})}/></label>
      <label>แหล่งข้อมูล<SelectField value={filters.source_type} onChange={event => setFilters({ ...filters, source_type: event.target.value })}><option value="">ทั้งหมด</option>{Object.entries(SOURCE_NAMES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField></label>
      <label>ตั้งแต่<DatePicker value={filters.from} max={filters.to || undefined} onChange={event => setFilters({ ...filters, from: event.target.value })} /></label>
      <label>ถึง<DatePicker value={filters.to} min={filters.from || undefined} onChange={event => setFilters({ ...filters, to: event.target.value })} /></label>
    </div>
    {error && <p className="form-error" role="alert">{error} <button onClick={loadFirstPage}>ลองอีกครั้ง</button></p>}
    {careError && <p className="form-error" role="alert">ไม่สามารถโหลดรายการดูแลสำหรับแก้ไขได้: {careError} <button onClick={loadCareEntries}>ลองอีกครั้ง</button></p>}
    {actionError && <p className="form-error" role="alert">{actionError}</p>}
    {notice && <p role="status">{notice}</p>}
    {currentItems.length > 0 ? <>
      <div className="timeline-list" ref={listTopRef} aria-busy={loading}>
        {currentItems.map(item => <article className="timeline-item" style={focusSource?.id === item.source_id ? { outline: '2px solid var(--ink)' } : undefined} key={item.sort_key || `${item.source_type}:${item.source_id}`}>
          <header className="timeline-item-head"><span className={`timeline-type timeline-type-${item.source_type}`}>{SOURCE_NAMES[item.source_type] || item.source_type}</span><time dateTime={item.event_at}>{new Date(item.event_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' })}</time></header>
          <div className="timeline-item-content">{item.source_type === 'care_entry' && editing?.id === item.source_id
            ? <CareEntryEditor key={editing.id} entry={editing} busy={busy === editing.id} onSave={saveCareEntry} onCancel={() => setEditing(null)} />
            : <><strong>{item.title}</strong>{item.notes && <p>{item.notes}</p>}<small>บันทึกโดย {item.actor_name || 'ระบบ'}</small>
              {item.source_type === 'care_entry' && item.archived_at && <small>ลบจากรายการที่ใช้งานแล้ว · เก็บไว้ในประวัติ</small>}
              {item.source_type === 'care_entry' && !item.archived_at && careEntries[item.source_id] && (isOwner || careEntries[item.source_id].created_by === currentUserId) && <ManagementMenu label={item.title}>
                <button type="button" className="button ghost" aria-label={`แก้ไขบันทึก ${item.title}`} disabled={Boolean(busy)} onClick={() => { setEditing(careEntries[item.source_id]); setActionError(''); setNotice(''); }}>แก้ไข</button>
                <button type="button" className="button subtle-danger" aria-label={`ลบบันทึก ${item.title}`} disabled={Boolean(busy)} onClick={() => archiveCareEntry(careEntries[item.source_id])}>ลบ</button>
              </ManagementMenu>}
            </>}</div>
        </article>)}
      </div>
      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={changePage} scrollRef={listTopRef} disabled={loading || Boolean(busy)} />
    </> : !loading && !error && <div className="empty-state"><h3>ไม่พบรายการในไทม์ไลน์</h3><p>ลองปรับแหล่งข้อมูลหรือช่วงวันที่</p></div>}
    {loading && !currentItems.length && <p role="status">กำลังโหลดไทม์ไลน์…</p>}
  </section>;
}
