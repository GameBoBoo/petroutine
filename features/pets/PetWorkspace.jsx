"use client";

import { useState } from 'react';
import HealthRecords from './HealthRecords.jsx';
import PetTimeline from './PetTimeline.jsx';

const TABS = [['overview', 'ภาพรวม'], ['routines', 'กิจวัตร'], ['health', 'สุขภาพ'], ['timeline', 'ไทม์ไลน์']];

export default function PetWorkspace({ pets = [], routines = [], api, onAdd, onEdit, onArchive, isOwner }) {
  const [petId, setPetId] = useState(pets[0]?.id || '');
  const [tab, setTab] = useState('overview');
  const pet = pets.find(item => item.id === petId) || pets[0];
  if (!pet) return <section className="content-card"><div className="empty-state"><h3>ยังไม่มีสัตว์เลี้ยง</h3><button className="button primary" onClick={onAdd}>เพิ่มสัตว์เลี้ยง</button></div></section>;
  return <section className="content-card pet-workspace"><header className="pet-workspace-head"><div><span className="section-kicker">PET WORKSPACE</span><h2>{pet.name}</h2></div><select aria-label="เลือกสัตว์เลี้ยง" value={pet.id} onChange={event => setPetId(event.target.value)}>{pets.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></header><div className="tab-list" role="tablist">{TABS.map(([id, label]) => <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{label}</button>)}</div>{tab === 'overview' && <div className="pet-overview"><h3>ข้อมูลทั่วไป</h3><p>ประเภท: {pet.species === 'cat' ? 'แมว' : 'สุนัข'}</p><p>{pet.notes || 'ยังไม่มีหมายเหตุ'}</p><div className="manage-actions"><button className="button ghost" onClick={() => onEdit(pet)}>แก้ไข</button>{isOwner && <button className="button subtle-danger" onClick={() => onArchive(pet)}>เก็บข้อมูลเก่า</button>}</div></div>}{tab === 'routines' && <div className="routine-list">{routines.filter(item => item.pet_id === pet.id).map(item => <article className="routine-card" key={item.id}><div className="routine-body"><h3>{item.title}</h3><p>{item.activity_type}</p></div></article>)}</div>}{tab === 'health' && <HealthRecords petId={pet.id} api={api} />}{tab === 'timeline' && <PetTimeline petId={pet.id} api={api} />}</section>;
}
