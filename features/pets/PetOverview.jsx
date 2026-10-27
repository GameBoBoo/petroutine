"use client";
import Icon from '../../components/Icon.jsx';

const dateText=value=>value?new Date(`${String(value).slice(0,10)}T00:00:00+07:00`).toLocaleDateString('th-TH',{timeZone:'Asia/Bangkok',day:'numeric',month:'long',year:'numeric'}):'ยังไม่ระบุ';
export default function PetOverview({ pet, routines, isOwner, onEdit, onArchive, onRoutines }) {
  const active=routines.filter(item=>item.pet_id===pet.id&&item.active).length;
  const fields=[['ประเภท',pet.species==='cat'?'แมว':'สุนัข'],['สายพันธุ์',pet.breed||'ยังไม่ระบุ'],['เพศ',pet.sex==='male'?'ผู้':pet.sex==='female'?'เมีย':'ยังไม่ระบุ'],['วันเกิด',dateText(pet.birth_date)],['สถานะทำหมัน',pet.neuter_status==='neutered'?'ทำหมันแล้ว':pet.neuter_status==='not_neutered'?'ยังไม่ทำหมัน':'ยังไม่ระบุ']];
  return <div className="pet-overview-v2">
    <header className="pet-section-heading"><div><h3>ข้อมูลทั่วไป</h3><p>รู้จัก{pet.name} และข้อมูลที่ใช้ดูแลร่วมกัน</p></div><button className="button secondary" onClick={()=>onEdit(pet)}><Icon name="edit" size={17}/>แก้ไขข้อมูล</button></header>
    <div className="pet-overview-layout">
      <section className="pet-info-panel"><h4>ข้อมูลประจำตัว</h4><dl className="pet-facts">{fields.map(([label,value])=><div key={label}><dt>{label}</dt><dd className={value==='ยังไม่ระบุ'?'is-empty':''}>{value}</dd></div>)}</dl></section>
      <div className="pet-overview-aside"><section className="pet-weight-panel"><span className="pet-panel-label">น้ำหนักตั้งต้น</span><div className="pet-weight-value">{pet.baseline_weight_kg?<><strong>{Number(pet.baseline_weight_kg).toLocaleString('th-TH',{maximumFractionDigits:3})}</strong><span>กก.</span></>:<strong className="is-empty">ยังไม่ระบุ</strong>}</div><p>{pet.baseline_weight_recorded_on?`ชั่งเมื่อ ${dateText(pet.baseline_weight_recorded_on)}`:'เพิ่มน้ำหนักและวันที่ชั่งในแก้ไขข้อมูล'}</p></section><button type="button" className="pet-routine-shortcut" onClick={onRoutines}><span className="pet-shortcut-icon"><Icon name="calendar" size={22}/></span><span><strong>ตารางดูแลประจำ</strong><small>เปิดใช้งาน {active} กิจวัตร</small></span><Icon name="chevron" size={18}/></button></div>
    </div>
    <section className="pet-notes-panel"><h4>สิ่งที่คนดูแลควรรู้</h4><p className={pet.notes?'':'is-empty'}>{pet.notes||'ยังไม่มีหมายเหตุเพิ่มเติม'}</p></section>
    {isOwner&&<footer className="pet-overview-footer"><span>จัดการข้อมูลสัตว์เลี้ยง</span><button type="button" className="button danger" onClick={()=>onArchive(pet)}><Icon name="trash" size={17}/>ลบสัตว์เลี้ยง</button></footer>}
  </div>;
}
