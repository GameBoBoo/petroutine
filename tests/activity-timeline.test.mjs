import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { before, after, test } from 'node:test';
import pg from 'pg';

const schema = `activity_timeline_${crypto.randomBytes(8).toString('hex')}`;
const admin = new pg.Client({ connectionString: process.env.DATABASE_URL });
let pool;
let handlers;
let connected = false;
let created = false;

before(async () => {
  await admin.connect(); connected = true;
  await admin.query(`CREATE SCHEMA ${schema}`); created = true;
  const setup = new pg.Client({ connectionString: process.env.DATABASE_URL, options: `-c search_path=${schema},public` });
  await setup.connect();
  try {
    for (const filename of ['001_initial.sql', '002_phase4.sql', '003_ci_calendar_settings.sql', '004_product_refinement.sql', '005_household_trash.sql']) {
      await setup.query(await readFile(new URL(`../db/migrations/${filename}`, import.meta.url), 'utf8'));
    }
  } finally { await setup.end(); }
  process.env.PGOPTIONS = `-c search_path=${schema},public`;
  handlers = await import('../app/api/v1/[...path]/route.js');
  ({ pool } = await import('../lib/db.js'));
});
after(async () => {
  if (pool) await pool.end();
  if (connected) {
    try { if (created) await admin.query(`DROP SCHEMA ${schema} CASCADE`); } finally { await admin.end(); }
  }
});
async function call(method, path, token, body) {
  const request = new Request(`http://localhost/api/v1/${path}`, {
    method,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const response = await handlers[method](request, { params: Promise.resolve({ path: new URL(request.url).pathname.replace('/api/v1/', '').split('/') }) });
  return { status: response.status, body: await response.json() };
}

async function fixture() {
  const nonce = crypto.randomBytes(4).toString('hex');
  const owner = await call('POST', 'auth/register', null, { name: 'Owner', email: `view-owner-${nonce}@example.com`, password: 'testing123' });
  const member = await call('POST', 'auth/register', null, { name: 'Member', email: `view-member-${nonce}@example.com`, password: 'testing123' });
  const outsider = await call('POST', 'auth/register', null, { name: 'Outsider', email: `view-out-${nonce}@example.com`, password: 'testing123' });
  const home = await call('POST', 'households', owner.body.token, { name: 'Home' });
  await call('POST', 'households/join', member.body.token, { invite_code: home.body.household.invite_code });
  const pet = await call('POST', `households/${home.body.household.id}/pets`, owner.body.token, { name: 'Mochi', species: 'dog' });
  return { owner, member, outsider, home: home.body.household, pet: pet.body.pet };
}

test('household and account activity are isolated, filterable, named, and cursor paginated', async () => {
  const { owner, member, outsider, home, pet } = await fixture();
  await call('POST', `households/${home.id}/care-entries`, member.body.token, { pet_id: pet.id, title: 'เดินเพิ่ม', activity_type: 'walk', occurred_at: new Date().toISOString(), notes: 'ฝนหยุดแล้ว' });
  await call('POST', `pets/${pet.id}/health-records`, owner.body.token, { record_type: 'observation', title: 'สังเกตอาการ', recorded_at: new Date().toISOString(), details: 'สดใสดี' });
  const first = await call('GET', `households/${home.id}/activity?limit=1`, owner.body.token);
  assert.equal(first.status, 200);
  assert.equal(first.body.items.length, 1);
  assert.ok(first.body.items[0].actor_name);
  assert.ok(first.body.items[0].pet_name);
  assert.ok(first.body.next_cursor);
  const second = await call('GET', `households/${home.id}/activity?limit=1&cursor=${encodeURIComponent(first.body.next_cursor)}`, owner.body.token);
  assert.equal(second.body.items.length, 1);
  assert.notEqual(second.body.items[0].id, first.body.items[0].id);
  const filtered = await call('GET', `households/${home.id}/activity?member_id=${member.body.user.id}&pet_id=${pet.id}&action=create`, owner.body.token);
  assert.equal(filtered.body.items.length, 1);
  assert.equal(filtered.body.items[0].actor_user_id, member.body.user.id);
  assert.equal((await call('GET', `households/${home.id}/activity`, outsider.body.token)).status, 403);
  assert.equal((await call('GET', `households/${home.id}/activity?limit=101`, owner.body.token)).status, 400);

  await pool.query(
    `INSERT INTO activity_logs (actor_user_id, action, entity_type, entity_id, after_data)
     VALUES ($1, 'update', 'user_settings', $1, '{"notifications_enabled":false}'::jsonb)`,
    [owner.body.user.id],
  );
  const account = await call('GET', 'auth/activity', owner.body.token);
  assert.equal(account.status, 200);
  assert.equal(account.body.items.length, 2);
  assert.ok(account.body.items.every(item => item.actor_user_id === owner.body.user.id && item.household_id === null));
  const memberAccount = await call('GET', 'auth/activity', member.body.token);
  assert.equal(memberAccount.body.items.length, 1);
  assert.ok(memberAccount.body.items.every(item => item.actor_user_id === member.body.user.id && item.household_id === null));
});
test('pet timeline combines tasks, archived care, health, and relevant changes', async () => {
  const { owner, member, pet, home } = await fixture();
  const routine = await call('POST', `pets/${pet.id}/routines`, owner.body.token, { title: 'อาหารเช้า', activity_type: 'feeding', time: '00:00', days: [0, 1, 2, 3, 4, 5, 6] });
  const task = (await call('GET', `households/${home.id}/tasks/today`, owner.body.token)).body.tasks.find(item => item.routine_id === routine.body.routine.id);
  await pool.query("UPDATE care_tasks SET status = 'completed', completed_by = $1, completed_at = NOW(), notes = 'กินหมด' WHERE id = $2", [member.body.user.id, task.id]);
  const care = await call('POST', `households/${home.id}/care-entries`, member.body.token, { pet_id: pet.id, title: 'เช็ดหู', activity_type: 'grooming', occurred_at: new Date().toISOString(), notes: 'เรียบร้อย' });
  await call('POST', `care-entries/${care.body.entry.id}/archive`, member.body.token, {});
  const health = await call('POST', `pets/${pet.id}/health-records`, owner.body.token, { record_type: 'vaccination', title: 'วัคซีนประจำปี', recorded_at: new Date().toISOString(), details: 'ผู้ใช้บันทึกเอง' });
  await call('POST', `health-records/${health.body.record.id}/archive`, owner.body.token, {});
  const timeline = await call('GET', `pets/${pet.id}/timeline?limit=25`, member.body.token);
  assert.equal(timeline.status, 200);
  assert.ok(timeline.body.items.some(item => item.source_type === 'task' && item.notes === 'กินหมด'));
  assert.ok(timeline.body.items.some(item => item.source_type === 'care_entry' && item.archived_at));
  assert.ok(timeline.body.items.some(item => item.source_type === 'health_record' && item.archived_at));
  assert.ok(timeline.body.items.every(item => item.actor_name));
});
