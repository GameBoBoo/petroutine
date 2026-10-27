"use client";
import PetAvatar from '../../components/PetAvatar.jsx';
import Icon from '../../components/Icon.jsx';

import { useState } from 'react';
import HealthRecords from './HealthRecords.jsx';
import PassportEntries from './PassportEntries.jsx';
import PetTimeline from './PetTimeline.jsx';
import WellnessLogs from './WellnessLogs.jsx';
import WellnessDashboard from './WellnessDashboard.jsx';
import VetReport from './VetReport.jsx';
import PetRoutines from './PetRoutines.jsx';
import PetOverview from './PetOverview.jsx';

const TABS = [['overview', 'ภาพรวม'], ['routines', 'กิจวัตร'], ['health', 'สุขภาพ'], ['timeline', 'ไทม์ไลน์'], ['report', 'รายงานสัตวแพทย์']];
const HEALTH_TABS = [['summary', 'ภาพรวมสุขภาพ'], ['checkins', 'เช็กอินรายวัน'], ['profile', 'ข้อมูลสุขภาพ'], ['events', 'บันทึกเหตุการณ์']];

export default function PetWorkspace({ onUpdated, pet, pets = [], routines = [], members = [], api, isOwner, onAdd, onAddHealthEvent, onEdit, onArchive, onOpenRoutine, onEditRoutine, onToggleRoutine, onArchiveRoutine, busy, initialPetId, initialTab = 'overview', initialHealthTab = 'summary', initialSource = null }) {
  const [petId, setPetId] = useState(initialPetId || pet?.id || '');
  const [tab, setTab] = useState(initialTab);
  const [healthTab, setHealthTab] = useState(initialHealthTab);
  const [timelineSource, setTimelineSource] = useState(initialSource);
  const activePet = pets.find(item => item.id === petId) || pet;
  if (!activePet) return <section className="content-card pet-workspace pet-workspace-empty"><div className="empty-state"><span className="empty-icon"><Icon name="paw" size={29} /></span><h2>เริ่มจากเพิ่มสัตว์เลี้ยง</h2><p>เพิ่มสุนัขหรือแมวตัวแรก แล้วจัดการข้อมูล กิจวัตร และสุขภาพได้ที่นี่</p><button type="button" className="button primary" onClick={onAdd}><Icon name="plus" size={18} />เพิ่มสัตว์เลี้ยง</button></div></section>;
  const selectTab = next => { setTab(next); };

  return <section className="content-card pet-workspace">
    <header className="pet-workspace-head"><div className="pet-workspace-identity"><PetAvatar pet={activePet} size="large" /><div><span className="section-kicker">สัตว์เลี้ยงในบ้าน · {pets.length} ตัว</span><h2>{activePet.name}</h2><p>เลือกเพื่อนในบ้านด้านล่างเพื่อดูข้อมูลของแต่ละตัว</p></div></div><button type="button" className="button primary pet-workspace-add" onClick={onAdd}><Icon name="plus" size={18} />เพิ่มสัตว์เลี้ยง</button></header>
    <div className="pet-switcher" role="group" aria-label="เลือกสัตว์เลี้ยง">{pets.map(item => <button key={item.id} type="button" className={`pet-switcher-item${item.id === activePet.id ? ' active' : ''}`} aria-pressed={item.id === activePet.id} onClick={() => setPetId(item.id)}><PetAvatar pet={item} /><span><strong>{item.name}</strong><small>{item.species === 'cat' ? 'แมว' : 'สุนัข'}</small></span>{item.id === activePet.id && <Icon name="check" size={17} />}</button>)}</div>
    <div className="tab-list" role="tablist" aria-label="หมวดข้อมูลสัตว์เลี้ยง">{TABS.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => selectTab(id)}>{label}</button>)}</div>
    {tab === 'overview' && <PetOverview pet={activePet} routines={routines} isOwner={isOwner} onEdit={onEdit} onArchive={onArchive} onRoutines={()=>setTab('routines')}/> }
    {tab === 'routines' && <PetRoutines key={activePet.id} pet={activePet} routines={routines} members={members} isOwner={isOwner} busy={busy} onAdd={onOpenRoutine} onEdit={onEditRoutine} onToggle={onToggleRoutine} onArchive={onArchiveRoutine}/>}
    {tab === 'health' && <section className="pet-health-hub"><header className="health-hub-heading"><div><h3>สุขภาพของ{activePet.name}</h3><p>เช็กอินเพื่อบันทึกสิ่งที่สังเกต ข้อมูลสุขภาพเก็บประวัติและกำหนดนัดหมาย</p></div></header><div className="tab-list health-tab-list" role="tablist" aria-label="หมวดสุขภาพ">{HEALTH_TABS.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={healthTab === id} onClick={() => setHealthTab(id)}>{label}</button>)}</div>{healthTab === 'summary' && <WellnessDashboard petId={activePet.id} api={api} onOpenCheckIn={() => setHealthTab('checkins')} />}{healthTab === 'checkins' && <WellnessLogs petId={activePet.id} members={members} api={api} />}{healthTab === 'profile' && <PassportEntries petId={activePet.id} api={api} />}{healthTab === 'events' && <HealthRecords petId={activePet.id} api={api} onAdd={() => onAddHealthEvent?.(activePet)} />}</section>}
    {tab === 'timeline' && <PetTimeline petId={activePet.id} api={api} focusSource={timelineSource} />}
    {tab === 'report' && <VetReport petId={activePet.id} api={api} />}
  </section>;
}
