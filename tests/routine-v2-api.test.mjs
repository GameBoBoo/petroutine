import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { before, after, test } from 'node:test';
import pg from 'pg';

const schema = `routine_v2_${crypto.randomBytes(8).toString('hex')}`;
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

function thaiDate(offsetDays = 0) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date(Date.now() + offsetDays * 86_400_000));
}

async function fixture() {
  const nonce = crypto.randomBytes(4).toString('hex');
  const owner = await call('POST', 'auth/register', null, { name: 'Owner', email: `routine-owner-${nonce}@example.com`, password: 'testing123' });
  const member = await call('POST', 'auth/register', null, { name: 'Member', email: `routine-member-${nonce}@example.com`, password: 'testing123' });
  const home = await call('POST', 'households', owner.body.token, { name: 'Home' });
  await call('POST', 'households/join', member.body.token, { invite_code: home.body.household.invite_code });
  const pet = await call('POST', `households/${home.body.household.id}/pets`, owner.body.token, { name: 'Mochi', species: 'dog' });
  return { owner, member, home: home.body.household, pet: pet.body.pet };
}

test('v2 weekly routines create every time once and write an activity', async () => {
  const { owner, home, pet } = await fixture();
  const createdRoutine = await call('POST', `pets/${pet.id}/routines`, owner.body.token, {
    title: 'อาหารและยา',
    activity_type: 'medication',
    schedule: { type: 'weekly', times: ['08:00', '20:00'], days: [0, 1, 2, 3, 4, 5, 6] },
    instructions: 'หลังอาหาร',
  });
  assert.equal(createdRoutine.status, 201);
  assert.deepEqual(createdRoutine.body.routine.schedule_value.times, ['08:00', '20:00']);

  const today = await call('GET', `households/${home.id}/tasks/today`, owner.body.token);
  assert.equal(today.status, 200);
  const tasks = today.body.tasks.filter(item => item.routine_id === createdRoutine.body.routine.id);
  assert.equal(tasks.length, 2);
  assert.equal(new Set(tasks.map(item => item.scheduled_at)).size, 2);
  await call('GET', `households/${home.id}/tasks/today`, owner.body.token);
  assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM care_tasks WHERE routine_id = $1', [createdRoutine.body.routine.id])).rows[0].count, 2);
  const activity = await pool.query("SELECT action FROM activity_logs WHERE entity_type = 'routine' AND entity_id = $1", [createdRoutine.body.routine.id]);
  assert.deepEqual(activity.rows.map(row => row.action), ['create']);
});

test('interval pauses project correctly and only owners can update while history survives', async () => {
  const { owner, member, home, pet } = await fixture();
  const start = thaiDate(1);
  const pause = thaiDate(3);
  const end = thaiDate(7);
  const added = await call('POST', `pets/${pet.id}/routines`, owner.body.token, {
    title: 'ชั่งน้ำหนัก', activity_type: 'other',
    schedule: { type: 'interval', times: ['09:15'], interval_days: 2, start_date: start, end_date: end, pauses: [{ from: pause, to: pause }] },
  });
  assert.equal(added.status, 201);
  const calendar = await call('GET', `households/${home.id}/calendar?from=${start}&to=${end}`, owner.body.token);
  assert.equal(calendar.status, 200);
  const dates = calendar.body.events.filter(event => event.routine_id === added.body.routine.id).map(event => event.date);
  assert.deepEqual(dates, [start, thaiDate(5), end]);

  const oldMoment = new Date(`${thaiDate(-1)}T09:15:00+07:00`);
  await pool.query("INSERT INTO care_tasks (routine_id, scheduled_at, original_scheduled_at, status, completed_by, completed_at) VALUES ($1, $2, $2, 'completed', $3, $2)", [added.body.routine.id, oldMoment, owner.body.user.id]);
  assert.equal((await call('PATCH', `routines/${added.body.routine.id}`, member.body.token, { title: 'ห้ามแก้' })).status, 403);
  const updated = await call('PATCH', `routines/${added.body.routine.id}`, owner.body.token, {
    title: 'ชั่งน้ำหนักใหม่',
    schedule: { type: 'weekly', times: ['07:00'], days: [1, 3, 5] },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.routine.title, 'ชั่งน้ำหนักใหม่');
  assert.deepEqual(updated.body.routine.schedule_value.times, ['07:00']);
  assert.equal((await pool.query("SELECT COUNT(*)::int AS count FROM care_tasks WHERE routine_id = $1 AND status = 'completed'", [added.body.routine.id])).rows[0].count, 1);
  const actions = await pool.query("SELECT action FROM activity_logs WHERE entity_type = 'routine' AND entity_id = $1 ORDER BY created_at", [added.body.routine.id]);
  assert.deepEqual(actions.rows.map(row => row.action), ['create', 'update']);
});

test('legacy routine payload still works with canonical v2 storage', async () => {
  const { owner, pet } = await fixture();
  const added = await call('POST', `pets/${pet.id}/routines`, owner.body.token, {
    title: 'เดินเล่น', activity_type: 'walk', time: '18:30', days: [0, 6],
  });
  assert.equal(added.status, 201);
  assert.equal(added.body.routine.schedule_value.version, 2);
  assert.deepEqual(added.body.routine.schedule_value.times, ['18:30']);
});
