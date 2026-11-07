"use client";

import Icon from '../../components/Icon.jsx';

const METRICS = { food_intake: 'การกินอาหาร', water_intake: 'การดื่มน้ำ', activity_level: 'กิจกรรม', sleep_amount: 'การนอน', stool_condition: 'การขับถ่าย', mood: 'อารมณ์', weight_kg: 'น้ำหนัก' };
const SOURCES = { wellness: 'เช็กอินรายวัน', wellness_alert: 'การเปลี่ยนแปลงสุขภาวะ', task: 'งานดูแล', care_entry: 'บันทึกการดูแล', health_record: 'ข้อมูลสุขภาพ', pet_profile: 'ข้อมูลสัตว์เลี้ยง', passport: 'สมุดสุขภาพ', routine: 'กิจวัตร' };
const dateOnly = value => String(value || '').slice(0, 10);
const today = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Bangkok' }).format(new Date());
const daysBefore = (date, count) => new Date(Date.parse(`${date}T00:00:00Z`) - count * 86400000).toISOString().slice(0, 10);
const readableAnswer = value => String(value || '').replace(/\s*\[(?:[0-9a-f]{8}-[0-9a-f-]{27,}(?:,\s*)?)+\]/gi, '');

export default function AiCareBrief({ api, householdId, pets, toolState = {}, onToolStateChange, onOpenAlert, onOpenSource, onOpenSettings, onOpenChat }) {
  const { status = null, opened = false, checking = false, loadError = '', alerts = [], mode = '', insight = null, busy = false, error = '', generatedAt = null } = toolState;
  const update = patch => onToolStateChange(previous => ({ ...previous, ...patch }));

  async function openTools() {
    if (checking) return;
    update({ opened: true, checking: true, loadError: '', status: null });
    try {
      const settings = await api(`/households/${householdId}/ai-settings`);
      update({ status: settings.settings });
      const results = await Promise.allSettled(pets.map(pet => api(`/pets/${pet.id}/wellness-alerts?status=active&limit=3`)));
      if (results.every(result => result.status === 'rejected')) throw new Error('ไม่สามารถโหลดข้อมูลการดูแลได้');
      update({ alerts: results.flatMap((result, index) => result.status === 'fulfilled' ? (result.value.items || []).map(alert => ({ ...alert, pet: pets[index] })) : []).sort((a, b) => dateOnly(b.observation_end).localeCompare(dateOnly(a.observation_end))).slice(0, 3) });
    } catch { update({ loadError: 'เชื่อมต่อบริการ AI หรือข้อมูลการดูแลไม่สำเร็จ กรุณาลองอีกครั้ง' }); }
    finally { update({ checking: false }); }
  }

  async function summarize(force = false) {
    if (busy) return;
    if (insight && !force) { update({ mode: 'handover', error: '' }); return; }
    update({ mode: 'handover', error: '', busy: true });
    const to = today();
    const question = 'สรุปส่งต่อการดูแลแต่ละตัว: สิ่งที่เปลี่ยนไปและเรื่องที่ยังติดตาม ตอบสั้นไม่เกิน 700 ตัวอักษร ไม่ต้องแจกแจงงานประจำวัน';
    try {
      const result = await api(`/households/${householdId}/ai-insights`, { method: 'POST', body: JSON.stringify({ intent: 'chat_question', brief: true, question, from: daysBefore(to, 29), to, history: [] }) });
      update({ insight: result.insight, generatedAt: new Date().toISOString() });
    } catch (problem) { update({ error: problem.status >= 500 || !problem.status ? 'บริการ AI ขัดข้องหรือไม่ตอบกลับ ยังไม่มีการเรียกซ้ำอัตโนมัติ กรุณาลองใหม่ภายหลัง' : problem.message || 'สรุปข้อมูลไม่สำเร็จ' }); }
    finally { update({ busy: false }); }
  }

  if (!pets.length) return null;
  const available = Boolean(status?.enabled && status?.available && status?.consented);
  return <section className="ai-care-brief" aria-labelledby="ai-care-brief-title">
    <div className="ai-care-brief-head"><div><span className="section-kicker">ผู้ช่วยดูแล</span><h2 id="ai-care-brief-title">เรื่องที่ควรรู้ในบ้านวันนี้</h2><p>{opened ? 'จับประเด็นจากบันทึกที่มีอยู่ เปิดดูที่มาได้ทุกเรื่อง' : 'เปิดเมื่ออยากดูประเด็นสำคัญหรือขอให้ AI ช่วยสรุป'}</p></div><span className="ai-care-brief-mark" aria-hidden="true"><Icon name="sparkle" size={23} /></span></div>
    {!opened ? <button type="button" className="button secondary ai-care-open" onClick={openTools}>เปิดเครื่องมือช่วยดูแล</button> : checking ? <p className="ai-care-quiet" role="status">กำลังตรวจข้อมูลที่บันทึกไว้…</p> : loadError ? <div className="ai-care-consent" role="alert"><p>{loadError}</p><button type="button" className="button secondary" onClick={openTools}>ลองอีกครั้ง</button></div> : <>
    {alerts.length ? <div className="ai-care-signals">{alerts.map(alert => <button type="button" key={alert.id} onClick={() => onOpenAlert(alert.pet.id)}><span className="ai-care-signal-dot" aria-hidden="true"/><span><strong>{alert.pet.name} · {METRICS[alert.metric] || METRICS[alert.metric_key] || 'สุขภาวะ'}</strong><small>{alert.evidence?.rule_text || alert.rule_text || 'มีข้อมูลที่เปลี่ยนไปจากค่าปกติส่วนตัว'} · ดูบันทึกต้นทาง</small></span><Icon name="chevron" size={17}/></button>)}</div> : <p className="ai-care-quiet">ยังไม่มีรายการเปลี่ยนแปลงที่ต้องติดตามจากข้อมูลที่บันทึกไว้</p>}
    {available ? <div className="ai-care-actions"><button type="button" className="button secondary" disabled={busy} onClick={() => summarize()}>{insight ? 'ดูสรุปล่าสุด' : 'สรุปส่งต่อคนในบ้าน'}</button><button type="button" className="button ghost" onClick={onOpenChat}>ถาม AI เพิ่มเติม</button></div> : <div className="ai-care-consent" role="status"><p>{!status?.enabled ? 'บ้านนี้ยังไม่ได้เปิดใช้ AI' : !status.available ? 'บริการ AI ยังไม่พร้อมใช้งานในขณะนี้ กรุณาลองใหม่ภายหลัง' : 'บัญชีนี้ยังไม่ได้ให้ความยินยอมใช้ AI'}</p>{(!status?.enabled || !status.consented) && <button type="button" className="button secondary" onClick={onOpenSettings}>ดูการตั้งค่า AI</button>}</div>}
    {mode && <div className="ai-care-result" role="status"><div className="ai-care-result-head"><h3>สรุปส่งต่อการดูแล</h3>{generatedAt && <small>อัปเดตเมื่อ {new Date(generatedAt).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}</small>}{insight && <button type="button" className="button secondary" disabled={busy} onClick={() => summarize(true)}>อัปเดตสรุป</button>}<button type="button" className="icon-button" aria-label="ปิดสรุป" onClick={() => { update({ mode: '', error: '' }); }}><Icon name="close" size={17}/></button></div>{busy ? <p>กำลังอ่านบันทึก…</p> : error ? <p className="form-error">{error}</p> : insight && <><p className="ai-care-answer">{readableAnswer(insight.answer)}</p>{insight.truncated && <p className="muted">ข้อมูลมีจำนวนมาก ควรเลือกสัตว์เลี้ยงรายตัวในแชตหากต้องการรายละเอียดเพิ่มเติม</p>}{insight.sources?.length > 0 && <div className="ai-care-sources"><strong>บันทึกที่ใช้อ้างอิง</strong>{insight.sources.map(source => <button type="button" key={`${source.type}:${source.id}`} onClick={() => onOpenSource(source.pet_id, source)}>{source.pet_name || 'สัตว์เลี้ยง'} · {source.title || METRICS[source.category] || SOURCES[source.type] || 'เปิดบันทึก'} <Icon name="arrow" size={14}/></button>)}</div>}</>}</div>}
    <p className="ai-care-footnote">จำสถานะและสรุปไว้ระหว่างสลับหน้า ดูสรุปซ้ำได้โดยไม่เรียก AI เพิ่ม กด “อัปเดตสรุป” เมื่อต้องการใช้ข้อมูลใหม่</p></>}
  </section>;
}
