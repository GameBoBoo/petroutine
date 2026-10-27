"use client";
import { useState } from 'react';
import Modal from '../../components/Modal.jsx';
import { useConfirmation } from '../../components/ConfirmationProvider.jsx';
import SelectField from '../../components/SelectField.jsx';
import Icon from '../../components/Icon.jsx';

const ACTIONS = [
  { id:'rotate-invite', icon:'history', title:'เปลี่ยนรหัสเชิญ', description:'ใช้เมื่อไม่ต้องการให้รหัสเดิมใช้ได้อีก', detail:'รหัสเดิมจะใช้เข้าร่วมไม่ได้ รหัสใหม่มีอายุ 7 วัน' },
  { id:'remove-member', icon:'user', title:'นำสมาชิกออก', description:'หยุดสิทธิ์เข้าถึงบ้านของสมาชิกคนหนึ่ง', detail:'สมาชิกจะเข้าถึงบ้านไม่ได้ งานที่มอบหมายจะกลับเป็นงานส่วนกลาง ประวัติเดิมยังคงอยู่' },
  { id:'transfer-owner', icon:'arrow', title:'โอนเจ้าของบ้าน', description:'ให้สมาชิกคนอื่นรับหน้าที่เจ้าของบ้าน', detail:'คุณจะเปลี่ยนเป็นสมาชิก ผู้ที่เลือกจะจัดการบ้านแทน และระบบจะเปลี่ยนรหัสเชิญใหม่' },
];
export function MemberTools({ household, members, api, onUpdated }) {
  const confirm = useConfirmation();
  const [action,setAction]=useState(null), [target,setTarget]=useState('');
  const [busy,setBusy]=useState(false), [error,setError]=useState(''), [notice,setNotice]=useState('');
  if(household?.role!=='owner')return null;
  const candidates=members.filter(member=>member.role!=='owner');
  async function submit(event){event.preventDefault();
    if (!await confirm({ title: `${action.title}?`, description: `${members.find(member => member.id === target)?.name || household.name} · ${action.detail}`, confirmLabel: `ยืนยัน${action.title}`, danger: action.id === 'remove-member' })) return;
    setBusy(true);setError('');try{await api(`/households/${household.id}/${action.id}`,{method:'POST',body:JSON.stringify({user_id:target})});setNotice(`${action.title}เรียบร้อยแล้ว`);setAction(null);setTarget('');await onUpdated();}catch(problem){setError(problem.message);}finally{setBusy(false);}}
  return <section className="content-card member-tools">
    <header className="section-header"><div><span className="section-kicker">สำหรับเจ้าของบ้าน</span><h3>สิทธิ์และการเข้าถึง</h3><p>เปลี่ยนรหัสเชิญหรือจัดการสมาชิกเมื่อจำเป็น</p></div></header>
    {notice&&<p role="status" className="settings-success">{notice}</p>}
    <div className="member-tool-list">{ACTIONS.map(item=><button type="button" key={item.id} className={`member-tool-action${item.id === 'remove-member' ? ' member-tool-caution' : ''}`} disabled={busy||(item.id!=='rotate-invite'&&!candidates.length)} onClick={()=>{setAction(item);setTarget('');setError('');setNotice('');}}><span className="member-tool-icon"><Icon name={item.icon} size={20}/></span><span><strong>{item.title}</strong><small>{item.description}</small></span><Icon name="chevron" size={18}/></button>)}</div>
    {!candidates.length&&<p className="muted member-tool-hint">เมื่อมีสมาชิกคนอื่น จะสามารถนำสมาชิกออกหรือโอนเจ้าของบ้านได้</p>}
    {action&&<Modal title={action.title} description={action.detail} onClose={()=>{if(!busy)setAction(null);}}><form onSubmit={submit} className="form-stack">
      {action.id!=='rotate-invite'&&<label>สมาชิก<SelectField required value={target} disabled={busy} onChange={event=>setTarget(event.target.value)}><option value="">เลือกสมาชิก</option>{candidates.map(member=><option key={member.id} value={member.id} data-description={member.email}>{member.name}</option>)}</SelectField></label>}
      {error&&<p role="alert" className="form-error">{error}</p>}
      <div className="form-actions"><button type="button" className="button ghost" disabled={busy} onClick={()=>setAction(null)}>ยกเลิก</button><button className={`button ${action.id==='remove-member'?'danger':'primary'}`} disabled={busy||(action.id!=='rotate-invite'&&!target)}>{busy?'กำลังดำเนินการ…':'ยืนยัน'}</button></div>
    </form></Modal>}
  </section>;
}
