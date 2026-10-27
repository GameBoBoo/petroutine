"use client";
import { useConfirmation } from '../../components/ConfirmationProvider.jsx';
import { CARE_ACTIVITY_OPTIONS, HEALTH_RECORD_OPTIONS } from '../../lib/form-options.js';
import SelectField from '../../components/SelectField.jsx';
import DateTimePicker from '../../components/DateTimePicker.jsx';

import { useEffect, useState } from 'react';
import Modal from '../../components/Modal.jsx';
import { WellnessLogForm } from '../pets/WellnessLogs.jsx';
import { ROUTINE_TEMPLATES } from '../routines/templates.js';

const CHOICES = [
  { heading: 'บันทึกสิ่งที่เกิดขึ้นแล้ว', detail: 'เก็บสิ่งที่ดูแลหรือสังเกตได้ พร้อมเวลาเกิดเหตุการณ์', items: [
    ['wellness', 'เช็กอินรายวัน', 'อาหาร น้ำ กิจกรรม การนอน ขับถ่าย อารมณ์ หรือน้ำหนัก'],
    ['care', 'บันทึกการดูแล', 'เช่น อาบน้ำ ซื้ออาหาร หรือเดินเล่นเพิ่ม'],
    ['health', 'บันทึกเหตุการณ์สุขภาพ', 'เช่น ชั่งน้ำหนัก ให้ยาตามที่สั่ง หรือบันทึกผลการพบสัตวแพทย์'],
  ] },
  { heading: 'วางแผนล่วงหน้า', detail: 'สร้างงานที่จะแสดงในหน้าวันนี้และปฏิทิน', items: [
    ['routine', 'สร้างกิจวัตร', 'กำหนดวัน เวลา และผู้รับผิดชอบ'],
    ['appointment', 'นัดหมายครั้งเดียว', 'สร้างงานตามวันและเวลาที่เลือก'],
    ['template', 'เริ่มจากเทมเพลต', 'เลือกกิจวัตรตัวอย่างแล้วปรับให้เหมาะกับบ้าน'],
  ] },
];

const bangkokInput = () => new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false,
}).format(new Date()).replace(' ', 'T');
const bangkokIso = value => new Date(`${value}:00+07:00`).toISOString();
const CARE_TYPES = CARE_ACTIVITY_OPTIONS;

export default function QuickAddSheet({ pets = [], onClose, onSelect, api, onSaved, initialPetId, initialMode = 'choices' }) {
  const confirm = useConfirmation();
  const [mode, setMode] = useState(initialMode);
  const householdKey=pets[0]?.household_id || '';
  const [recentMode,setRecentMode]=useState('');
  const [form, setForm] = useState({ pet_id: initialPetId || pets[0]?.id || '', title: '', activity_type: 'other', occurred_at: bangkokInput(), notes: '', record_type: 'observation', details: '', numeric_value: '', unit: 'kg' });
  useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem('pawroutine_quick_'+householdKey)||'{}');if(!initialPetId&&pets.some(p=>p.id===saved.petId))setForm(f=>({...f,pet_id:saved.petId}));setRecentMode(saved.mode||'');}catch{}},[householdKey]);
  useEffect(()=>{if(!['care','health','wellness'].includes(mode))return;try{localStorage.setItem('pawroutine_quick_'+householdKey,JSON.stringify({petId:form.pet_id,mode}));}catch{}},[mode,form.pet_id,householdKey]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [aiText, setAiText] = useState('');
  const selectedPetId = form.pet_id || pets[0]?.id || '';
  const canSubmit = Boolean(selectedPetId && form.title.trim() && form.occurred_at
    && (mode !== 'health' || form.record_type !== 'weight' || (Number(form.numeric_value) > 0 && Number.isFinite(Number(form.numeric_value)))));

  function selectMode(nextMode) {
    setError('');
    setForm(current => ({
      ...current,
      occurred_at: bangkokInput(),
      ...(nextMode === 'care' ? { activity_type: 'feeding', title: '', notes: '' } : {}),
      ...(nextMode === 'health' ? { record_type: 'observation', title: '', details: '', numeric_value: '' } : {}),
    }));
    setMode(nextMode);
  }

  async function submit(event) {
    event.preventDefault();
    if (!await confirm({ title: mode === 'care' ? 'บันทึกการดูแล?' : 'บันทึกสุขภาพ?', description: `“${form.title}” ของ${pets.find(pet => pet.id === selectedPetId)?.name || 'สัตว์เลี้ยง'}`, confirmLabel: 'ยืนยันบันทึก' })) return;
    setError(''); setBusy(true);
    try {
      if (mode === 'care') {
        await api(`/households/${pets.find(pet => pet.id === selectedPetId)?.household_id}/care-entries`, { method: 'POST', body: JSON.stringify({ pet_id: selectedPetId, title: form.title, activity_type: form.activity_type, occurred_at: bangkokIso(form.occurred_at), notes: form.notes || null }) });
      } else {
        await api(`/pets/${selectedPetId}/health-records`, { method: 'POST', body: JSON.stringify({ record_type: form.record_type, title: form.title, recorded_at: bangkokIso(form.occurred_at), details: form.details || null, ...(form.record_type === 'weight' ? { numeric_value: Number(form.numeric_value), unit: 'kg' } : {}) }) });
      }
      onSaved?.(); setSavedNotice(true); setError('');
    } catch (problem) { setError(problem.message); }
    finally { setBusy(false); }
  }

  async function saveWellness(input) {
    setBusy(true); setError('');
    try {
      if (!selectedPetId) throw new Error('กรุณาเพิ่มสัตว์เลี้ยงก่อนเช็กอิน');
      await api(`/pets/${selectedPetId}/wellness-logs`, { method: 'POST', body: JSON.stringify(input) });
      onSaved?.(); setSavedNotice(true); setError('');
    } catch (problem) { setError(problem.message); throw problem; }
    finally { setBusy(false); }
  }

  async function prepareAiDraft(event) {
    event.preventDefault();
    setError(''); setBusy(true);
    try {
      const result = await api(`/households/${householdKey}/ai-care-draft`, { method: 'POST', body: JSON.stringify({ pet_id: selectedPetId, text: aiText.trim() }) });
      setForm(current => ({ ...current, ...result.draft, pet_id: selectedPetId, occurred_at: bangkokInput() }));
      setSavedNotice(false);
      setMode(result.draft.mode);
    } catch (problem) { setError(problem.status >= 500 || !problem.status ? 'บริการ AI ขัดข้องหรือไม่ตอบกลับ คุณยังบันทึกแบบปกติได้' : problem.message || 'เตรียมบันทึกไม่สำเร็จ กรุณาลองอีกครั้ง'); }
    finally { setBusy(false); }
  }

  return <Modal title="เพิ่มรายการ" description={mode === 'ai' ? 'เล่าเรื่องที่เกิดขึ้น แล้วตรวจแบบร่างก่อนบันทึก' : mode === 'wellness' ? 'บันทึกสิ่งที่สังเกตได้ โดยไม่จำเป็นต้องกรอกทุกช่อง' : 'เลือกว่าจะบันทึกสิ่งที่เกิดขึ้นแล้ว หรือวางแผนสิ่งที่จะทำ'} onClose={onClose}>
    {mode === 'choices' ? <div className="quick-add-groups"><button type="button" className="quick-ai-entry" onClick={() => { setError(''); setMode('ai'); }}><span><strong>เล่าให้ AI ช่วยเตรียมบันทึก</strong><small>พิมพ์ภาษาของคุณ แล้วตรวจข้อมูลก่อนบันทึกจริง</small></span><span aria-hidden="true">→</span></button>{recentMode && <button type="button" className="button secondary" onClick={()=>selectMode(recentMode)}>ใช้ล่าสุด: {recentMode==='care'?'บันทึกการดูแล':recentMode==='health'?'บันทึกสุขภาพ':'เช็กอินรายวัน'}</button>}<section className="quick-add-group"><header><h3>เพิ่มงานที่ต้องทำ</h3><p>เลือกงานครั้งเดียวหรือกิจวัตรประจำ</p></header><div className="quick-add-list"><button type="button" onClick={() => onSelect('appointment')}><strong>งานครั้งเดียว</strong><span>นัดหมายหรือสิ่งที่ต้องทำในวันที่เลือก</span></button><button type="button" onClick={() => onSelect('routine')}><strong>กิจวัตรประจำ</strong><span>ตั้งเวลาทำซ้ำตามวันหรือช่วงห่าง</span></button></div></section><section className="quick-add-group"><header><h3>บันทึกสิ่งที่เกิดขึ้นแล้ว</h3><p>บันทึกการดูแลหรือข้อมูลสุขภาพที่ผ่านมา</p></header><div className="quick-add-list"><button type="button" onClick={() => selectMode('care')}><strong>บันทึกการดูแล</strong><span>เช่น ให้อาหาร พาเดินเล่น หรือให้ยา</span></button><button type="button" onClick={() => selectMode('health')}><strong>บันทึกสุขภาพ</strong><span>เช่น น้ำหนัก วัคซีน หรือผลพบสัตวแพทย์</span></button><button type="button" onClick={() => selectMode('wellness')}><strong>เช็กอินรายวัน</strong><span>บันทึกอาหาร น้ำ การนอน และอารมณ์</span></button></div></section><section className="quick-add-group"><header><h3>เพิ่มเร็ว</h3><p>สร้างบันทึกการดูแลที่เกิดขึ้นแล้วในไม่กี่แตะ</p></header><div className="quick-add-shortcuts">{[['feeding','ให้อาหาร'],['walk','พาเดินเล่น'],['grooming','แปรงขน']].map(([type,label]) => <button key={type} type="button" onClick={() => { selectMode('care'); setForm(current => ({ ...current, activity_type: type, title: label, occurred_at: bangkokInput() })); }}>{label}</button>)}</div></section></div>
      : mode === 'ai' ? <form className="form-stack quick-ai-form" onSubmit={prepareAiDraft}><label>สัตว์เลี้ยง<SelectField required value={selectedPetId} onChange={event => setForm(current => ({ ...current, pet_id: event.target.value }))}>{pets.map(pet => <option key={pet.id} value={pet.id}>{pet.name}</option>)}</SelectField></label><label>เล่าเรื่องที่เกิดขึ้น<textarea required minLength={10} maxLength={600} rows={4} value={aiText} onChange={event => setAiText(event.target.value)} placeholder="เช่น วันนี้โมจิกินอาหารเช้าน้อย แต่ยังเล่นตามปกติ" /></label><p className="field-help">AI จะเตรียมแบบร่างจากข้อความนี้ คุณแก้ไขทุกช่องได้ก่อนบันทึก</p>{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><button type="button" className="button ghost" onClick={() => setMode('choices')}>ย้อนกลับ</button><button className="button primary" disabled={busy || !selectedPetId || aiText.trim().length < 10}>{busy ? 'กำลังเตรียม…' : 'เตรียมแบบร่าง'}</button></div></form>
      : mode === 'templates' ? <div className="quick-add-list"><button type="button" onClick={() => setMode('choices')}><strong>ย้อนกลับ</strong><span>เลือกวิธีเพิ่มแบบอื่น</span></button>{ROUTINE_TEMPLATES.map(template => <button key={template.id} type="button" onClick={() => onSelect('template', template)}><strong>{template.name}</strong><span>{template.title}</span></button>)}</div>
        : mode === 'wellness' ? <div className="quick-wellness"><label className="quick-pet-label">สัตว์เลี้ยง<SelectField value={selectedPetId} onChange={event => setForm({ ...form, pet_id: event.target.value })}>{pets.map(pet => <option key={pet.id} value={pet.id} data-description={pet.species === 'cat' ? 'แมว' : 'สุนัข'}>{pet.name}</option>)}</SelectField></label>{error && <p className="form-error" role="alert">{error}</p>}<WellnessLogForm busy={busy} onCancel={() => setMode('choices')} onSubmit={saveWellness} />{savedNotice && <div className="quick-add-success" role="status"><strong>บันทึกเช็กอินเรียบร้อย</strong><div><button type="button" className="button secondary" onClick={() => setSavedNotice(false)}>เพิ่ม/แก้ไขเช็กอิน</button><button type="button" className="button ghost" onClick={onClose}>เสร็จแล้ว</button></div></div>}</div>
          : <form className="form-stack" onSubmit={submit}>
            <label>สัตว์เลี้ยง <span className="required-mark">*</span><SelectField required value={selectedPetId} onChange={event => setForm({ ...form, pet_id: event.target.value })}>{pets.map(pet => <option key={pet.id} value={pet.id} data-description={pet.species === 'cat' ? 'แมว' : 'สุนัข'}>{pet.name}</option>)}</SelectField></label>
            {mode === 'health' && <label>ประเภทข้อมูล <span className="required-mark">*</span><SelectField value={form.record_type} onChange={event => setForm({ ...form, record_type: event.target.value })}>{HEALTH_RECORD_OPTIONS.map(([value,label,description])=><option key={value} value={value} data-description={description}>{label}</option>)}</SelectField></label>}
            {mode === 'care' && <label>กิจกรรม <span className="required-mark">*</span><SelectField value={form.activity_type} onChange={event => setForm({ ...form, activity_type: event.target.value })}>{CARE_TYPES.map(([value, label, description]) => <option key={value} value={value} data-description={description}>{label}</option>)}</SelectField></label>}
            <label>ชื่อรายการ <span className="required-mark">*</span><input required maxLength={160} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder={mode === 'care' ? 'เช่น พาเดินเล่นรอบเย็น' : 'เช่น ชั่งน้ำหนักประจำเดือน'} /></label>
            <label>วันและเวลา <span className="required-mark">*</span><DateTimePicker required value={form.occurred_at} onChange={event => setForm({ ...form, occurred_at: event.target.value })} /></label>
            {mode === 'health' && form.record_type === 'weight' && <label>น้ำหนัก (กก.) <span className="required-mark">*</span><input required type="number" inputMode="decimal" min="0.001" max="1000" step="0.001" value={form.numeric_value} onChange={event => setForm({ ...form, numeric_value: event.target.value })} /></label>}
            <label>{mode === 'care' ? 'หมายเหตุ' : 'รายละเอียด'}<textarea rows="3" maxLength={5000} value={mode === 'care' ? form.notes : form.details} onChange={event => setForm({ ...form, [mode === 'care' ? 'notes' : 'details']: event.target.value })} placeholder="เว้นว่างได้" /></label>
            {error && <p className="form-error" role="alert">{error}</p>}{savedNotice && <div className="quick-add-success" role="status"><strong>บันทึกเรียบร้อย</strong><span>เพิ่มรายการอื่นต่อ หรือปิดหน้าต่างเมื่อเสร็จแล้ว</span><div><button type="button" className="button secondary" onClick={() => { setSavedNotice(false); setForm(current => ({ ...current, title: "", occurred_at: bangkokInput(), notes: "", details: "", numeric_value: "" })); }}>เพิ่มอีกรายการ</button><button type="button" className="button ghost" onClick={onClose}>เสร็จแล้ว</button></div></div>}<div className="form-actions"><button type="button" className="button ghost" onClick={() => setMode('choices')}>ย้อนกลับ</button><button className="button primary" disabled={busy || savedNotice || !canSubmit}>{busy ? 'กำลังบันทึก…' : 'บันทึก'}</button></div>
          </form>}
  </Modal>;
}
