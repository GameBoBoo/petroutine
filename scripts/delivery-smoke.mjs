import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const base = process.env.SMOKE_BASE_URL || 'http://127.0.0.1:3000';
const health = await fetch(`${base}/api/v1/health`);
assert.equal(health.status, 200);
assert.equal((await health.json()).database, 'ok');
assert.equal((await fetch(`${base}/api/v1/households`)).status, 401);
const home = await fetch(base);
assert.equal(home.status, 200);
// Synthetic account also provides real data for the subsequent backup/restore check.
const register = await fetch(`${base}/api/v1/auth/register`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ name: 'Delivery Smoke', email: `delivery-${crypto.randomUUID()}@example.com`, password: crypto.randomBytes(24).toString('hex') }),
});
assert.equal(register.status, 201);
const { token } = await register.json();
assert.ok(token);
const headers = { 'content-type': 'application/json', authorization: `Bearer ${token}` };
const householdResponse = await fetch(`${base}/api/v1/households`, { method: 'POST', headers, body: JSON.stringify({ name: 'Synthetic Delivery Home' }) });
assert.equal(householdResponse.status, 201);
const { household } = await householdResponse.json();
const pet = await fetch(`${base}/api/v1/households/${household.id}/pets`, { method: 'POST', headers, body: JSON.stringify({ name: 'Delivery Mochi', species: 'cat' }) });
assert.equal(pet.status, 201);
const list = await fetch(`${base}/api/v1/households/${household.id}/pets`, { headers });
assert.ok((await list.json()).pets.some(row => row.name === 'Delivery Mochi'));
console.log(JSON.stringify({ status: 'passed', checks: ['health/database', 'unauthenticated access denied', 'landing', 'register', 'create household', 'create/read pet'], data: 'synthetic only' }));
