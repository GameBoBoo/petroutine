import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('Phase 10 UI exposes reminders, shared follow-up and printable factual report', async () => {
  const [page, workspace, alerts, report, css] = await Promise.all([
    read('app/page.jsx'), read('features/pets/PetWorkspace.jsx'), read('features/pets/WellnessAlerts.jsx'),
    read('features/pets/VetReport.jsx'), read('app/globals.css'),
  ]);
  assert.match(page, /health_reminder_days/);
  assert.match(page, /NotificationItem/);
  assert.match(page, /item\.type === 'wellness_alert'/);
  assert.match(page, /ลบแจ้งเตือน/);
  assert.match(page, /notifications\/dismiss/);
  for (const label of ['วันนี้', 'ปฏิทิน', 'สัตว์เลี้ยง', 'กิจวัตร', 'ประวัติ', 'บ้านและสมาชิก', 'ตั้งค่า']) assert.match(page, new RegExp(`label: '${label}'`));
  assert.doesNotMatch(page, /label: 'ประวัติการเปลี่ยนแปลง'/);
  assert.doesNotMatch(page, /<h3>ถังขยะ<\/h3>/);
  assert.match(workspace, /\['report',/);
  assert.match(alerts, /จัดการผู้ติดตาม/);
  assert.match(alerts, /follow_up_due_date/);
  assert.match(alerts, /<label>ผู้ติดตาม/);
  assert.match(report, /ดาวน์โหลด PDF/);
  assert.match(report, /import\('html2pdf\.js'\)/);
  assert.doesNotMatch(report, /window\.print\(/);
  assert.match(report, /PetRoutine-\$\{safePetName\}-Vet-Report/);
  assert.match(report, /ไม่ใช่การวินิจฉัย/);
  assert.match(report, /<caption className="sr-only">/);
  assert.match(css, /@media print/);
  assert.match(css, /body\.printing-vet-report/);
  assert.match(css, /@media \(max-width: 700px\)/);
});
