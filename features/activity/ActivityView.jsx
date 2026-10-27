"use client";
import SelectField from '../../components/SelectField.jsx';

import { useCallback, useEffect, useRef, useState } from 'react';
import Pagination from '../../components/Pagination.jsx';

const ACTION_NAMES = {
  create: 'สร้าง', update: 'แก้ไข', complete: 'ทำเสร็จ', skip: 'ข้าม',
  reschedule: 'เลื่อนเวลา', reassign: 'เปลี่ยนผู้รับผิดชอบ', archive: 'ลบ',
  restore: 'กู้คืน', undo: 'ย้อนกลับ', join: 'เข้าร่วม',
};

const ENTITY_NAMES = {
  care_task: 'งานดูแล', routine: 'กิจวัตร', pet: 'สัตว์เลี้ยง',
  care_entry: 'บันทึกการดูแล', health_record: 'ข้อมูลสุขภาพ', household: 'บ้าน',
  passport_entry: 'สมุดสุขภาพ', wellness_log: 'เช็กอินรายวัน',
  household_member: 'สมาชิกบ้าน', user: 'โปรไฟล์', user_settings: 'การตั้งค่า',
};
Object.assign(ACTION_NAMES, { acknowledge: 'รับทราบ', monitor: 'เริ่มติดตาม', assign: 'อัปเดตผู้ติดตาม', resolve: 'ปิดรายการ' });
Object.assign(ENTITY_NAMES, { wellness_alert: 'การเปลี่ยนแปลงสุขภาวะ' });

export default function ActivityView({ householdId, members = [], pets = [], api }) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [filters, setFilters] = useState({ member_id: '', pet_id: '', action: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const listTopRef = useRef(null);
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize);

  const load = useCallback(async (next = null) => {
    if (next) setLoadingMore(true);
    else { setLoading(true); if (!next) { setItems([]); setPage(1); } }
    const params = new URLSearchParams({ limit: '25' });
    Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); });
    if (next) params.set('cursor', next);
    try {
      const data = await api(`/households/${householdId}/activity?${params}`);
      setItems(current => next ? [...current, ...(data.items || [])] : data.items || []);
      setCursor(data.next_cursor);
      setError('');
      return true;
    } catch (problem) { setError(problem.message); return false; }
    finally { setLoading(false); setLoadingMore(false); }
  }, [api, filters, householdId]);

  useEffect(() => { load(); }, [load]);

  async function changePage(nextPage) {
    if (nextPage > Math.ceil(items.length / pageSize) && cursor) {
      if (await load(cursor)) setPage(nextPage);
      return;
    }
    setPage(nextPage);
  }

  const pageTotal = items.length + (cursor ? pageSize : 0);
  return <section className="content-card"><div className="section-header"><div><span className="section-kicker">ประวัติการเปลี่ยนแปลง</span><h2>ประวัติการเปลี่ยนแปลง</h2><p>ดูว่าใครเปลี่ยนข้อมูลอะไรและเมื่อใด พร้อมรายละเอียดก่อนและหลังการเปลี่ยนแปลง</p></div></div><div className="activity-filters"><label>สมาชิก<SelectField value={filters.member_id} onChange={event => setFilters({ ...filters, member_id: event.target.value })}><option value="">ทุกคน</option>{members.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField></label><label>สัตว์เลี้ยง<SelectField value={filters.pet_id} onChange={event => setFilters({ ...filters, pet_id: event.target.value })}><option value="">ทุกตัว</option>{pets.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField></label><label>การกระทำ<SelectField value={filters.action} onChange={event => setFilters({ ...filters, action: event.target.value })}><option value="">ทั้งหมด</option><option value="create">สร้าง</option><option value="update">แก้ไข</option><option value="complete">เสร็จ</option><option value="skip">ข้าม</option><option value="archive">ลบ</option><option value="restore">กู้คืน</option></SelectField></label></div>{error && <p className="form-error" role="alert">{error} <button onClick={() => load()}>ลองอีกครั้ง</button></p>}{loading ? <div className="skeleton-stack activity-skeleton" aria-busy="true" role="status" aria-label="กำลังโหลดประวัติ">{[0, 1, 2, 3].map(item => <div className="skeleton-activity" key={item}><i /><span><i /><i /></span></div>)}</div> : items.length ? <div className="activity-list" ref={listTopRef}>{pageItems.map(item => <article key={item.id}><div><strong>{item.actor_name}</strong> · {ACTION_NAMES[item.action] || item.action} {ENTITY_NAMES[item.entity_type] || item.entity_type}<p>{item.pet_name || 'ข้อมูลส่วนกลางของบ้าน'}</p><small>{new Date(item.created_at).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}</small></div><details><summary>ดูรายละเอียด</summary><div className="activity-diff"><pre><b>ก่อนเปลี่ยน</b>{JSON.stringify(item.before_data, null, 2)}</pre><pre><b>หลังเปลี่ยน</b>{JSON.stringify(item.after_data, null, 2)}</pre></div></details></article>)}</div> : !error && <div className="empty-state"><h3>ยังไม่มีประวัติการเปลี่ยนแปลง</h3><p>เมื่อมีการสร้างหรือแก้ไขข้อมูล รายการจะปรากฏที่นี่</p></div>}{cursor && <Pagination page={page} pageSize={pageSize} total={pageTotal} onPageChange={changePage} scrollRef={listTopRef} disabled={loadingMore} />}</section>;
}
