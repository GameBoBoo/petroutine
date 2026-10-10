import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { after, before, test } from 'node:test';
import pg from 'pg';

const schema = `service_foundations_${crypto.randomBytes(8).toString('hex')}`;
const admin = new pg.Client({ connectionString: process.env.DATABASE_URL });
let db;

before(async () => {
  await admin.connect();
  await admin.query(`CREATE SCHEMA ${schema}`);
  db = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    options: `-c search_path=${schema},public`,
  });
  await db.query('CREATE TABLE transaction_probe (value TEXT NOT NULL)');
});

after(async () => {
  if (db) await db.end();
  try {
    await admin.query(`DROP SCHEMA ${schema} CASCADE`);
  } finally {
    await admin.end();
  }
});

async function loadFoundations() {
  try {
    const [{ withTransaction }, { ServiceError }] = await Promise.all([
      import('../lib/services/transaction.js'),
      import('../lib/services/service-errors.js'),
    ]);
    return { withTransaction, ServiceError };
  } catch {
    assert.fail('transaction and ServiceError foundations must exist');
  }
}

test('withTransaction commits returned work and rolls back thrown work', async () => {
  const { withTransaction } = await loadFoundations();

  const result = await withTransaction(async client => {
    await client.query("INSERT INTO transaction_probe (value) VALUES ('committed')");
    return 'saved';
  }, db);
  assert.equal(result, 'saved');

  await assert.rejects(
    withTransaction(async client => {
      await client.query("INSERT INTO transaction_probe (value) VALUES ('rolled back')");
      throw new Error('stop transaction');
    }, db),
    /stop transaction/,
  );

  const rows = await db.query('SELECT value FROM transaction_probe ORDER BY value');
  assert.deepEqual(rows.rows, [{ value: 'committed' }]);
});

test('ServiceError carries the public API error contract', async () => {
  const { ServiceError } = await loadFoundations();
  const error = new ServiceError('INVALID_FIELD', 'กรุณาตรวจข้อมูล', 422, { time: 'เวลาไม่ถูกต้อง' });

  assert.equal(error.name, 'ServiceError');
  assert.equal(error.code, 'INVALID_FIELD');
  assert.equal(error.message, 'กรุณาตรวจข้อมูล');
  assert.equal(error.status, 422);
  assert.deepEqual(error.fields, { time: 'เวลาไม่ถูกต้อง' });
});
