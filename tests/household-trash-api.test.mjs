import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { before, after, test } from 'node:test';
import pg from 'pg';

const schema = `household_trash_api_${crypto.randomBytes(8).toString('hex')}`;
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

async function register(label) {
  const nonce = crypto.randomBytes(6).toString('hex');
  return call('POST', 'auth/register', null, { name: label, email: `${label.toLowerCase()}-${nonce}@example.com`, password: 'testing123' });
}

test('only the owner can move a household to trash and restore it with all data intact', async () => {
  const owner = await register('Owner');
  const member = await register('Member');
  const outsider = await register('Outsider');
  const createdHome = await call('POST', 'households', owner.body.token, { name: 'บ้านโมจิ' });
  const home = createdHome.body.household;
  await call('POST', 'households/join', member.body.token, { invite_code: home.invite_code });
  const pet = await call('POST', `households/${home.id}/pets`, owner.body.token, { name: 'โมจิ', species: 'dog' });
  const routine = await call('POST', `pets/${pet.body.pet.id}/routines`, owner.body.token, {
    title: 'อาหารเช้า', activity_type: 'feeding', schedule: { type: 'weekly', times: ['08:00'], days: [0, 1, 2, 3, 4, 5, 6] },
  });
  const care = await call('POST', `households/${home.id}/care-entries`, member.body.token, {
    pet_id: pet.body.pet.id, title: 'เช็ดตัว', activity_type: 'grooming', occurred_at: new Date().toISOString(), notes: 'บันทึกก่อนย้ายบ้าน',
  });
  const health = await call('POST', `pets/${pet.body.pet.id}/health-records`, owner.body.token, {
    record_type: 'observation', title: 'สังเกตอาการ', recorded_at: new Date().toISOString(), details: 'สดใสดี',
  });

  assert.equal((await call('POST', `households/${home.id}/archive`, member.body.token, {})).status, 403);
  const archived = await call('POST', `households/${home.id}/archive`, owner.body.token, {});
  assert.equal(archived.status, 200);
  assert.ok(archived.body.household.archived_at);

  assert.equal((await call('GET', 'households', owner.body.token)).body.households.some(item => item.id === home.id), false);
  assert.equal((await call('GET', 'households', member.body.token)).body.households.some(item => item.id === home.id), false);
  assert.equal((await call('GET', `households/${home.id}`, owner.body.token)).status, 403);
  assert.equal((await call('GET', `households/${home.id}/pets`, owner.body.token)).status, 403);
  assert.equal((await call('GET', `pets/${pet.body.pet.id}/routines`, owner.body.token)).status, 403);
  assert.equal((await call('GET', `households/${home.id}/members`, owner.body.token)).status, 403);
  assert.equal((await call('GET', `households/${home.id}/care-entries`, owner.body.token)).status, 403);
  assert.equal((await call('GET', `pets/${pet.body.pet.id}/health-records`, owner.body.token)).status, 403);
  assert.equal((await call('GET', `pets/${pet.body.pet.id}/timeline`, owner.body.token)).status, 403);
  assert.equal((await call('GET', `households/${home.id}/activity`, owner.body.token)).status, 403);
  assert.equal((await call('PATCH', `care-entries/${care.body.entry.id}`, member.body.token, { notes: 'ห้ามแก้' })).status, 403);
  assert.equal((await call('PATCH', `health-records/${health.body.record.id}`, owner.body.token, { details: 'ห้ามแก้' })).status, 403);
  assert.equal((await call('PATCH', `routines/${routine.body.routine.id}`, owner.body.token, { title: 'ห้ามแก้' })).status, 403);
  assert.equal((await call('PATCH', `pets/${pet.body.pet.id}`, owner.body.token, { name: 'ห้ามแก้' })).status, 403);
  assert.equal((await call('PATCH', `households/${home.id}`, owner.body.token, { name: 'ห้ามแก้' })).status, 403);
  assert.equal((await call('POST', 'households/join', outsider.body.token, { invite_code: home.invite_code })).status, 404);
  assert.equal((await call('POST', `pets/${pet.body.pet.id}/health-records`, owner.body.token, {
    record_type: 'observation', title: 'ไม่ควรบันทึกได้', recorded_at: new Date().toISOString(),
  })).status, 403);

  const ownerTrash = await call('GET', 'households/trash', owner.body.token);
  assert.equal(ownerTrash.status, 200);
  assert.deepEqual(ownerTrash.body.households.map(item => item.id), [home.id]);
  assert.deepEqual((await call('GET', 'households/trash', member.body.token)).body.households, []);

  assert.equal((await call('POST', `households/${home.id}/restore`, member.body.token, {})).status, 403);
  assert.equal((await call('POST', `households/${home.id}/restore`, outsider.body.token, {})).status, 403);
  const restored = await call('POST', `households/${home.id}/restore`, owner.body.token, {});
  assert.equal(restored.status, 200);
  assert.equal(restored.body.household.archived_at, null);

  assert.equal((await call('GET', 'households', member.body.token)).body.households.some(item => item.id === home.id), true);
  assert.equal((await call('GET', `households/${home.id}/pets`, member.body.token)).body.pets[0].id, pet.body.pet.id);
  assert.equal((await call('GET', `pets/${pet.body.pet.id}/routines`, owner.body.token)).body.routines[0].id, routine.body.routine.id);
  assert.equal((await call('GET', `households/${home.id}/care-entries`, owner.body.token)).body.items[0].id, care.body.entry.id);
  assert.equal((await call('GET', `pets/${pet.body.pet.id}/health-records`, owner.body.token)).body.items[0].id, health.body.record.id);
  assert.deepEqual((await call('GET', 'households/trash', owner.body.token)).body.households, []);

  const activity = await call('GET', `households/${home.id}/activity?action=archive`, owner.body.token);
  const restoredActivity = await call('GET', `households/${home.id}/activity?action=restore`, owner.body.token);
  assert.equal(activity.body.items.some(item => item.entity_type === 'household'), true);
  assert.equal(restoredActivity.body.items.some(item => item.entity_type === 'household'), true);
});

test('the removed handover endpoint is no longer available', async () => {
  const owner = await register('HandoverOwner');
  const home = await call('POST', 'households', owner.body.token, { name: 'บ้านไม่มีส่งต่องาน' });
  assert.equal((await call('GET', `households/${home.body.household.id}/handover`, owner.body.token)).status, 404);
});
