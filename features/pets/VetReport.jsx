"use client";
import DatePicker from '../../components/DatePicker.jsx';
import BrandLogo from '../../components/BrandLogo.jsx';

import { useCallback, useEffect, useRef, useState } from 'react';

const TYPE_NAMES = { allergy: 'การแพ้', condition: 'ภาวะประจำตัว', medication: 'ยาประจำ', vaccination: 'วัคซีน', appointment: 'นัดหมาย' };
const METRIC_NAMES = { food_intake: 'อาหาร', water_intake: 'น้ำ', activity_level: 'กิจกรรม', sleep_amount: 'การนอน', stool_condition: 'ขับถ่าย', mood: 'อารมณ์', weight_kg: 'น้ำหนัก' };
const VALUE_NAMES = { very_low: 'น้อยมาก', low: 'น้อยกว่าปกติ', usual: 'ตามปกติ', high: 'มากกว่าปกติ', very_high: 'มากมาก', normal: 'ปกติ', soft: 'นิ่ม', watery: 'เหลว', hard: 'แข็ง', not_observed: 'ไม่พบ', bright: 'สดใส', quiet: 'เงียบ', restless: 'กระสับกระส่าย', irritable: 'หงุดหงิด' };
const dateText = value => value ? new Date(`${String(value).slice(0, 10)}T00:00:00+07:00`).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium' }) : 'ไม่ระบุ';
const dateTimeText = value => value ? new Date(value).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' }) : 'ไม่ระบุ';
const valueText = value => value == null ? '—' : VALUE_NAMES[value] || String(value);
function todayBangkok() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
function shift(date, amount) { const value = new Date(`${date}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + amount); return value.toISOString().slice(0, 10); }

function DataTable({ label, columns, rows, empty }) {
  if (!rows.length) return <p className="report-empty">{empty}</p>;
  return <div className="report-table-wrap"><table className="report-table"><caption className="sr-only">{label}</caption><thead><tr>{columns.map(column => <th scope="col" key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={row.id || `${label}-${index}`}>{columns.map(column => <td key={column.key}>{column.render ? column.render(row) : row[column.key] ?? '—'}</td>)}</tr>)}</tbody></table></div>;
}

export default function VetReport({ petId, api }) {
  const today = todayBangkok();
  const [filters, setFilters] = useState({ from: shift(today, -29), to: today });
  const [sections,setSections]=useState(['passport','health','wellness','alerts','timeline']);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const reportRef = useRef(null);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams(filters);
      const data = await api(`/pets/${petId}/vet-report?${params}`);
      setReport(data.report);
    } catch (problem) { setError(problem.message); }
    finally { setLoading(false); }
  }, [api, filters, petId]);
  useEffect(() => { setReport(null); load(); }, [load]);
  async function downloadPdf() {
    if (!reportRef.current || !report) return;
    setDownloading(true);
    setError('');
    const previousTitle = document.title;
    const safePetName = (pet?.name || 'pet').trim().replace(/[\\/:*?"<>|]+/g, '-');
    try {
      const module = await import('html2pdf.js');
      const html2pdf = module.default || module;
      const filename = `PetRoutine-${safePetName}-Vet-Report-${filters.from}-to-${filters.to}.pdf`;
      const blob = await html2pdf().set({
        filename: `PetRoutine-${safePetName}-Vet-Report-${filters.from}-to-${filters.to}.pdf`,
        margin: [10, 10, 12, 10],
        image: { type: 'jpeg', quality: 0.96 },
        html2canvas: {
          scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollY: 0,
          onclone: clonedDocument => {
            clonedDocument.querySelectorAll('.report-table-wrap').forEach(element => { element.style.overflow = 'visible'; });
            clonedDocument.querySelectorAll('.report-table').forEach(element => { element.style.minWidth = '0'; element.style.width = '100%'; });
          },
        },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['.report-table tr', '.report-profile div'] },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(reportRef.current).outputPdf('blob');
      // Use the browser download API explicitly so the report name is preserved
      // across FileSaver/browser implementations (including headless Linux).
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (problem) {
      setError(`สร้าง PDF ไม่สำเร็จ: ${problem.message || 'กรุณาลองอีกครั้ง'}`);
    } finally {
      document.title = previousTitle;
      setDownloading(false);
    }
  }
  const pet = report?.pet;
  return <section className="vet-report-view" aria-labelledby="vet-report-title">
    <header className="subview-head no-print"><div><span className="section-kicker">รายงานสัตวแพทย์</span><h3 id="vet-report-title">รายงานสำหรับสัตวแพทย์</h3><p>ดาวน์โหลดรายงานเป็น PDF เพื่อส่งต่อหรือพิมพ์</p></div><button className="button primary" disabled={!report || loading || downloading} onClick={downloadPdf}>{downloading ? 'กำลังสร้าง PDF…' : 'ดาวน์โหลด PDF'}</button></header>
    <fieldset className="metric-picker no-print"><legend>หัวข้อในรายงาน (ด้านล่างเป็นตัวอย่างก่อนดาวน์โหลด)</legend>{[['passport','สมุดสุขภาพ'],['health','เหตุการณ์สุขภาพ'],['wellness','เช็กอิน'],['alerts','การติดตาม'],['timeline','ไทม์ไลน์']].map(([key,label])=><label className="checkbox-row" key={key}><input type="checkbox" checked={sections.includes(key)} onChange={e=>setSections(current=>e.target.checked?[...current,key]:current.filter(s=>s!==key))}/>{label}</label>)}</fieldset><div className="report-controls no-print"><label>ตั้งแต่<DatePicker max={filters.to} value={filters.from} onChange={event => setFilters(current => ({ ...current, from: event.target.value }))} /></label><label>ถึง<DatePicker min={filters.from} max={today} value={filters.to} onChange={event => setFilters(current => ({ ...current, to: event.target.value }))} /></label>{loading && <span role="status">กำลังจัดทำรายงาน…</span>}</div>
    {error && <p className="form-error no-print" role="alert">{error} <button onClick={load}>ลองอีกครั้ง</button></p>}
    {report && <article ref={reportRef} className="vet-report-paper">
      <header className="report-cover"><div className="report-cover-main"><BrandLogo className="report-logo" /><span className="report-kicker">รายงานสุขภาพสัตว์เลี้ยง</span><h2>รายงานข้อมูลสัตว์เลี้ยง</h2><p>{pet.name} · {pet.household_name}</p></div><dl><div><dt>ช่วงข้อมูล</dt><dd>{dateText(report.range.from)} – {dateText(report.range.to)}</dd></div><div><dt>จัดทำเมื่อ</dt><dd>{dateTimeText(report.generated_at)}</dd></div><div><dt>จัดทำโดย</dt><dd>{report.generated_by_name}</dd></div></dl></header>
      <p className="report-disclaimer">เอกสารนี้รวบรวมข้อมูลที่ผู้ใช้บันทึกใน PetRoutine เพื่อช่วยสื่อสารกับสัตวแพทย์ ไม่ใช่การวินิจฉัย คำแนะนำการรักษา หรือการคำนวณยา</p>
      <section className="report-section"><h3>ข้อมูลสัตว์เลี้ยง</h3><dl className="report-profile"><div><dt>ชื่อ</dt><dd>{pet.name}</dd></div><div><dt>ประเภท</dt><dd>{pet.species === 'cat' ? 'แมว' : 'สุนัข'}</dd></div><div><dt>สายพันธุ์</dt><dd>{pet.breed || 'ไม่ระบุ'}</dd></div><div><dt>วันเกิด</dt><dd>{dateText(pet.birth_date)}</dd></div><div><dt>เพศ</dt><dd>{pet.sex === 'male' ? 'ผู้' : pet.sex === 'female' ? 'เมีย' : 'ไม่ระบุ'}</dd></div><div><dt>ทำหมัน</dt><dd>{pet.neuter_status === 'neutered' ? 'แล้ว' : pet.neuter_status === 'not_neutered' ? 'ยัง' : 'ไม่ระบุ'}</dd></div><div><dt>น้ำหนักตั้งต้น</dt><dd>{pet.baseline_weight_kg ? `${pet.baseline_weight_kg} กก. (${dateText(pet.baseline_weight_recorded_on)})` : 'ไม่ระบุ'}</dd></div><div><dt>ติดต่อสัตวแพทย์</dt><dd>{pet.vet_contact || 'ไม่ระบุ'}</dd></div></dl>{pet.notes && <p className="report-note"><strong>หมายเหตุ:</strong> {pet.notes}</p>}</section>
      {sections.includes('passport') && <section className="report-section"><h3>สมุดสุขภาพ</h3><DataTable label="สมุดสุขภาพ" empty="ไม่มีข้อมูลสมุดสุขภาพที่ใช้งาน" columns={[{ key: 'entry_type', label: 'ประเภท', render: row => TYPE_NAMES[row.entry_type] || row.entry_type }, { key: 'title', label: 'รายการ' }, { key: 'details', label: 'รายละเอียด' }, { key: 'next_due_date', label: 'กำหนดครั้งถัดไป', render: row => dateText(row.next_due_date) }]} rows={report.passport} /></section>}
      {sections.includes('health') && <section className="report-section"><h3>ข้อมูลสุขภาพในช่วงที่เลือก</h3><DataTable label="ข้อมูลสุขภาพ" empty="ไม่มีข้อมูลสุขภาพในช่วงนี้" columns={[{ key: 'recorded_at', label: 'วันเวลา', render: row => dateTimeText(row.recorded_at) }, { key: 'title', label: 'รายการ' }, { key: 'value', label: 'ค่า', render: row => row.numeric_value == null ? '—' : `${row.numeric_value} ${row.unit || ''}` }, { key: 'details', label: 'รายละเอียด' }]} rows={report.health_records} /></section>}
      {sections.includes('wellness') && <section className="report-section"><h3>เช็กอินสุขภาวะรายวัน</h3><DataTable label="เช็กอินสุขภาวะ" empty="ไม่มีเช็กอินในช่วงนี้" columns={[{ key: 'recorded_at', label: 'วันเวลา', render: row => dateTimeText(row.recorded_at) }, { key: 'metrics', label: 'ข้อมูลที่บันทึก', render: row => Object.entries(METRIC_NAMES).map(([key, label]) => row[key] != null && `${label}: ${key === 'weight_kg' ? `${row[key]} กก.` : valueText(row[key])}`).filter(Boolean).join(' · ') || '—' }, { key: 'notes', label: 'ข้อสังเกต' }]} rows={report.wellness_logs} /></section>}
      {sections.includes('alerts') && <section className="report-section"><h3>การเปลี่ยนแปลงที่ระบบตรวจพบ</h3><DataTable label="รายการติดตามสุขภาพ" empty="ไม่มีรายการติดตามในช่วงนี้" columns={[{ key: 'metric', label: 'ข้อมูล', render: row => METRIC_NAMES[row.metric] || row.metric }, { key: 'period', label: 'ช่วงที่พบ', render: row => `${dateText(row.observation_start)} – ${dateText(row.observation_end)}` }, { key: 'status', label: 'สถานะ', render: row => row.status === 'resolved' ? 'กลับสู่ปกติ' : 'กำลังติดตาม' }, { key: 'follow_up', label: 'ผู้ติดตาม/กำหนด', render: row => [row.assigned_to_name, row.follow_up_due_date && dateText(row.follow_up_due_date), row.follow_up_note].filter(Boolean).join(' · ') || '—' }]} rows={report.alerts} /></section>}
      {sections.includes('timeline') && <section className="report-section"><h3>ไทม์ไลน์การดูแล</h3><DataTable label="ไทม์ไลน์การดูแล" empty="ไม่มีเหตุการณ์ดูแลในช่วงนี้" columns={[{ key: 'event_at', label: 'วันเวลา', render: row => dateTimeText(row.event_at) }, { key: 'event_type', label: 'ประเภท' }, { key: 'title', label: 'รายการ' }, { key: 'actor_name', label: 'บันทึกโดย' }, { key: 'notes', label: 'หมายเหตุ' }]} rows={report.timeline} /></section>}
      <p className="report-note">วันที่มีเช็กอิน {new Set(report.wellness_logs.map(row=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok'}).format(new Date(row.recorded_at)))).size} วันในช่วงที่เลือก วันที่ไม่มีข้อมูลไม่ได้หมายความว่าไม่มีอาการหรือไม่ได้ดูแล</p><footer className="report-footer">PetRoutine · ข้อมูลตามที่ผู้ใช้บันทึก · เขตเวลา Asia/Bangkok</footer>
    </article>}
  </section>;
}
