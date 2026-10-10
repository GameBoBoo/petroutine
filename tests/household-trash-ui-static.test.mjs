import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('household owners get a confirmed trash action and a restore list', async () => {
  const page = await read('app/page.jsx');
  assert.match(page, /ย้ายบ้านไปถังขยะ/);
  assert.match(page, /พิมพ์ชื่อบ้าน/);
  assert.match(page, /กู้คืนบ้าน/);
  assert.match(page, /\/households\/trash/);
  assert.match(page, /\/archive/);
  assert.match(page, /\/restore/);
});

test('the navigation explains the change log and no longer exposes handover', async () => {
  const [page, activity] = await Promise.all([
    read('app/page.jsx'),
    read('features/activity/ActivityView.jsx'),
  ]);
  assert.match(page, /ประวัติการเปลี่ยนแปลง/);
  assert.doesNotMatch(page, /HandoverView|id: 'handover'|ส่งต่องาน/);
  assert.match(activity, /ใครเปลี่ยนข้อมูลอะไรและเมื่อใด/);
});
