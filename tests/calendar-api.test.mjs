import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { before, after, test } from 'node:test';
import pg from 'pg';

const schema = `calendar_test_${crypto.randomBytes(8).toString('hex')}`;
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

test('calendar projects a real one-time appointment and rejects invalid or foreign ranges', async () => {
  const nonce = crypto.randomBytes(4).toString('hex');
  const owner = await call('POST', 'auth/register', null, { name: 'Owner', email: `calendar-owner-${nonce}@example.com`, password: 'testing123' });
  const outsider = await call('POST', 'auth/register', null, { name: 'Outsider', email: `calendar-other-${nonce}@example.com`, password: 'testing123' });
  const home = await call('POST', 'households', owner.body.token, { name: 'Home' });
  const id = home.body.household.id;
  const pet = await call('POST', `households/${id}/pets`, owner.body.token, { name: 'Mochi', species: 'dog' });
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const future = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() + 5 * 86_400_000));
  const added = await call('POST', `pets/${pet.body.pet.id}/routines`, owner.body.token, { title: 'Vet visit', activity_type: 'vet', schedule_type: 'once', date: future, time: '10:30' });
  assert.equal(added.status, 201);
  const calendar = await call('GET', `households/${id}/calendar?from=${today}&to=${future}`, owner.body.token);
  assert.equal(calendar.status, 200);
  assert.ok(calendar.body.events.some(event => event.title === 'Vet visit' && event.date === future && event.status === 'scheduled'));
  assert.equal((await call('GET', `households/${id}/calendar?from=${future}&to=${today}`, owner.body.token)).status, 400);
  assert.equal((await call('GET', `households/${id}/calendar?from=${today}&to=${future}`, outsider.body.token)).status, 403);
});

test('settings persist and in-app reminders obey permissions and preferences', async () => {
  const nonce = crypto.randomBytes(4).toString('hex');
  const owner = await call('POST', 'auth/register', null, { name: 'Owner', email: `settings-owner-${nonce}@example.com`, password: 'testing123' });
  const other = await call('POST', 'auth/register', null, { name: 'Other', email: `settings-other-${nonce}@example.com`, password: 'testing123' });
  const home = await call('POST', 'households', owner.body.token, { name: 'Original home' });
  const id = home.body.household.id;
  const pet = await call('POST', `households/${id}/pets`, owner.body.token, { name: 'Mimi', species: 'cat' });
  await call('POST', `pets/${pet.body.pet.id}/routines`, owner.body.token, { title: 'Breakfast', activity_type: 'feeding', time: '00:00', days: [0, 1, 2, 3, 4, 5, 6] });
  await call('GET', `households/${id}/tasks/today`, owner.body.token);
  const settings = await call('GET', 'auth/settings', owner.body.token);
  assert.equal(settings.status, 200);
  assert.deepEqual({ enabled: settings.body.settings.notifications_enabled, lead: settings.body.settings.lead_minutes }, { enabled: true, lead: 60 });
  const reminders = await call('GET', `households/${id}/notifications`, owner.body.token);
  assert.equal(reminders.status, 200);
  assert.ok(reminders.body.notifications.some(item => item.title === 'Breakfast'));
  assert.equal((await call('GET', `households/${id}/notifications`, other.body.token)).status, 403);
  assert.equal((await call('PATCH', 'auth/settings', owner.body.token, { notifications_enabled: false, lead_minutes: 30 })).status, 200);
  assert.deepEqual((await call('GET', `households/${id}/notifications`, owner.body.token)).body.notifications, []);
  assert.equal((await call('PATCH', 'auth/settings', owner.body.token, { lead_minutes: 2000 })).status, 400);
  const tomorrow = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() + 86_400_000));
  await call('POST', `pets/${pet.body.pet.id}/routines`, owner.body.token, { title: 'Tomorrow visit', activity_type: 'vet', schedule_type: 'once', date: tomorrow, time: '00:00' });
  await call('PATCH', 'auth/settings', owner.body.token, { notifications_enabled: true, lead_minutes: 1440 });
  const tomorrowReminders = await call('GET', `households/${id}/notifications`, owner.body.token);
  const tomorrowReminder = tomorrowReminders.body.notifications.find(item => item.title === 'Tomorrow visit');
  assert.ok(tomorrowReminder, 'a 1-day lead must include tomorrow at midnight');
  assert.equal((await call('POST', `tasks/${tomorrowReminder.id}/complete`, owner.body.token, {})).status, 409, 'future tasks cannot be completed early');
  const yesterday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() - 86_400_000));
  const overdueRoutine = await call('POST', `pets/${pet.body.pet.id}/routines`, owner.body.token, { title: 'Overdue visit', activity_type: 'vet', schedule_type: 'once', date: yesterday, time: '00:00' });
  await pool.query('INSERT INTO care_tasks (routine_id, scheduled_at) VALUES ($1, $2)', [overdueRoutine.body.routine.id, new Date(`${yesterday}T00:00:00+07:00`)]);
  const overdueReminders = await call('GET', `households/${id}/notifications`, owner.body.token);
  assert.ok(overdueReminders.body.notifications.some(item => item.title === 'Overdue visit' && item.status === 'overdue'), 'pending tasks from prior days remain visible');
  assert.equal((await call('PATCH', 'auth/me', owner.body.token, { name: 'New Owner' })).body.user.name, 'New Owner');
  await call('POST', 'households/join', other.body.token, { invite_code: home.body.household.invite_code });
  assert.equal((await call('PATCH', `households/${id}`, other.body.token, { name: 'Not allowed' })).status, 403);
  assert.equal((await call('PATCH', `households/${id}`, owner.body.token, { name: 'Renamed home' })).body.household.name, 'Renamed home');
});

test('routine input longer than database limits is rejected as invalid input', async () => {
  const nonce = crypto.randomBytes(4).toString('hex');
  const owner = await call('POST', 'auth/register', null, { name: 'Owner', email: `limits-${nonce}@example.com`, password: 'testing123' });
  const home = await call('POST', 'households', owner.body.token, { name: 'Home' });
  const pet = await call('POST', `households/${home.body.household.id}/pets`, owner.body.token, { name: 'Mochi', species: 'dog' });
  const route = `pets/${pet.body.pet.id}/routines`;
  assert.equal((await call('POST', route, owner.body.token, { title: 'x'.repeat(161), activity_type: 'feeding', time: '08:00' })).status, 400);
  assert.equal((await call('POST', route, owner.body.token, { title: 'Valid', activity_type: 'feeding', time: '08:00', instructions: 'x'.repeat(2001) })).status, 400);
  const valid = await call('POST', route, owner.body.token, { title: 'Valid', activity_type: 'feeding', time: '08:00' });
  assert.equal(valid.status, 201);
  assert.equal((await call('PATCH', `routines/${valid.body.routine.id}`, owner.body.token, { instructions: 'x'.repeat(2001) })).status, 400);
});
