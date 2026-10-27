import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('wellness alerts expose evidence, lifecycle actions, disclaimer and accessible status', async () => {
  const source = await readFile(new URL('../features/pets/WellnessAlerts.jsx', import.meta.url), 'utf8');
  for (const text of ['การเปลี่ยนแปลงที่ควรสังเกต', 'ค่าปกติส่วนตัว', 'ค่าที่พบ 3 วัน', 'รับทราบ', 'เริ่มติดตาม', 'ไม่ใช่การวินิจฉัย', 'role="status"', 'aria-pressed']) {
    assert.match(source, new RegExp(text));
  }
  const wellness = await readFile(new URL('../features/pets/WellnessLogs.jsx', import.meta.url), 'utf8');
  assert.match(wellness, /<WellnessAlerts/);
});
