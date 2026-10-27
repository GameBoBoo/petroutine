import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('Wellness Dashboard exposes ranges, accessible charts, data tables and non-diagnostic copy', async () => {
  const source = await readFile(new URL('../features/pets/WellnessDashboard.jsx', import.meta.url), 'utf8');
  for (const pattern of [/ภาพรวมสุขภาวะ/, /\[7, 14, 30, 90\]/, /role="img"/, /aria-label=\{summary\}/, /<table>/, /<caption className="sr-only">/, /aria-pressed/, /ไม่เติมค่าของวันที่ไม่มีข้อมูล/, /ไม่ใช่การวินิจฉัย/]) {
    assert.match(source, pattern);
  }
  const workspace = await readFile(new URL('../features/pets/PetWorkspace.jsx', import.meta.url), 'utf8');
  assert.match(workspace, /HEALTH_TABS =/);
  assert.match(workspace, /<WellnessDashboard/);
});
