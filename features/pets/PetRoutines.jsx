"use client";
import Icon from '../../components/Icon.jsx';
import { RoutineRows } from '../routines/RoutinesView.jsx';
export default function PetRoutines({pet,routines,members,isOwner,busy,onAdd,onEdit,onArchive}) {
 const items=routines.filter(item=>item.pet_id===pet.id);
 return <section className="pet-routine-workspace"><header className="pet-routine-heading"><div><h3>กิจวัตรของ{pet.name}</h3><p>{items.length} รายการ · ตารางดูแลและผู้รับผิดชอบ</p></div>{isOwner&&<button type="button" className="button primary" onClick={()=>onAdd(pet)}><Icon name="plus" size={18}/>เพิ่มกิจวัตร</button>}</header><RoutineRows routines={items} pets={[pet]} members={members} isOwner={isOwner} busy={busy} onEdit={onEdit} onArchive={onArchive} showPet={false}/>{!items.length&&<p className="muted">ยังไม่มีกิจวัตร เพิ่มตารางดูแลเพื่อเริ่มใช้งาน</p>}</section>;
}
