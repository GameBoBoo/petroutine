import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('authenticated shell and Today workflow expose the approved accessible structure', async () => {
  const files = await Promise.all([
    'components/Icon.jsx', 'components/Modal.jsx', 'components/UndoBar.jsx',
    'features/today/TodayView.jsx', 'features/today/TaskCard.jsx', 'features/today/useToday.js',
  ].map(read));
  const [icon, modal, undo, today, task, hook] = files;
  assert.match(icon, /aria-hidden/);
  assert.match(modal, /Escape/);
  assert.match(modal, /aria-modal="true"/);
  assert.match(today, /ต้องดูแลก่อน/);
  assert.match(today, /รายการถัดไป/);
  assert.match(today, /เสร็จแล้ว/);
  assert.match(today, /งานของฉัน/);
  assert.match(today, /ทุกคน/);
  assert.doesNotMatch(today, /today-hero/);
  assert.match(task, /เพิ่มหมายเหตุ/);
  assert.match(task, /เลื่อนเวลา/);
  assert.match(task, /เปลี่ยนผู้รับผิดชอบ/);
  assert.match(undo, /aria-live="polite"/);
  assert.match(undo, /ย้อนกลับ/);
  assert.match(hook, /expected_version/);
  assert.match(hook, /idempotency-key/);
});

test('responsive styles reserve safe mobile space and accessible targets', async () => {
  const css = await read('app/globals.css');
  assert.match(css, /\.undo-bar/);
  assert.match(css, /\.today-section/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /overflow-x:\s*hidden/);
});

test('Quick Add, routines, pets, and change history expose the approved product features', async () => {
  const [quick, form, templates, workspace, health, timeline, activity] = await Promise.all([
    'features/quick-add/QuickAddSheet.jsx', 'features/routines/RoutineForm.jsx', 'features/routines/templates.js',
    'features/pets/PetWorkspace.jsx', 'features/pets/HealthRecords.jsx', 'features/pets/PetTimeline.jsx',
    'features/activity/ActivityView.jsx',
  ].map(read));
  assert.match(quick, /สร้างจากเทมเพลต/);
  assert.match(quick, /สร้างกิจวัตรเอง/);
  assert.match(quick, /บันทึกการดูแลนอกตาราง/);
  assert.match(quick, /เพิ่มข้อมูลสุขภาพ/);
  assert.match(quick, /เพิ่มนัดหมายครั้งเดียว/);
  for (const name of ['อาหารเช้า', 'อาหารเย็น', 'เติมน้ำ', 'เดินเล่น', 'ดูแลขน', 'บันทึกยา', 'นัดสัตวแพทย์']) assert.match(templates, new RegExp(name));
  assert.match(form, /ตัวเลือกขั้นสูง/);
  assert.match(form, /เพิ่มเวลา/);
  assert.match(form, /ทุก X วัน/);
  assert.match(form, /ช่วงพัก/);
  assert.match(form, /error-summary/);
  assert.match(workspace, /ภาพรวม[\s\S]*กิจวัตร[\s\S]*สุขภาพ[\s\S]*ไทม์ไลน์/);
  for (const type of ['weight', 'vaccination', 'medication', 'appointment', 'observation', 'other']) assert.match(health, new RegExp(type));
  assert.match(health, /บันทึกการแก้ไข/);
  assert.match(health, /เก็บข้อมูลเก่า/);
  assert.match(timeline, /แหล่งข้อมูล/);
  assert.match(timeline, /ตั้งแต่/);
  assert.match(timeline, /ถึง/);
  assert.match(timeline, /โหลดเพิ่ม/);
  assert.match(activity, /สมาชิก/);
  assert.match(activity, /สัตว์เลี้ยง/);
  assert.match(activity, /การกระทำ/);
  assert.match(activity, /ก่อนเปลี่ยน/);
  assert.match(activity, /โหลดเพิ่ม/);
  assert.match(activity, /ลองอีกครั้ง/);
});

test('Docker image includes extracted UI modules and public assets', async () => {
  const dockerfile = await read('Dockerfile');
  assert.match(dockerfile, /COPY components \.\/components/);
  assert.match(dockerfile, /COPY features \.\/features/);
  assert.match(dockerfile, /COPY public \.\/public/);
  assert.match(dockerfile, /COPY --from=build \/app\/public \.\/public/);
});

test('default Compose exposes only the web port and dev override binds PostgreSQL locally', async () => {
  const [compose, devCompose, envExample] = await Promise.all([
    read('docker-compose.yml'), read('docker-compose.dev.yml'), read('.env.example'),
  ]);
  assert.match(compose, /\$\{PAWROUTINE_PORT:-3000\}:3000/);
  const dbService = compose.split('\n  db:\n')[1].split('\nvolumes:\n')[0];
  assert.doesNotMatch(dbService, /^    ports:/m);
  assert.match(devCompose, /127\.0\.0\.1:\$\{PAWROUTINE_DB_PORT:-55430\}:5432/);
  assert.match(envExample, /PAWROUTINE_PORT=3000/);
  assert.match(envExample, /PAWROUTINE_DB_PORT=55430/);
});
