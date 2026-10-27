"use client";
import { useConfirmation } from '../../components/ConfirmationProvider.jsx';

import { useEffect, useRef, useState } from 'react';
import SelectField from '../../components/SelectField.jsx';

const bangkokToday = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Bangkok' }).format(new Date());
const daysBefore = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10);
const sourceLabel = source => `${source.pet_name ? `${source.pet_name} · ` : ''}${source.title || source.category || ({ wellness: 'เช็กอินรายวัน', wellness_alert: 'การเปลี่ยนแปลงสุขภาวะ', task: 'งานดูแล', care_entry: 'บันทึกการดูแล', health_record: 'ข้อมูลสุขภาพ', pet_profile: 'ข้อมูลสัตว์เลี้ยง', passport: 'สมุดสุขภาพ', routine: 'กิจวัตร' }[source.type] || 'บันทึก')}`;

export default function AiChatWidget({ pets, householdId, api, onOpenSource, openRequest = 0 }) {
  const confirm = useConfirmation();
  const [open, setOpen] = useState(false);
  const [petId, setPetId] = useState('all');
  const [days, setDays] = useState(7);
  const [enabled, setEnabled] = useState(null);
  const [hourlyLimit, setHourlyLimit] = useState(10);
  const [question, setQuestion] = useState('');
  const [consented, setConsented] = useState(false);
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [statusNotice, setStatusNotice] = useState('');
  const inputRef = useRef(null);
  const endRef = useRef(null);
  const toggleRef = useRef(null);

  useEffect(() => { if (openRequest > 0) setOpen(true); }, [openRequest]);

  useEffect(() => {
    if (petId !== 'all' && !pets.some(pet => pet.id === petId)) setPetId('all');
  }, [pets, petId]);
  useEffect(() => {
    setMessages([]); setQuestion(''); setConsented(false); setEnabled(null); setError(''); setStatusNotice('');
  }, [petId]);
  useEffect(() => {
    if (!petId || !open) return;
    let active = true;
    api(petId === 'all' ? `/households/${householdId}/ai-settings` : `/pets/${petId}/ai-insights/status`).then(result => { const status = result.settings || result; if (active) { setEnabled(status.enabled === true && (petId !== 'all' || status.available === true)); setConsented(status.consented === true); setHourlyLimit(status.hourly_limit ?? 10); setStatusNotice((petId === 'all' ? !status.enabled : status.household_enabled === false) ? 'บ้านนี้ยังไม่ได้เปิดใช้ AI' : (petId === 'all' ? !status.available : !status.enabled) ? 'บริการ AI ยังไม่พร้อมใช้งานในขณะนี้' : ''); } })
      .catch(() => { if (active) { setEnabled(false); setStatusNotice('เชื่อมต่อบริการ AI ไม่สำเร็จ กรุณาลองใหม่ภายหลัง'); } });
    return () => { active = false; };
  }, [api, petId, open]);
  useEffect(() => { if (open) inputRef.current?.focus(); }, [open, enabled]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }); }, [messages, busy]);

  async function acceptConsent() {
    if (!await confirm({ title: 'ยืนยันความยินยอมใช้ AI?', description: 'คำถามและบันทึกที่เกี่ยวข้องของบ้านนี้จะถูกส่งไปยังผู้ให้บริการ AI เพื่อค้นหาและสรุปคำตอบ', confirmLabel: 'ยินยอมและเริ่มใช้งาน' })) return;
    setBusy(true); setError('');
    try {
      const result = await api(`/households/${householdId}/ai-consent`, { method: 'PATCH', body: JSON.stringify({ consented: true }) });
      setConsented(result.consented === true);
      inputRef.current?.focus();
    } catch (problem) { setError(problem.message || 'บันทึกความยินยอมไม่สำเร็จ'); }
    finally { setBusy(false); }
  }

  async function send(event) {
    event.preventDefault();
    const value = question.trim();
    if (!enabled || busy || !consented || !value || value.length > 500 || !petId) return;
    const to = bangkokToday();
    const from = daysBefore(to, days - 1);
    const history = messages.slice(-6).map(message => ({ role: message.role, content: message.content.slice(0, message.role === 'user' ? 500 : 1200) }));
    setMessages(current => [...current, { role: 'user', content: value }]);
    setQuestion(''); setError(''); setBusy(true);
    try {
      const response = await api(petId === 'all' ? `/households/${householdId}/ai-insights` : `/pets/${petId}/ai-insights`, { method: 'POST', body: JSON.stringify({ intent: 'chat_question', question: value, from, to, history }) });
      setMessages(current => [...current, { role: 'assistant', content: response.insight.answer, sources: response.insight.sources || [], range: response.insight.range, truncated: response.insight.truncated }]);
    } catch (problem) { if (problem.code === 'AI_CONSENT_REQUIRED') setConsented(false); setError(problem.status >= 500 || !problem.status ? 'บริการ AI ขัดข้องหรือไม่ตอบกลับ กรุณาลองใหม่ภายหลัง' : problem.message || 'ส่งคำถามไม่สำเร็จ กรุณาลองอีกครั้ง'); }
    finally { setBusy(false); }
  }

  if (!pets.length) return null;
  const selectedPet = pets.find(pet => pet.id === petId);
  return <div className="ai-chat-root">
    {open && <section className="ai-chat-panel" role="dialog" aria-modal="false" aria-labelledby="ai-chat-title" onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); toggleRef.current?.focus(); } }}>
      <header className="ai-chat-header"><div><span className="section-kicker">ผู้ช่วย AI</span><h2 id="ai-chat-title">ถามเรื่องสัตว์เลี้ยง</h2><p>ตอบจากบันทึกของบ้านนี้ · อ่านอย่างเดียว</p></div><button type="button" className="icon-button" aria-label="ปิดแชต AI" onClick={() => { setOpen(false); toggleRef.current?.focus(); }}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 5l14 14M19 5 5 19" /></svg></button></header>
      <div className="ai-chat-controls"><label>สัตว์เลี้ยง<SelectField value={petId} onChange={event => setPetId(event.target.value)}><option value="all">ทุกตัวในบ้าน</option>{pets.map(pet => <option value={pet.id} key={pet.id}>{pet.name}</option>)}</SelectField></label><label>ดูย้อนหลัง<SelectField value={days} onChange={event => { setDays(Number(event.target.value)); setMessages([]); }}><option value="7">7 วัน</option><option value="30">30 วัน</option><option value="365">365 วัน</option></SelectField></label></div>
      <div className="ai-chat-messages" role="log" aria-label="บทสนทนา AI" aria-live="polite">
        {!messages.length && <div className="ai-chat-empty"><strong>อยากรู้อะไรเกี่ยวกับ{selectedPet?.name || 'ทุกตัวในบ้าน'}?</strong><p>ลองถาม “วันนี้ตัวไหนมีนัดหมาย” “วัคซีนครั้งถัดไปเมื่อไร” หรือ “ช่วงนี้แต่ละตัวกินอาหารเป็นอย่างไร” คำตอบจะอ้างอิงข้อมูลที่บันทึกไว้</p><div className="manage-actions">{['สรุปการดูแลในช่วงที่เลือก','มีรายการไหนต้องติดตามต่อบ้าง','สรุปข้อมูลสุขภาพที่บันทึกไว้'].map(text=><button type="button" className="button ghost" key={text} onClick={()=>{setQuestion(text);inputRef.current?.focus();}}>{text}</button>)}</div></div>}
        {messages.map((message, index) => <article className={`ai-chat-message ai-chat-${message.role}`} key={index}><span className="ai-chat-speaker">{message.role === 'user' ? 'คุณ' : 'ผู้ช่วย AI'}</span><p>{message.content}</p>{message.truncated && <p className="form-error">คำตอบใช้ข้อมูลบางส่วน กรุณาเลือกสัตว์ตัวเดียวหรือช่วงวันที่สั้นลง ข้อมูล</p>}{message.sources?.length > 0 && <details><summary>บันทึกต้นทาง ({message.sources.length})</summary><ul>{message.sources.map(source => <li key={`${source.type}:${source.id}`}><button type="button" onClick={() => { setOpen(false); onOpenSource(source.pet_id || petId, source); }}>{sourceLabel(source)}</button></li>)}</ul></details>}{message.range && <small>{message.range.from} – {message.range.to}</small>}</article>)}
        {busy && <div className="ai-chat-thinking" role="status"><span /><span /><span /><span className="sr-only">กำลังอ่านบันทึกและตอบคำถาม</span></div>}
        <div ref={endRef} />
      </div>
      {enabled === false && <p className="ai-chat-notice" role="status">{statusNotice || 'บริการ AI ยังไม่พร้อมใช้งานในขณะนี้'}</p>}
      {enabled && !consented && <div className="ai-consent-intro"><strong>เปิดใช้ AI สำหรับบัญชีของคุณ</strong><p>เมื่อเปิดใช้ คำถามและบันทึกที่เกี่ยวข้องของสัตว์เลี้ยงในบ้านนี้จะถูกส่งไปยัง ผู้ให้บริการ AI เพื่อสร้างคำตอบ คุณปิดได้ทุกเมื่อในหน้าตั้งค่า</p><button type="button" className="button primary" onClick={acceptConsent} disabled={busy}>{busy ? 'กำลังบันทึก…' : 'ยินยอมและเริ่มถาม'}</button></div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <form className="ai-chat-form" onSubmit={send}><label htmlFor="ai-chat-question">พิมพ์คำถาม</label><textarea id="ai-chat-question" ref={inputRef} value={question} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} maxLength={500} rows={2} disabled={busy || enabled !== true || !consented} placeholder={enabled === false ? 'รอเจ้าของบ้านเปิดใช้งาน AI' : !consented ? 'เปิดใช้ AI ก่อนเริ่มถาม' : `ถามเกี่ยวกับ${selectedPet?.name || 'ทุกตัวในบ้าน'}…`} /><div className="ai-chat-actions"><small>{hourlyLimit === 0 ? 'ถามได้ไม่จำกัด (โหมดทดสอบ)' : `${hourlyLimit} คำขอ/ชั่วโมง`} · 500 ตัวอักษร/คำถาม</small><button type="submit" className="button primary" disabled={busy || enabled !== true || !consented || !question.trim()}>{busy ? 'กำลังตอบ…' : 'ส่งคำถาม'}</button></div></form>
    </section>}
    <button ref={toggleRef} className="ai-chat-toggle" type="button" aria-label={open ? 'ปิดแชต AI' : 'เปิดแชต AI'} aria-expanded={open} onClick={() => setOpen(current => !current)}><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 5.5h16v11H9l-5 3v-14Z"/><path d="M8 9h8M8 12.5h5"/></svg><span>{open ? 'ปิดแชต' : 'ถาม AI'}</span></button>
  </div>;
}
