import { applyMigrations } from '../db/migrations.mjs';
import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { before, after, test } from 'node:test';
import pg from 'pg';

const schema = `phase10_${crypto.randomBytes(8).toString('hex')}`;
const admin = new pg.Client({ connectionString: process.env.DATABASE_URL });
let pool; let handlers; let connected = false; let created = false;

before(async () => {
  await admin.connect(); connected = true;
  await admin.query(`CREATE SCHEMA ${schema}`); created = true;
  const setup = new pg.Client({ connectionString: process.env.DATABASE_URL, options: `-c search_path=${schema},public` });
  await setup.connect();
  try {
    await applyMigrations(setup);
    await setup.query(await readFile(new URL('../db/migrations/009_reminders_shared_monitoring.sql', import.meta.url), 'utf8'));
    await setup.query(await readFile(new URL('../db/migrations/010_notification_dismissals.sql', import.meta.url), 'utf8'));
  } finally { await setup.end(); }
  process.env.PGOPTIONS = `-c search_path=${schema},public`;
  handlers = await import('../app/api/v1/[...path]/route.js');
  ({ pool } = await import('../lib/db.js'));
});

after(async () => {
  if (pool) await pool.end();
  if (connected) { try { if (created) await admin.query(`DROP SCHEMA ${schema} CASCADE`); } finally { await admin.end(); } }
});

async function call(method, path, token, body) {
  const request = new Request(`http://localhost/api/v1/${path}`, { method, headers: token ? { authorization: `Bearer ${token}` } : {}, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const response = await handlers[method](request, { params: Promise.resolve({ path: new URL(request.url).pathname.replace('/api/v1/', '').split('/') }) });
  return { status: response.status, body: await response.json() };
}

const dateAfter = (start, offset) => { const value = new Date(`${start}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + offset); return value.toISOString().slice(0, 10); };

async function fixture() {
  const nonce = crypto.randomBytes(4).toString('hex');
  const owner = await call('POST', 'auth/register', null, { name: 'Owner', email: `p10-owner-${nonce}@example.com`, password: 'testing123' });
  const member = await call('POST', 'auth/register', null, { name: 'Member', email: `p10-member-${nonce}@example.com`, password: 'testing123' });
  const outsider = await call('POST', 'auth/register', null, { name: 'Outsider', email: `p10-out-${nonce}@example.com`, password: 'testing123' });
  const home = await call('POST', 'households', owner.body.token, { name: 'Phase Ten Home' });
  await call('POST', 'households/join', member.body.token, { invite_code: home.body.household.invite_code });
  const pet = await call('POST', `households/${home.body.household.id}/pets`, owner.body.token, { name: 'Mochi', species: 'dog', breed: 'Mixed', vet_contact: '02-000-0000' });
  return { owner, member, outsider, home: home.body.household, pet: pet.body.pet };
}

test('health reminders, shared follow-up and Vet Report work with access isolation', async () => {
  const { owner, member, outsider, home, pet } = await fixture();
  const followUpDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
  assert.equal((await call('PATCH', 'auth/settings', owner.body.token, { notifications_enabled: true, lead_minutes: 60, health_reminder_days: 30 })).status, 200);
  assert.equal((await call('PATCH', 'auth/settings', owner.body.token, { notifications_enabled: true, lead_minutes: 60, health_reminder_days: 8 })).status, 400);
  for (const entry of [
    { entry_type: 'vaccination', title: 'วัคซีนรวม', next_due_date: '2026-10-15' },
    { entry_type: 'appointment', title: 'นัดตรวจติดตาม', next_due_date: '2026-10-12' },
  ]) assert.equal((await call('POST', `pets/${pet.id}/passport`, owner.body.token, entry)).status, 201);
  for (let index = 0; index < 14; index += 1) {
    assert.equal((await call('POST', `pets/${pet.id}/wellness-logs`, owner.body.token, { recorded_at: `${dateAfter('2026-09-20', index)}T08:00:00+07:00`, activity_level: 'usual', weight_kg: 10 })).status, 201);
  }
  for (const day of ['2026-10-04', '2026-10-05', '2026-10-06']) {
    assert.equal((await call('POST', `pets/${pet.id}/wellness-logs`, owner.body.token, { recorded_at: `${day}T08:00:00+07:00`, activity_level: 'low', weight_kg: 10 })).status, 201);
  }
  const active = await call('GET', `pets/${pet.id}/wellness-alerts`, owner.body.token);
  const alert = active.body.items[0];
  assert.ok(alert);
  assert.equal((await call('PATCH', `wellness-alerts/${alert.id}/follow-up`, owner.body.token, { assigned_user_id: outsider.body.user.id, follow_up_due_date: followUpDate })).status, 400);
  const followUp = await call('PATCH', `wellness-alerts/${alert.id}/follow-up`, member.body.token, { assigned_user_id: member.body.user.id, follow_up_due_date: followUpDate, follow_up_note: 'สังเกตการกินมื้อเย็น' });
  assert.equal(followUp.status, 200);
  assert.equal(followUp.body.alert.status, 'monitoring');
  const listed = await call('GET', `pets/${pet.id}/wellness-alerts`, owner.body.token);
  assert.equal(listed.body.items[0].assigned_to_name, 'Member');
  assert.equal(listed.body.items[0].follow_up_due_date, followUpDate);

  const notifications = await call('GET', `households/${home.id}/notifications`, owner.body.token);
  assert.equal(notifications.status, 200);
  assert.ok(notifications.body.notifications.some(item => item.type === 'health_due' && item.title === 'วัคซีนรวม'));
  assert.ok(notifications.body.notifications.some(item => item.type === 'wellness_alert' && item.assigned_to_name === 'Member'));
  const vaccineReminder = notifications.body.notifications.find(item => item.type === 'health_due' && item.title === 'วัคซีนรวม');
  assert.match(vaccineReminder.notification_key, /^health_due:/);
  assert.equal((await call('POST', `households/${home.id}/notifications/dismiss`, outsider.body.token, { notification_key: vaccineReminder.notification_key })).status, 403);
  assert.equal((await call('POST', `households/${home.id}/notifications/dismiss`, owner.body.token, { notification_key: 'invalid' })).status, 400);
  assert.equal((await call('POST', `households/${home.id}/notifications/dismiss`, owner.body.token, { notification_key: vaccineReminder.notification_key })).status, 200);
  const afterDismiss = await call('GET', `households/${home.id}/notifications`, owner.body.token);
  assert.ok(!afterDismiss.body.notifications.some(item => item.notification_key === vaccineReminder.notification_key));
  const memberNotifications = await call('GET', `households/${home.id}/notifications`, member.body.token);
  assert.ok(memberNotifications.body.notifications.some(item => item.notification_key === vaccineReminder.notification_key));

  const beforeFollowUp = await call('GET', `households/${home.id}/tasks/today`, member.body.token);
  assert.equal(beforeFollowUp.body.tasks.find(item => item.id === alert.id)?.source_type, 'wellness_follow_up');
  assert.equal(beforeFollowUp.body.tasks.find(item => item.id === alert.id)?.display_status, 'pending');
  assert.equal((await call('POST', `wellness-alerts/${alert.id}/follow-up/complete`, outsider.body.token, {})).status, 403);
  const completedFollowUp = await call('POST', `wellness-alerts/${alert.id}/follow-up/complete`, member.body.token, {});
  assert.equal(completedFollowUp.status, 200);
  assert.ok(completedFollowUp.body.alert.follow_up_completed_at);
  assert.equal(completedFollowUp.body.alert.status, 'monitoring', 'finishing the follow-up must not claim the alert is medically resolved');
  assert.equal((await call('POST', `wellness-alerts/${alert.id}/follow-up/complete`, owner.body.token, {})).status, 200);
  const afterFollowUp = await call('GET', `households/${home.id}/tasks/today`, member.body.token);
  assert.equal(afterFollowUp.body.tasks.find(item => item.id === alert.id)?.display_status, 'completed');
  const calendar = await call('GET', `households/${home.id}/calendar?from=${followUpDate}&to=${followUpDate}`, owner.body.token);
  assert.equal(calendar.body.events.find(item => item.id === alert.id)?.status, 'completed');
  const afterFollowUpNotifications = await call('GET', `households/${home.id}/notifications`, owner.body.token);
  assert.ok(!afterFollowUpNotifications.body.notifications.some(item => item.id === alert.id));
  const nextFollowUpDate = dateAfter(followUpDate, 1);
  const rescheduledFollowUp = await call('PATCH', `wellness-alerts/${alert.id}/follow-up`, owner.body.token, { follow_up_due_date: nextFollowUpDate });
  assert.equal(rescheduledFollowUp.status, 200);
  assert.equal(rescheduledFollowUp.body.alert.follow_up_completed_at, null);

  const report = await call('GET', `pets/${pet.id}/vet-report?from=2026-09-20&to=2026-10-12`, member.body.token);
  assert.equal(report.status, 200);
  assert.equal(report.body.report.pet.name, 'Mochi');
  assert.equal(report.body.report.passport.length, 2);
  assert.equal(report.body.report.wellness_logs.length, 17);
  assert.equal(report.body.report.alerts.length, 1);
  assert.equal(report.body.report.alerts[0].assigned_to_name, 'Member');
  assert.equal((await call('GET', `pets/${pet.id}/vet-report?from=2025-01-01&to=2026-10-12`, member.body.token)).status, 400);
  assert.equal((await call('GET', `pets/${pet.id}/vet-report`, outsider.body.token)).status, 403);

  const activity = await call('GET', `households/${home.id}/activity?pet_id=${pet.id}`, owner.body.token);
  assert.ok(activity.body.items.some(item => item.action === 'assign' && item.entity_type === 'wellness_alert'));
  assert.equal((await call('POST', `households/${home.id}/archive`, owner.body.token, { confirmation_name: home.name })).status, 200);
  assert.equal((await call('GET', `pets/${pet.id}/vet-report`, member.body.token)).status, 403);
});
