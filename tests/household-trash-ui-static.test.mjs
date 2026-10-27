import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('household owners get a confirmed delete action without exposing archived homes', async () => {
  const page = await read('app/page.jsx');
  assert.match(page, /ยืนยันลบบ้าน/);
  assert.match(page, /พิมพ์ชื่อบ้าน/);
  assert.match(page, /\/archive/);
  assert.doesNotMatch(page, /<h3>ถังขยะ<\/h3>/);
  assert.doesNotMatch(page, /กู้คืนบ้าน/);
  assert.doesNotMatch(page, /\/households\/trash/);
  assert.doesNotMatch(page, /\/restore/);
});

test('the navigation is Thai and no longer exposes the change log', async () => {
  const page = await read('app/page.jsx');
  for (const label of ['วันนี้', 'ปฏิทิน', 'สัตว์เลี้ยง', 'กิจวัตร', 'ประวัติ', 'บ้านและสมาชิก', 'ตั้งค่า']) assert.match(page, new RegExp(`label: '${label}'`));
  assert.doesNotMatch(page, /ActivityView|id: 'activity'|ประวัติการเปลี่ยนแปลง/);
});
