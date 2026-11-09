import crypto from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

const confirmation = process.env.SEED_CONFIRM_SYNTHETIC;
const base = process.env.SEED_BASE_URL || 'http://127.0.0.1:3000';
if (confirmation !== 'yes') {
  throw new Error('Set SEED_CONFIRM_SYNTHETIC=yes to create a synthetic test household. Existing data is never deleted.');
}
const parsedBase = new URL(base);
if (parsedBase.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(parsedBase.hostname)
  || !['3000', '3001', '3300'].includes(parsedBase.port)) {
  throw new Error('SEED_BASE_URL must be a local PetRoutine URL on port 3000, 3001, or 3300.');
}

const root = base.replace(/\/$/, '');
const suffix = crypto.randomBytes(5).toString('hex');
const password = crypto.randomBytes(18).toString('base64url');
const accessFile = `artifacts/test-seed-${suffix}.json`;
const today = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());
const bangkokClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
}).format(new Date());
const shiftDate = (date, offset) => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
};
const at = (date, time = '08:00') => `${date}T${time}:00+07:00`;
const records = {};
let accessSnapshot = {};

async function saveAccessFile() {
  await mkdir('artifacts', { recursive: true });
  await writeFile(accessFile, JSON.stringify({
    synthetic_only: true, base_url: root,
    users: accessSnapshot.users || null,
    household: accessSnapshot.household || null,
    pets: accessSnapshot.pets || null,
    records, generated_at: new Date().toISOString(),
    ...(accessSnapshot.ai ? { ai: accessSnapshot.ai } : {}),
  }, null, 2) + '\n', { mode: 0o600 });
}

async function call(method, path, token, body, headers = {}) {
  const response = await fetch(`${root}/api/v1/${path}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(20_000),
  });
  const value = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${method} /api/v1/${path}: HTTP ${response.status} ${value.error?.code || ''} ${value.error?.message || ''}`);
  }
  return value;
}

async function post(path, token, body) { return call('POST', path, token, body); }

const owner = await post('auth/register', null, {
  name: `เจ้าของทดสอบ ${suffix}`,
  email: `seed-owner-${suffix}@example.test`,
  password,
});
const member = await post('auth/register', null, {
  name: `สมาชิกทดสอบ ${suffix}`,
  email: `seed-member-${suffix}@example.test`,
  password,
});
const outsider = await post('auth/register', null, {
  name: `คนนอกบ้านทดสอบ ${suffix}`,
  email: `seed-outsider-${suffix}@example.test`,
  password,
});
accessSnapshot.users = {
  owner: { email: owner.user.email, password, token: owner.token },
  member: { email: member.user.email, password, token: member.token },
  outsider: { email: outsider.user.email, password, token: outsider.token },
};
await saveAccessFile();

const createdHome = await post('households', owner.token, { name: `บ้านทดสอบ PawRoutine ${suffix}` });
const home = createdHome.household;
accessSnapshot.household = { id: home.id, name: home.name };
await saveAccessFile();
await post('households/join', member.token, { invite_code: home.invite_code });
const archivedHome = await post('households', owner.token, { name: `บ้านเก็บถาวรทดสอบ ${suffix}` });
await post(`households/${archivedHome.household.id}/archive`, owner.token, {});
records.archived_household_id = archivedHome.household.id;
const createdDog = await post(`households/${home.id}/pets`, owner.token, {
  name: 'โมจิ', species: 'dog', breed: 'ชิบะ (ข้อมูลสมมติ)', sex: 'female',
  neuter_status: 'neutered', birth_date: shiftDate(today, -900),
  baseline_weight_kg: 9.4, baseline_weight_recorded_on: shiftDate(today, -30),
  vet_contact: 'คลินิกตัวอย่าง 02-000-0000', notes: 'ข้อมูลสังเคราะห์สำหรับทดสอบเท่านั้น',
});
const dog = createdDog.pet;
const createdCat = await post(`households/${home.id}/pets`, owner.token, {
  name: 'ข้าวปั้น', species: 'cat', breed: 'แมวบ้าน', sex: 'male', neuter_status: 'unknown',
  notes: 'โปรไฟล์สัตว์ตัวที่สองสำหรับทดสอบตัวกรอง',
});
const cat = createdCat.pet;
const createdArchivedPet = await post(`households/${home.id}/pets`, owner.token, {
  name: 'ลัคกี้ · เก็บถาวร', species: 'cat', notes: 'ตัวอย่างสำหรับทดสอบถังเก็บข้อมูล',
});
await post(`pets/${createdArchivedPet.pet.id}/archive`, owner.token, {});
records.archived_pet_id = createdArchivedPet.pet.id;
accessSnapshot.pets = { dog, cat };
records.household_id = home.id;
records.pet_ids = [dog.id, cat.id];
await saveAccessFile();

const routines = [];
for (const [title, activity_type, time, assignee] of [
  ['ให้อาหารเช้า · ทดสอบ', 'feeding', '06:15', owner.user.id],
  ['พาเดิน · ทดสอบ', 'walk', '07:15', member.user.id],
  ['เติมน้ำ · ทดสอบ', 'water', '08:15', null],
]) {
  const result = await post(`pets/${dog.id}/routines`, owner.token, {
    title, activity_type,
    schedule: { type: 'weekly', times: [time], days: [0, 1, 2, 3, 4, 5, 6] },
    assigned_user_id: assignee,
    instructions: 'กิจวัตรสมมติสำหรับตรวจ Today, Calendar, การมอบหมาย และประวัติ',
  });
  routines.push(result.routine);
}
const intervalRoutine = await post(`pets/${cat.id}/routines`, owner.token, {
  title: 'แปรงขนทุก 3 วัน · ทดสอบ', activity_type: 'grooming',
  schedule: { type: 'interval', interval_days: 3, start_date: shiftDate(today, -1), times: ['18:00'] },
  instructions: 'ตัวอย่างกิจวัตรแบบช่วงวัน',
});
routines.push(intervalRoutine.routine);
await post(`routines/${intervalRoutine.routine.id}/archive`, owner.token, {});
records.archived_routine_id = intervalRoutine.routine.id;
const onceRoutine = await post(`pets/${dog.id}/routines`, owner.token, {
  title: 'นัดเล่นครั้งเดียว · ทดสอบ', activity_type: 'other',
  schedule: { type: 'once', date: today, times: ['23:55'] },
});
routines.push(onceRoutine.routine);
records.routine_ids = routines.map(item => item.id);

const taskList = await call('GET', `households/${home.id}/tasks/today`, owner.token);
const routineTasks = taskList.tasks.filter(task => task.source_type === 'task' && task.status === 'pending');
if (routineTasks.length < 3) throw new Error('Today did not materialize the expected routine tasks; check schedule/API response.');
const taskDone = routineTasks.find(task => task.title.includes('ให้อาหารเช้า')) || routineTasks[0];
const taskSkipped = routineTasks.find(task => task.id !== taskDone.id && task.title.includes('พาเดิน')) || routineTasks.find(task => task.id !== taskDone.id);
const taskPending = routineTasks.find(task => task.id !== taskDone.id && task.id !== taskSkipped.id);
const done = await post(`tasks/${taskDone.id}/complete`, owner.token, {
  expected_version: taskDone.mutation_version, notes: 'ข้อมูลทดสอบ: บันทึกเสร็จแล้ว',
}, { 'idempotency-key': crypto.randomUUID() });
await post(`tasks/${taskSkipped.id}/skip`, member.token, {
  expected_version: taskSkipped.mutation_version, skip_reason: 'ข้อมูลทดสอบ: ทดลองสถานะข้าม',
}, { 'idempotency-key': crypto.randomUUID() });
if (taskPending) {
  await call('PATCH', `tasks/${taskPending.id}`, owner.token, {
    expected_version: taskPending.mutation_version,
    action: 'reassign', assigned_user_id: member.user.id,
  }, { 'idempotency-key': crypto.randomUUID() });
}
records.task_ids = routineTasks.map(task => task.id);
records.undo_activity_id = done.activity?.id || null;

const activeCareEntry = await post(`households/${home.id}/care-entries`, owner.token, {
  pet_id: dog.id, title: 'เช็ดตัวหลังเดิน · ทดสอบ', activity_type: 'grooming',
  occurred_at: at(today, bangkokClock), notes: 'รายการดูแลที่บันทึกนอกกิจวัตร (ข้อมูลสมมติ)',
});
await post(`care-entries/${activeCareEntry.entry.id}/archive`, owner.token, {});
records.archived_care_entry_id = activeCareEntry.entry.id;
await post(`households/${home.id}/care-entries`, owner.token, {
  pet_id: cat.id, title: 'เติมน้ำ · ทดสอบ', activity_type: 'water',
  occurred_at: at(shiftDate(today, -1), '19:00'), notes: 'บันทึกอีกวันเพื่อทดสอบ Timeline/History',
});

const health = [];
for (const input of [
  { record_type: 'weight', title: 'ชั่งน้ำหนัก · ทดสอบ', recorded_at: at(shiftDate(today, -2)), numeric_value: 9.5, unit: 'kg', details: 'ค่าตัวอย่าง ไม่ใช่ข้อมูลสัตว์จริง' },
  { record_type: 'observation', title: 'สังเกตอาการ · ทดสอบ', recorded_at: at(shiftDate(today, -1)), details: 'สังเคราะห์เพื่อทดสอบบันทึกสุขภาพ' },
  { record_type: 'appointment', title: 'นัดตรวจวันนี้ · ทดสอบ', recorded_at: at(today, '12:00'), details: 'กำหนดวันนี้สำหรับทดสอบผลนัด' },
]) {
  const result = await post(`pets/${dog.id}/health-records`, owner.token, input);
  health.push(result.record);
}
const archivedObservation = await post(`pets/${dog.id}/health-records`, owner.token, {
  record_type: 'observation', title: 'บันทึกเก็บถาวร · ทดสอบ', recorded_at: at(shiftDate(today, -3)),
  details: 'รายการสมมติสำหรับทดสอบหน้าข้อมูลเก็บถาวร',
});
await post(`health-records/${archivedObservation.record.id}/archive`, owner.token, {});
records.archived_health_record_id = archivedObservation.record.id;
records.health_record_ids = health.map(item => item.id);

const passport = [];
for (const input of [
  { entry_type: 'allergy', title: 'ประวัติแพ้อาหาร · ทดสอบ', details: 'ระเบียนสมมติสำหรับสมุดสุขภาพ' },
  { entry_type: 'condition', title: 'ข้อมูลสุขภาพเดิม · ทดสอบ', details: 'ไม่มีการวินิจฉัย ใช้ทดสอบช่องข้อมูลเท่านั้น' },
  { entry_type: 'medication', title: 'ยาประจำ · ทดสอบ', details: 'ข้อมูลสมมติ ไม่ใช่คำแนะนำการใช้ยา', start_date: shiftDate(today, -5), end_date: shiftDate(today, 5) },
  { entry_type: 'vaccination', title: 'วัคซีนวันนี้ · ทดสอบ', details: 'กำหนดวันนี้สำหรับทดสอบ complete/skip', next_due_date: today },
  { entry_type: 'vaccination', title: 'วัคซีนใกล้ถึงกำหนด · ทดสอบ', details: 'กำหนดแจ้งเตือนล่วงหน้า', next_due_date: shiftDate(today, 7) },
  { entry_type: 'appointment', title: 'นัดสัตวแพทย์ · ทดสอบ', details: 'นัดในอนาคตสำหรับแจ้งเตือนและ Calendar', next_due_date: shiftDate(today, 14) },
]) {
  const result = await post(`pets/${dog.id}/passport`, owner.token, input);
  passport.push(result.entry);
}
const archivedPassport = passport.find(entry => entry.entry_type === 'allergy');
await post(`passport/${archivedPassport.id}/archive`, owner.token, {});
records.archived_passport_entry_id = archivedPassport.id;
records.passport_entry_ids = passport.map(item => item.id);
const outcomeItems = passport.filter(entry => entry.entry_type === 'vaccination' && entry.next_due_date === today);
for (const [index, entry] of outcomeItems.entries()) {
  const action = index === 0 ? 'complete' : 'skip';
  await post(`scheduled-health/passport_due/${entry.id}/${action}`, member.token,
    action === 'skip' ? { skip_reason: 'ข้อมูลทดสอบ: เลื่อนกำหนด' } : {});
}

for (let day = -16; day <= 0; day += 1) {
  const date = shiftDate(today, day);
  const anomaly = day >= -2;
  await post(`pets/${dog.id}/wellness-logs`, day % 2 === 0 ? owner.token : member.token, {
    recorded_at: at(date, date === today ? bangkokClock : '08:00'),
    food_intake: anomaly ? 'low' : 'usual', water_intake: 'usual',
    activity_level: anomaly ? 'low' : 'usual', sleep_amount: 'usual',
    stool_condition: 'normal', mood: anomaly ? 'quiet' : 'usual',
    weight_kg: 9.4 + Math.max(0, day + 16) * 0.005,
    notes: anomaly ? 'ข้อมูลสังเคราะห์: ตัวชี้วัดเปลี่ยนเล็กน้อย' : 'ข้อมูลสังเคราะห์สำหรับ baseline 14 วัน',
  });
}
const wellnessAlerts = await call('GET', `pets/${dog.id}/wellness-alerts?status=active`, owner.token);
const alert = wellnessAlerts.items?.[0];
if (alert) {
  await call('PATCH', `wellness-alerts/${alert.id}/follow-up`, owner.token, {
    assigned_user_id: member.user.id, follow_up_due_date: today,
    follow_up_note: 'ทดสอบการติดตามร่วมกันในบ้าน',
  });
  records.wellness_alert_id = alert.id;
}

// Dismiss one reminder for the member only, leaving the owner's reminder visible.
const memberNotifications = await call('GET', `households/${home.id}/notifications`, member.token);
if (memberNotifications.notifications?.length) {
  await post(`households/${home.id}/notifications/dismiss`, member.token, {
    notification_key: memberNotifications.notifications[0].notification_key,
  });
}

await call('PATCH', 'auth/settings', owner.token, {
  notifications_enabled: true, lead_minutes: 60, health_reminder_days: 30,
});
await call('PATCH', 'auth/settings', member.token, {
  notifications_enabled: true, lead_minutes: 60, health_reminder_days: 30,
});

// AI is external and optional. Only set up consent when a provider is already configured;
// this seed never sends a prompt or calls a model.
let ai = { provider_ready: false, insight_requests_created: 0 };
const aiStatus = await call('GET', `households/${home.id}/ai-settings`, owner.token);
if (aiStatus.settings?.provider_ready) {
  await call('PATCH', `households/${home.id}/ai-settings`, owner.token, { enabled: true });
  await call('PATCH', `households/${home.id}/ai-consent`, owner.token, { consented: true });
  await call('PATCH', `households/${home.id}/ai-consent`, member.token, { consented: true });
  ai = { provider_ready: true, household_enabled: true, owner_and_member_consented: true, insight_requests_created: 0 };
}

// Read-only feature endpoints provide a quick check that the generated records are connected.
const checks = {
  household: await call('GET', `households/${home.id}`, owner.token),
  members: await call('GET', `households/${home.id}/members`, member.token),
  pets: await call('GET', `households/${home.id}/pets`, owner.token),
  calendar: await call('GET', `households/${home.id}/calendar?from=${shiftDate(today, -7)}&to=${shiftDate(today, 21)}`, owner.token),
  history: await call('GET', `households/${home.id}/history?from=${shiftDate(today, -17)}&to=${today}`, owner.token),
  notifications: await call('GET', `households/${home.id}/notifications`, owner.token),
  timeline: await call('GET', `pets/${dog.id}/timeline`, owner.token),
  wellnessBaseline: await call('GET', `pets/${dog.id}/wellness-baseline?as_of=${today}`, owner.token),
  wellnessDashboard: await call('GET', `pets/${dog.id}/wellness-dashboard?range=30&as_of=${today}`, owner.token),
  vetReport: await call('GET', `pets/${dog.id}/vet-report?from=${shiftDate(today, -17)}&to=${today}`, owner.token),
  activity: await call('GET', `households/${home.id}/activity`, owner.token),
  archivedItems: await call('GET', `households/${home.id}/archived-items`, owner.token),
  householdTrash: await call('GET', 'households/trash', owner.token),
};
records.generated_at = new Date().toISOString();
records.reference_date_bangkok = today;
records.features = {
  auth_roles: ['owner', 'member', 'outsider'], household_and_invite: true,
  multiple_pets_and_profiles: true, routine_weekly_interval_once: true,
  today_task_complete_skip_reassign: true, calendar_history_and_activity: true,
  care_entries_and_health_records: true, passport_and_due_outcomes: true,
  notifications: true, wellness_17_days_baseline_dashboard_alert_follow_up: Boolean(alert),
  notifications_dismissal: Boolean(memberNotifications.notifications?.length),
  soft_archive_and_trash: true, timeline_and_vet_report: true,
  ai_setup_only_no_external_request: ai.provider_ready,
};

accessSnapshot.ai = ai;
await writeFile(accessFile, JSON.stringify({
  synthetic_only: true, base_url: root, household: { id: home.id, name: home.name },
  users: {
    owner: { email: owner.user.email, password, token: owner.token },
    member: { email: member.user.email, password, token: member.token },
    outsider: { email: outsider.user.email, password, token: outsider.token },
  },
  pets: { dog, cat }, records, ai,
  checks: {
    members: checks.members.members?.length || 0,
    pets: checks.pets.pets?.length || 0,
    calendar_events: checks.calendar.events?.length || 0,
    history_items: checks.history.history?.length || 0,
    notifications: checks.notifications.notifications?.length || 0,
    timeline_items: checks.timeline.items?.length || 0,
    activity_items: checks.activity.items?.length || 0,
    archived_items: checks.archivedItems.items?.length || 0,
    archived_households: checks.householdTrash.households?.length || 0,
    wellness_alerts: wellnessAlerts.items?.length || 0,
    vet_report_sections: Object.keys(checks.vetReport.report || {}),
  },
}, null, 2) + '\n', { mode: 0o600 });

console.log(`Synthetic feature-test data created for ${today} (Asia/Bangkok).`);
console.log(`Household: ${home.name} (${home.id})`);
console.log(`Users: owner, member, outsider; pets: ${dog.name}, ${cat.name}`);
console.log(`Feature coverage: ${Object.entries(records.features).filter(([, enabled]) => enabled).map(([name]) => name).join(', ')}`);
console.log(`Private credentials and IDs: ${accessFile} (git-ignored; do not share)`);
