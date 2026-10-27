import { applyMigrations } from '../db/migrations.mjs';
import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { before, after, test } from 'node:test';
import pg from 'pg';

const schema = `care_health_${crypto.randomBytes(8).toString('hex')}`;
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
    await applyMigrations(setup);
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
  const owner = await call('POST', 'auth/register', null, { name: 'Owner', email: `care-owner-${nonce}@example.com`, password: 'testing123' });
  const creator = await call('POST', 'auth/register', null, { name: 'Creator', email: `care-creator-${nonce}@example.com`, password: 'testing123' });
  const reader = await call('POST', 'auth/register', null, { name: 'Reader', email: `care-reader-${nonce}@example.com`, password: 'testing123' });
  const outsider = await call('POST', 'auth/register', null, { name: 'Outsider', email: `care-out-${nonce}@example.com`, password: 'testing123' });
  const home = await call('POST', 'households', owner.body.token, { name: 'Home' });
  await call('POST', 'households/join', creator.body.token, { invite_code: home.body.household.invite_code });
  await call('POST', 'households/join', reader.body.token, { invite_code: home.body.household.invite_code });
  const pet = await call('POST', `households/${home.body.household.id}/pets`, owner.body.token, { name: 'Mochi', species: 'dog' });
  return { owner, creator, reader, outsider, home: home.body.household, pet: pet.body.pet };
}

test('care entries support member create/read, creator or owner mutation, archive, and logs', async () => {
  const { owner, creator, reader, outsider, home, pet } = await fixture();
  const occurredAt = '2026-10-09T23:30:00+07:00';
  const added = await call('POST', `households/${home.id}/care-entries`, creator.body.token, {
    pet_id: pet.id, title: 'อาบน้ำพิเศษ', activity_type: 'bathing', occurred_at: occurredAt, notes: 'ใช้แชมพูสูตรอ่อนโยน',
  });
  assert.equal(added.status, 201);
  assert.equal((await call('GET', `households/${home.id}/care-entries`, reader.body.token)).body.items[0].title, 'อาบน้ำพิเศษ');
  assert.equal((await call('GET', `households/${home.id}/care-entries`, outsider.body.token)).status, 403);
  assert.equal((await call('PATCH', `care-entries/${added.body.entry.id}`, reader.body.token, { title: 'ห้ามแก้' })).status, 403);
  assert.equal((await call('PATCH', `care-entries/${added.body.entry.id}`, creator.body.token, { notes: 'แก้หมายเหตุแล้ว' })).body.entry.notes, 'แก้หมายเหตุแล้ว');
  assert.equal((await call('PATCH', `care-entries/${added.body.entry.id}`, owner.body.token, { title: 'อาบน้ำ' })).status, 200);
  assert.equal((await call('POST', `care-entries/${added.body.entry.id}/archive`, owner.body.token, {})).status, 200);
  assert.deepEqual((await call('GET', `households/${home.id}/care-entries`, creator.body.token)).body.items, []);
  const history = await call('GET', `households/${home.id}/history?activity_type=bathing`, creator.body.token);
  assert.equal(history.status, 200);
  assert.equal(history.body.history[0].id, added.body.entry.id);
  assert.equal(history.body.history[0].source_type, 'care_entry');
  assert.equal((await call('POST', `households/${home.id}/care-entries`, creator.body.token, { pet_id: pet.id, title: 'x'.repeat(161), activity_type: 'other', occurred_at: occurredAt })).status, 400);
  const logs = await pool.query("SELECT action, before_data, after_data FROM activity_logs WHERE entity_type = 'care_entry' AND entity_id = $1 ORDER BY created_at", [added.body.entry.id]);
  assert.deepEqual(logs.rows.map(row => row.action), ['create', 'update', 'update', 'archive']);
  assert.ok(!('password' in logs.rows[0].after_data));
});

test('health records accept every text type, validate weight, and enforce permissions', async () => {
  const { owner, creator, reader, outsider, pet } = await fixture();
  const types = ['weight', 'vaccination', 'medication', 'appointment', 'observation', 'other'];
  const ids = [];
  for (const recordType of types) {
    const body = {
      record_type: recordType,
      title: `${recordType} record`,
      recorded_at: '2026-10-10T08:00:00+07:00',
      details: 'ข้อความที่ผู้ใช้กรอกเอง',
      ...(recordType === 'weight' ? { numeric_value: 12.45, unit: 'kg' } : {}),
    };
    const response = await call('POST', `pets/${pet.id}/health-records`, creator.body.token, body);
    assert.equal(response.status, 201, recordType);
    ids.push(response.body.record.id);
  }
  const list = await call('GET', `pets/${pet.id}/health-records`, reader.body.token);
  assert.equal(list.status, 200);
  assert.equal(list.body.items.length, 6);
  assert.equal(list.body.items.find(item => item.record_type === 'weight').numeric_value, '12.450');
  assert.equal((await call('GET', `pets/${pet.id}/health-records`, outsider.body.token)).status, 403);
  assert.equal((await call('POST', `pets/${pet.id}/health-records`, creator.body.token, { record_type: 'weight', title: 'Bad', recorded_at: '2026-10-10T08:00:00+07:00', numeric_value: -1, unit: 'kg' })).status, 400);
  assert.equal((await call('POST', `pets/${pet.id}/health-records`, creator.body.token, { record_type: 'weight', title: 'Bad', recorded_at: '2026-10-10T08:00:00+07:00', numeric_value: 10 })).status, 400);
  assert.equal((await call('PATCH', `health-records/${ids[0]}`, reader.body.token, { details: 'ห้ามแก้' })).status, 403);
  assert.equal((await call('PATCH', `health-records/${ids[0]}`, creator.body.token, { numeric_value: 12.8, unit: 'kg' })).status, 200);
  assert.equal((await call('POST', `health-records/${ids[0]}/archive`, owner.body.token, {})).status, 200);
  assert.equal((await call('GET', `pets/${pet.id}/health-records`, creator.body.token)).body.items.length, 5);
  const logs = await pool.query("SELECT action FROM activity_logs WHERE entity_type = 'health_record' AND entity_id = $1 ORDER BY created_at", [ids[0]]);
  assert.deepEqual(logs.rows.map(row => row.action), ['create', 'update', 'archive']);
});

test('Today includes every item added for the Bangkok calendar day', async () => {
  const { owner, creator, home, pet } = await fixture();
  const dateResult = await pool.query("SELECT (NOW() AT TIME ZONE 'Asia/Bangkok')::date::text AS today");
  const today = dateResult.rows[0].today;
  const yesterday = new Date(Date.parse(`${today}T00:00:00.000Z`) - 86_400_000).toISOString().slice(0, 10);
  const weekday = new Date(`${today}T12:00:00+07:00`).getUTCDay();

  await call('POST', `pets/${pet.id}/routines`, owner.body.token, {
    title: 'อาหารวันนี้', activity_type: 'feeding', time: '23:55', days: [weekday],
  });
  await call('POST', `households/${home.id}/care-entries`, creator.body.token, {
    pet_id: pet.id, title: 'เช็ดหูวันนี้', activity_type: 'grooming', occurred_at: `${today}T08:00:00+07:00`,
  });
  await call('POST', `pets/${pet.id}/health-records`, creator.body.token, {
    record_type: 'observation', title: 'สังเกตอาการวันนี้', recorded_at: `${today}T09:00:00+07:00`, details: 'ปกติ',
  });
  await call('POST', `pets/${pet.id}/wellness-logs`, creator.body.token, {
    recorded_at: new Date(Date.now() - 60_000).toISOString(), mood: 'bright',
  });
  await call('POST', `households/${home.id}/care-entries`, creator.body.token, {
    pet_id: pet.id, title: 'รายการเมื่อวาน', activity_type: 'other', occurred_at: `${yesterday}T23:59:00+07:00`,
  });

  const response = await call('GET', `households/${home.id}/tasks/today`, creator.body.token);
  assert.equal(response.status, 200);
  assert.deepEqual(response.body.tasks.map(item => item.source_type).sort(), ['care_entry', 'health_record', 'task', 'wellness_log']);
  assert.equal(response.body.tasks.some(item => item.title === 'รายการเมื่อวาน'), false);
  assert.equal(response.body.tasks.filter(item => item.source_type !== 'task').every(item => item.read_only && item.display_status === 'completed'), true);
});
