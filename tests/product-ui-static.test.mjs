import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('authenticated shell and Today workflow expose the approved accessible structure', async () => {
  const files = await Promise.all([
    'components/Icon.jsx', 'components/Modal.jsx', 'components/UndoBar.jsx',
    'features/today/TodayView.jsx', 'features/today/TaskCard.jsx', 'app/page.jsx', 'features/today/TaskOptions.jsx',
  ].map(read));
  const [icon, modal, undo, today, task, page, taskOptions] = files;
  assert.match(icon, /aria-hidden/);
  assert.match(modal, /Escape/);
  assert.match(modal, /aria-modal="true"/);
  assert.match(today, /ต้องดูแลก่อน/);
  assert.match(today, /รายการถัดไป/);
  assert.match(today, /บันทึกวันนี้/);
  assert.match(today, /เสร็จแล้ว/);
  assert.match(today, /งานของฉัน/);
  assert.match(today, /ทุกคน/);
  assert.doesNotMatch(today, /today-hero/);
  assert.match(task, /task-outcome-note/);
  assert.match(task, /skip-other-reason/);
  assert.match(task, /otherReason\.trim\(\)/);
  assert.match(task, /task-overdue-badge/);
  assert.match(task, /task-pet-label/);
  assert.match(task, /<TaskOptions/);
  assert.match(taskOptions, /เลื่อนเวลา/);
  assert.match(taskOptions, /ผู้รับผิดชอบ/);
  assert.match(taskOptions, /ปรับเฉพาะงานครั้งนี้/);
  assert.match(undo, /aria-live="polite"/);
  assert.match(undo, /ย้อนกลับ/);
  assert.match(page, /expected_version/);
  assert.match(page, /idempotency-key/);
});

test('responsive styles reserve safe mobile space and accessible targets', async () => {
  const css = await read('app/globals.css');
  assert.match(css, /\.undo-bar/);
  assert.match(css, /\.today-section/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /overflow-x:\s*hidden/);
});

test('Quick Add, routines, pets, and daily wellness expose the approved product features', async () => {
  const [quick, form, templates, workspace, health, wellness, baseline, timeline, formOptions] = await Promise.all([
    'features/quick-add/QuickAddSheet.jsx', 'features/routines/RoutineForm.jsx', 'features/routines/templates.js',
    'features/pets/PetWorkspace.jsx', 'features/pets/HealthRecords.jsx', 'features/pets/WellnessLogs.jsx', 'features/pets/WellnessBaseline.jsx', 'features/pets/PetTimeline.jsx', 'lib/form-options.js',
  ].map(read));
  assert.match(quick, /onSelect\('appointment'\)/);
  assert.match(quick, /onSelect\('routine'\)/);
  assert.match(quick, /selectMode\('care'\)/);
  assert.match(quick, /selectMode\('health'\)/);
  assert.match(quick, /selectMode\('wellness'\)/);
  assert.match(quick, /quick-add-shortcuts/);
  assert.match(quick, /timeZone: 'Asia\/Bangkok'/);
  assert.match(quick, /\+07:00/);
  for (const name of ['อาหารเช้า', 'อาหารเย็น', 'เติมน้ำ', 'เดินเล่น', 'ดูแลขน', 'ให้ยา', 'นัดสัตวแพทย์']) assert.match(templates, new RegExp(name));
  assert.match(form, /ตัวเลือกเพิ่มเติม/);
  assert.match(form, /เพิ่มเวลา/);
  assert.match(form, /ทำซ้ำทุกกี่วัน/);
  assert.match(form, /ช่วงพัก/);
  assert.match(form, /error-summary/);
  assert.match(form, /timeZone: 'Asia\/Bangkok'/);
  assert.doesNotMatch(form, /schedule_type/);
  assert.doesNotMatch(form, /time: form\.times\[0\]/);
  assert.doesNotMatch(quick, /<label>หน่วย/);
  for (const activity of ['feeding', 'walk', 'grooming']) assert.match(quick, new RegExp(`'${activity}'`));
  assert.match(workspace, /const TABS =/);
  assert.match(wellness, /กรอกหรือเลือกอย่างน้อย 1 รายการ ช่องอื่นเว้นว่างได้/);
  assert.match(wellness, /food_intake/);
  assert.match(wellness, /water_intake/);
  assert.match(wellness, /activity_level/);
  assert.match(wellness, /sleep_amount/);
  assert.match(wellness, /stool_condition/);
  assert.match(wellness, /weight_kg/);
  assert.match(baseline, /ช่วงเรียนรู้ค่าปกติ 14 วัน/);
  assert.match(baseline, /ข้อมูลยังไม่เพียงพอ/);
  assert.match(baseline, /<progress/);
  assert.match(baseline, /ช่องที่ไม่ได้กรอกจะไม่นับเป็นศูนย์/);
  for (const type of ['weight', 'vaccination', 'medication', 'appointment', 'observation', 'other']) assert.match(formOptions, new RegExp(type));
  assert.match(health, /บันทึกการแก้ไข/);
  assert.match(health, />ลบ</);
  assert.match(timeline, /แหล่งข้อมูล/);
  assert.match(timeline, /ตั้งแต่/);
  assert.match(timeline, /ถึง/);
  assert.match(timeline, /<Pagination/);
  assert.match(timeline, /changePage/);
});

test('Docker image includes extracted UI modules and public assets', async () => {
  const dockerfile = await read('Dockerfile');
  assert.match(dockerfile, /COPY components \.\/components/);
  assert.match(dockerfile, /COPY features \.\/features/);
  assert.match(dockerfile, /COPY public \.\/public/);
  assert.match(dockerfile, /COPY --from=build \/app\/public \.\/public/);
});

test('production and development servers use distinct loopback ports', async () => {
  const [compose, devCompose, envExample, packageSource] = await Promise.all([
    read('docker-compose.yml'), read('docker-compose.dev.yml'), read('.env.example'), read('package.json'),
  ]);
  assert.match(compose, /\$\{PAWROUTINE_PORT:-3000\}:3000/);
  const dbService = compose.split('\n  db:\n')[1].split('\nvolumes:\n')[0];
  assert.doesNotMatch(dbService, /^    ports:/m);
  assert.match(devCompose, /127\.0\.0\.1:\$\{PAWROUTINE_DB_PORT:-55430\}:5432/);
  assert.match(envExample, /PAWROUTINE_PORT=3000/);
  assert.match(envExample, /PAWROUTINE_DB_PORT=55430/);
  assert.equal(JSON.parse(packageSource).scripts.dev, 'next dev -H 127.0.0.1 -p 3001');
});
