import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { after, before, test } from 'node:test';
import pg from 'pg';

const schema = `phase4_test_${crypto.randomBytes(8).toString('hex')}`;
const admin = new pg.Client({ connectionString: process.env.DATABASE_URL });
let pool;
let handlers;
let adminConnected = false;
let schemaCreated = false;

before(async () => {
  await admin.connect();
  adminConnected = true;
  await admin.query(`CREATE SCHEMA ${schema}`);
  schemaCreated = true;
  const setup = new pg.Client({ connectionString: process.env.DATABASE_URL, options: `-c search_path=${schema},public` });
  await setup.connect();
  try {
    for (const filename of ['001_initial.sql', '002_phase4.sql', '003_ci_calendar_settings.sql', '004_product_refinement.sql', '005_household_trash.sql']) {
      const sql = await readFile(new URL(`../db/migrations/${filename}`, import.meta.url), 'utf8');
      await setup.query(sql);
    }
  } finally { await setup.end(); }
  process.env.PGOPTIONS = `-c search_path=${schema},public`;
  handlers = await import('../app/api/v1/[...path]/route.js');
  ({ pool } = await import('../lib/db.js'));
});

after(async () => {
  if (pool) await pool.end();
  if (adminConnected) {
    try { if (schemaCreated) await admin.query(`DROP SCHEMA ${schema} CASCADE`); } finally { await admin.end(); }
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

test('Phase 4 permissions, editing, archiving, assignment, and history filters', async () => {
  const nonce = crypto.randomBytes(4).toString('hex');
  const owner = await call('POST', 'auth/register', null, { name: 'Owner', email: `owner-${nonce}@example.com`, password: 'testing123' });
  const other = await call('POST', 'auth/register', null, { name: 'Member', email: `member-${nonce}@example.com`, password: 'testing123' });
  assert.equal(owner.status, 201);
  const ownerToken = owner.body.token;
  const memberToken = other.body.token;
  const home = await call('POST', 'households', ownerToken, { name: 'Our home' });
  const houseId = home.body.household.id;
  const petResult = await call('POST', `households/${houseId}/pets`, ownerToken, { name: 'Mochi', species: 'dog' });
  const petId = petResult.body.pet.id;
  assert.equal((await call('GET', `households/${houseId}/history`, memberToken)).status, 403);
  assert.equal((await call('GET', `households/${houseId}/pets`, memberToken)).status, 403);
  assert.equal((await call('PATCH', `pets/${petId}`, memberToken, { name: 'Nope', species: 'cat' })).status, 403);
  assert.equal((await call('POST', 'households/join', memberToken, { invite_code: home.body.household.invite_code })).status, 201);
  assert.equal((await call('PATCH', `pets/${petId}`, memberToken, { name: 'Mochi II', species: 'dog' })).status, 200);
  assert.equal((await call('POST', `pets/${petId}/routines`, memberToken, { title: 'Feed', activity_type: 'feeding', time: '08:00', days: [0,1,2,3,4,5,6] })).status, 403);
  const routineResult = await call('POST', `pets/${petId}/routines`, ownerToken, { title: 'Feed', activity_type: 'feeding', time: '08:00', days: [0,1,2,3,4,5,6], assigned_user_id: other.body.user.id });
  assert.equal(routineResult.status, 201);
  const routineId = routineResult.body.routine.id;
  assert.equal(routineResult.body.routine.assigned_user_id, other.body.user.id);
  assert.equal((await call('PATCH', `routines/${routineId}`, ownerToken, { assigned_user_id: crypto.randomUUID() })).status, 400);
  assert.equal((await call('PATCH', `routines/${routineId}`, memberToken, { title: 'Unauthorized', activity_type: 'feeding', time: '09:00', days: [1] })).status, 403);
  assert.equal((await call('PATCH', `routines/${routineId}`, ownerToken, { title: 'Breakfast', activity_type: 'feeding', time: '09:00', days: [0,1,2,3,4,5,6], assigned_user_id: other.body.user.id })).status, 200);
  const today = await call('GET', `households/${houseId}/tasks/today`, ownerToken);
  assert.equal(today.status, 200);
  assert.equal(today.body.tasks.length, 1);
  assert.equal((await call('PATCH', `routines/${routineId}`, ownerToken, { time: '09:30' })).status, 200);
  const rescheduled = await call('GET', `households/${houseId}/tasks/today`, ownerToken);
  assert.equal(rescheduled.body.tasks.length, 1, 'old pending task must be replaced');
  assert.equal(rescheduled.body.tasks[0].scheduled_at, new Date(`${new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())}T09:30:00+07:00`).toISOString());
  const taskId = rescheduled.body.tasks[0].id;
  assert.equal((await call('POST', `tasks/${taskId}/complete`, memberToken, { notes: 'Ate well' })).status, 200);
  assert.equal((await call('POST', `tasks/${taskId}/complete`, ownerToken, {})).status, 409);
  assert.equal((await call('PATCH', `routines/${routineId}`, ownerToken, { time: '10:00' })).status, 200);
  const afterEdit = await call('GET', `households/${houseId}/tasks/today`, ownerToken);
  assert.equal(afterEdit.body.tasks.filter(task => task.routine_id === routineId).length, 1, 'schedule edit must not create a second task after completion');
  assert.equal(afterEdit.body.tasks.find(task => task.routine_id === routineId).status, 'completed');
  const history = await call('GET', `households/${houseId}/history?pet_id=${petId}&activity_type=feeding`, ownerToken);
  assert.equal(history.status, 200);
  assert.equal(history.body.history.length, 1);
  assert.equal(history.body.history[0].notes, 'Ate well');
  const bangkokDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const bangkokDay = new Date(`${bangkokDate}T12:00:00+07:00`).getUTCDay();
  const midnightRoutine = await call('POST', `pets/${petId}/routines`, ownerToken, { title: 'Night care', activity_type: 'water', time: '00:10', days: [bangkokDay] });
  assert.equal(midnightRoutine.status, 201);
  assert.equal((await call('GET', `households/${houseId}/tasks/today`, ownerToken)).body.tasks.length, 2, 'weekday must use Bangkok, not UTC');
  assert.equal((await call('GET', `households/${houseId}/history?from=${bangkokDate}&to=${bangkokDate}`, ownerToken)).body.history.length, 1);
  assert.equal((await call('GET', `households/${houseId}/history?activity_type=water`, ownerToken)).body.history.length, 0);
  assert.equal((await call('GET', `households/${houseId}/history?from=not-a-date`, ownerToken)).status, 400);
  assert.equal((await call('GET', `households/${houseId}/history?from=2026-02-31`, ownerToken)).status, 400);
  assert.equal((await call('PATCH', `routines/${routineId}`, ownerToken, { active: false })).status, 200);
  assert.equal((await call('POST', `routines/${routineId}/archive`, memberToken, {})).status, 403);
  assert.equal((await call('POST', `routines/${routineId}/archive`, ownerToken, {})).status, 200);
  assert.equal((await call('POST', `pets/${petId}/archive`, memberToken, {})).status, 403);
  assert.equal((await call('POST', `pets/${petId}/archive`, ownerToken, {})).status, 200);
  assert.equal((await call('GET', `households/${houseId}/pets`, ownerToken)).body.pets.length, 0);
  assert.equal((await call('GET', `households/${houseId}/history`, ownerToken)).body.history.length, 1);
});
