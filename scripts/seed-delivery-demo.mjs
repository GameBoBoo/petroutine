import crypto from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

if (process.env.DEMO_CONFIRM_SYNTHETIC !== 'yes') throw new Error('Set DEMO_CONFIRM_SYNTHETIC=yes only for an isolated delivery environment');
const base = process.env.DEMO_BASE_URL;
if (!base || !/^http:\/\/(?:127\.0\.0\.1|localhost):(?:3000|3300)\/?$/.test(base)) throw new Error('Set DEMO_BASE_URL to the isolated loopback Course web URL');
async function call(method, path, token, body) {
  const response = await fetch(`${base.replace(/\/$/, '')}/api/v1/${path}`, {
    method, headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20_000),
  });
  const value = await response.json();
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status} ${value.error?.code || ''}`);
  return value;
}
const suffix = crypto.randomBytes(6).toString('hex');
const password = crypto.randomBytes(16).toString('hex');
const ownerEmail = `demo-owner-${suffix}@example.com`;
const memberEmail = `demo-member-${suffix}@example.com`;
const owner = await call('POST', 'auth/register', null, { name: 'เจ้าของ (Demo)', email: ownerEmail, password });
const member = await call('POST', 'auth/register', null, { name: 'สมาชิก (Demo)', email: memberEmail, password });
const { household } = await call('POST', 'households', owner.token, { name: 'บ้านโมจิ · ข้อมูลสมมติ' });
await call('POST', 'households/join', member.token, { invite_code: household.invite_code });
const { pet } = await call('POST', `households/${household.id}/pets`, owner.token, { name: 'โมจิ', species: 'cat', breed: 'แมวบ้าน', sex: 'female', neuter_status: 'neutered' });
await call('POST', `pets/${pet.id}/routines`, owner.token, { title: 'ให้อาหารโมจิ', activity_type: 'feeding', schedule: { type: 'weekly', times: ['08:00', '23:59'], days: [0, 1, 2, 3, 4, 5, 6] } });
const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Bangkok' }).format(new Date());
const shift = amount => new Date(Date.parse(`${today}T00:00:00Z`) + amount * 86_400_000).toISOString().slice(0, 10);
for (let day = -17; day < 0; day++) {
  await call('POST', `pets/${pet.id}/wellness-logs`, owner.token, { recorded_at: `${shift(day)}T08:00:00+07:00`, activity_level: day < -3 ? 'usual' : 'low', food_intake: 'usual', weight_kg: 4.2, notes: 'ข้อมูลสมมติสำหรับสาธิต ไม่ใช่ผลติดตามสัตว์จริง' });
}
await call('POST', `pets/${pet.id}/passport`, owner.token, { entry_type: 'vaccination', title: 'กำหนดวัคซีน (Demo)', next_due_date: today });
await call('POST', `pets/${pet.id}/passport`, owner.token, { entry_type: 'appointment', title: 'นัดหมาย (Demo)', next_due_date: shift(3) });
const { items } = await call('GET', `pets/${pet.id}/wellness-alerts`, owner.token);
const alert = items.find(item => item.metric === 'activity_level');
if (!alert) throw new Error('Synthetic activity alert was not generated');
await call('PATCH', `wellness-alerts/${alert.id}/follow-up`, owner.token, { assigned_user_id: member.user.id, follow_up_due_date: today, follow_up_note: 'สังเกตกิจกรรมหลังอาหารเย็น (ข้อมูลสมมติ)' });
await mkdir('artifacts', { recursive: true });
await writeFile('artifacts/demo-access.json', JSON.stringify({ url: base, synthetic_only: true, owner: { email: ownerEmail, password }, member: { email: memberEmail, password }, household_id: household.id, pet_id: pet.id, ai_enabled: false }, null, 2) + '\n', { mode: 0o600 });
console.log('Demo prepared: 2 synthetic accounts, 1 household/pet, routine, 17 wellness logs, due dates and shared follow-up. Private login details: artifacts/demo-access.json');
