export const ROUTINE_TEMPLATES = [
  { id: 'breakfast', name: 'อาหารเช้า', title: 'ให้อาหารเช้า', activity_type: 'feeding', times: ['08:00'] },
  { id: 'dinner', name: 'อาหารเย็น', title: 'ให้อาหารเย็น', activity_type: 'feeding', times: ['18:00'] },
  { id: 'water', name: 'เติมน้ำ', title: 'เติมน้ำสะอาด', activity_type: 'water', times: ['08:00', '18:00'] },
  { id: 'walk', name: 'เดินเล่น', title: 'พาเดินเล่น', activity_type: 'walk', times: ['17:30'] },
  { id: 'grooming', name: 'ดูแลขน', title: 'แปรงขน', activity_type: 'grooming', times: ['19:00'] },
  { id: 'medication', name: 'บันทึกยา', title: 'บันทึกการให้ยา', activity_type: 'medication', times: ['09:00'] },
  { id: 'vet', name: 'นัดสัตวแพทย์', title: 'นัดสัตวแพทย์', activity_type: 'vet', times: ['10:00'], scheduleType: 'once' },
];

export function getRoutineTemplate(id) { return ROUTINE_TEMPLATES.find(item => item.id === id) || null; }
