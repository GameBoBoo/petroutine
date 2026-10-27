import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const bangkokToday = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Bangkok' }).format(new Date());
const shiftDay = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

async function post(request, path, token, body, headers = {}) {
  const response = await request.post(`/api/v1/${path}`, { data: body, headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers } });
  expect(response.ok(), `${path}: ${response.status()} ${await response.text()}`).toBeTruthy();
  return response.json();
}

async function setup(request) {
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const owner = await post(request, 'auth/register', null, { name: 'เจ้าของ', email: `owner-${nonce}@example.com`, password: 'testing123' });
  const member = await post(request, 'auth/register', null, { name: 'สมาชิก', email: `member-${nonce}@example.com`, password: 'testing123' });
  const home = await post(request, 'households', owner.token, { name: 'บ้านโมจิ' });
  await post(request, 'households/join', member.token, { invite_code: home.household.invite_code });
  const pet = await post(request, `households/${home.household.id}/pets`, owner.token, { name: 'โมจิ', species: 'dog', breed: 'โกลเด้นรีทรีฟเวอร์', sex: 'male', neuter_status: 'neutered', baseline_weight_kg: 12.5, baseline_weight_recorded_on: '2026-10-11' });
  const routine = await post(request, `pets/${pet.pet.id}/routines`, owner.token, { title: 'อาหารสองมื้อ', activity_type: 'feeding', schedule: { type: 'weekly', times: ['00:00', '23:59'], days: [0, 1, 2, 3, 4, 5, 6] } });
  return { owner, member, home: home.household, pet: pet.pet, routine: routine.routine };
}

async function openSession(page, fixture, session) {
  await page.addInitScript(({ sessionValue, householdId }) => {
    localStorage.setItem('pawroutine_session', JSON.stringify(sessionValue));
    localStorage.setItem('pawroutine_household', householdId);
  }, { sessionValue: session, householdId: fixture.home.id });
  await page.goto('/#today');
  await expect(page.getByRole('heading', { name: 'งานดูแลวันนี้' })).toBeVisible();
}

test('desktop care flow covers records, Timeline, hidden change history, and household deletion', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'desktop-only flow');
  const fixture = await setup(request);
  await openSession(page, fixture, fixture.owner);
  await page.locator('#main-content').getByRole('button', { name: 'เพิ่มรายการ', exact: true }).click();
  const quickAdd = page.getByRole('dialog');
  await quickAdd.getByRole('button', { name: /บันทึกการดูแล/ }).click();
  const defaultCareTime = await quickAdd.locator('input[type="datetime-local"]').inputValue();
  expect(Math.abs(Date.parse(`${defaultCareTime}:00+07:00`) - Date.now())).toBeLessThan(90_000);
  await quickAdd.getByRole('button', { name: 'ย้อนกลับ' }).click();
  await quickAdd.getByRole('button', { name: /เช็กอินรายวัน/ }).click();
  await quickAdd.getByLabel('ข้อสังเกต').fill('กินน้อยแต่ยังสดใส');
  await quickAdd.getByRole('button', { name: 'บันทึกเช็กอิน' }).click();
  await page.getByRole('alertdialog', { name: 'บันทึกเช็กอินรายวัน?' }).getByRole('button', { name: 'ยืนยันบันทึก' }).click();
  await expect(quickAdd.getByText('บันทึกเช็กอินเรียบร้อย')).toBeVisible();
  await quickAdd.getByRole('button', { name: 'เสร็จแล้ว' }).click();
  await expect(quickAdd).toBeHidden();
  const cards = page.locator('.today-workflow .task-card');
  await expect(page.getByRole('heading', { name: /บันทึกวันนี้/ })).toBeVisible();
  await expect(page.getByText('เช็กอินรายวัน', { exact: false })).toBeVisible();
  await expect(cards).toHaveCount(3);
  const first = cards.first();
  await first.getByRole('button', { name: 'เสร็จแล้ว' }).click();
  await page.getByRole('alertdialog', { name: 'บันทึกว่างานเสร็จแล้ว?' }).getByRole('button', { name: 'ยืนยัน' }).click();
  await expect(page.getByRole('button', { name: 'ย้อนกลับ' })).toBeVisible();
  await page.getByRole('button', { name: 'ย้อนกลับ' }).click();
  const undoConfirmation = page.getByRole('alertdialog', { name: 'ย้อนกลับการเปลี่ยนแปลง?' });
  await expect(undoConfirmation).toBeVisible();
  await Promise.all([
    page.waitForResponse(response => response.url().includes('/undo') && response.request().method() === 'POST'),
    undoConfirmation.getByRole('button', { name: 'ยืนยันย้อนกลับ' }).click(),
  ]);
  await expect(first.getByRole('button', { name: 'เสร็จแล้ว' })).toBeVisible();

  const today = await request.get(`/api/v1/households/${fixture.home.id}/tasks/today`, { headers: { authorization: `Bearer ${fixture.member.token}` } }).then(response => response.json());
  const [taskA, taskB] = today.tasks.filter(item => item.source_type === 'task');
  await post(request, `tasks/${taskB.id}/skip`, fixture.member.token, { expected_version: taskB.mutation_version, skip_reason: 'สัตว์เลี้ยงไม่พร้อม', notes: 'พักก่อน' }, { 'idempotency-key': crypto.randomUUID() });
  const beforeReassign = await request.get(`/api/v1/households/${fixture.home.id}/tasks/today`, { headers: { authorization: `Bearer ${fixture.member.token}` } }).then(response => response.json());
  const currentTaskA = beforeReassign.tasks.find(item => item.id === taskA.id);
  const reassignResponse = await request.patch(`/api/v1/tasks/${taskA.id}`, { headers: { authorization: `Bearer ${fixture.member.token}`, 'idempotency-key': crypto.randomUUID() }, data: { expected_version: currentTaskA.mutation_version, action: 'reassign', assigned_user_id: fixture.member.user.id } });
  expect(reassignResponse.ok(), `reassign: ${reassignResponse.status()} ${await reassignResponse.text()}`).toBeTruthy();
  const reassigned = await request.get(`/api/v1/households/${fixture.home.id}/tasks/today`, { headers: { authorization: `Bearer ${fixture.member.token}` } }).then(response => response.json());
  const changed = reassigned.tasks.find(item => item.id === taskA.id);
  const rescheduleResponse = await request.patch(`/api/v1/tasks/${taskA.id}`, { headers: { authorization: `Bearer ${fixture.member.token}`, 'idempotency-key': crypto.randomUUID() }, data: { expected_version: changed.mutation_version, action: 'reschedule', scheduled_at: changed.scheduled_at, reason: 'ทดสอบเลื่อนเวลา' } });
  expect(rescheduleResponse.ok(), `reschedule: ${rescheduleResponse.status()} ${await rescheduleResponse.text()}`).toBeTruthy();
  const care = await post(request, `households/${fixture.home.id}/care-entries`, fixture.member.token, { pet_id: fixture.pet.id, title: 'เช็ดหู', activity_type: 'grooming', occurred_at: new Date().toISOString(), notes: 'เรียบร้อย' });
  await request.patch(`/api/v1/care-entries/${care.entry.id}`, { headers: { authorization: `Bearer ${fixture.member.token}` }, data: { notes: 'แก้ไขแล้ว' } });
  await post(request, `care-entries/${care.entry.id}/archive`, fixture.member.token, {});
  const health = await post(request, `pets/${fixture.pet.id}/health-records`, fixture.owner.token, { record_type: 'weight', title: 'น้ำหนัก', recorded_at: new Date().toISOString(), numeric_value: 12.5, unit: 'kg', details: 'ผู้ใช้กรอกเอง' });
  await request.patch(`/api/v1/health-records/${health.record.id}`, { headers: { authorization: `Bearer ${fixture.owner.token}` }, data: { numeric_value: 12.6, unit: 'kg' } });
  await post(request, `health-records/${health.record.id}/archive`, fixture.owner.token, {});
  await post(request, `pets/${fixture.pet.id}/passport`, fixture.owner.token, { entry_type: 'vaccination', title: 'วัคซีนรวมประจำปี', details: 'บันทึกโดยเจ้าของ', start_date: '2026-10-11', next_due_date: '2027-10-11' });

  await page.getByRole('button', { name: 'สัตว์เลี้ยง' }).first().click();
  await expect(page.getByText('โกลเด้นรีทรีฟเวอร์')).toBeVisible();
  await page.getByRole('tab', { name: 'สุขภาพ', exact: true }).click();
  await page.getByRole('tab', { name: 'เช็กอินรายวัน' }).click();
  await expect(page.getByText('กินน้อยแต่ยังสดใส')).toBeVisible();
  await page.getByRole('tab', { name: 'ข้อมูลสุขภาพ' }).click();
  await expect(page.getByText('วัคซีนรวมประจำปี')).toBeVisible();
  await page.getByRole('tab', { name: 'ไทม์ไลน์' }).click();
  await expect(page.getByText('เช็ดหู')).toBeVisible();
  await expect(page.getByRole('button', { name: 'ประวัติการเปลี่ยนแปลง' })).toHaveCount(0);
  await page.getByRole('button', { name: 'บ้านและสมาชิก' }).first().click();
  await page.getByRole('button', { name: 'ลบบ้าน' }).click();
  const trashDialog = page.getByRole('dialog');
  const confirmTrash = trashDialog.getByRole('button', { name: 'ยืนยันลบบ้าน' });
  await expect(confirmTrash).toBeDisabled();
  await trashDialog.getByRole('textbox', { name: /พิมพ์ชื่อบ้าน/ }).fill('ชื่อไม่ตรง');
  await expect(confirmTrash).toBeDisabled();
  await trashDialog.getByRole('textbox', { name: /พิมพ์ชื่อบ้าน/ }).fill(fixture.home.name);
  await expect(confirmTrash).toBeEnabled();
  await confirmTrash.click();
  await expect(page.getByRole('heading', { name: 'ถังขยะ' })).toHaveCount(0);
  await expect(page.getByText(fixture.home.name, { exact: true })).toHaveCount(0);
});

test('mobile navigation keeps Quick Add and More usable at 375px without horizontal overflow', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-375', 'mobile-only assertion');
  const fixture = await setup(request);
  await openSession(page, fixture, fixture.owner);
  await page.getByRole('navigation', { name: 'เมนูบนมือถือ' }).getByRole('button', { name: 'เพิ่ม', exact: true }).click();
  await expect(page.getByRole('button', { name: /เช็กอินรายวัน/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /หรือเลือกจากแม่แบบกิจวัตร/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'ปิดหน้าต่าง' }).click();
  await page.getByRole('navigation', { name: 'เมนูบนมือถือ' }).getByRole('button', { name: 'เพิ่ม', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: /งานครั้งเดียว/ }).click();
  const appointment = page.getByRole('dialog');
  await expect(appointment.getByRole('heading', { name: 'เพิ่มงานครั้งเดียว' })).toBeVisible();
  await expect(appointment.locator('.date-picker-trigger')).toBeVisible();
  await expect(appointment.getByLabel(/เวลา 1/)).toBeVisible();
  await appointment.getByRole('button', { name: 'ปิดหน้าต่าง' }).click();
  await page.getByRole('navigation', { name: 'เมนูบนมือถือ' }).getByRole('button', { name: 'เพิ่มเติม' }).click();
  await expect(page.getByRole('heading', { name: 'เพิ่มเติม', level: 2 })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('wellness dashboard and alert lifecycle work on desktop and mobile', async ({ page, request }) => {
  const fixture = await setup(request);
  const today = bangkokToday();
  for (let index = 0; index < 14; index += 1) {
    const day = shiftDay(today, index - 17);
    await post(request, `pets/${fixture.pet.id}/wellness-logs`, fixture.owner.token, { recorded_at: `${day}T08:00:00+07:00`, activity_level: 'usual' });
  }
  for (const day of [-3, -2, -1].map(offset => shiftDay(today, offset))) {
    await post(request, `pets/${fixture.pet.id}/wellness-logs`, fixture.owner.token, { recorded_at: `${day}T08:00:00+07:00`, activity_level: 'low' });
  }
  await openSession(page, fixture, fixture.owner);
  await page.getByRole('button', { name: 'สัตว์เลี้ยง' }).first().click();
  await page.getByRole('tab', { name: 'สุขภาพ', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'ภาพรวมสุขภาวะ' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /กำลังติดตาม 1 รายการ/ })).toBeVisible();
  await expect(page.locator('.dashboard-metric-card').filter({ hasText: 'กิจกรรม' })).toBeVisible();
  await page.getByRole('button', { name: '7 วัน', exact: true }).click();
  await expect(page.getByText(/วันที่มีข้อมูล/)).toBeVisible();
  const dashboardOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(dashboardOverflow).toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: 'ดูรายการติดตาม' }).click();
  await page.getByRole('tab', { name: 'เช็กอินรายวัน' }).click();
  await page.locator('.checkin-insight').filter({ hasText: 'รายการติดตามสุขภาพ' }).locator('summary').first().click();
  await expect(page.getByRole('heading', { name: 'การเปลี่ยนแปลงที่ควรสังเกต' })).toBeVisible();
  const alert = page.locator('.wellness-alert-card').first();
  await expect(alert.getByRole('heading', { name: 'กิจกรรม' })).toBeVisible();
  await expect(alert.getByText('น้อยกว่าปกติ · น้อยกว่าปกติ · น้อยกว่าปกติ')).toBeVisible();
  await alert.getByRole('button', { name: 'รับทราบ' }).click();
  await page.getByRole('alertdialog', { name: 'รับทราบรายการนี้?' }).getByRole('button', { name: 'ยืนยัน' }).click();
  await expect(page.locator('.wellness-alert-card').first().getByText('รับทราบแล้ว')).toBeVisible();
  await page.locator('.wellness-alert-card').first().getByRole('button', { name: 'เริ่มติดตาม' }).click();
  await page.getByRole('alertdialog', { name: 'เริ่มติดตามรายการนี้?' }).getByRole('button', { name: 'ยืนยัน' }).click();
  await expect(page.locator('.wellness-alert-card').first().getByText('กำลังติดตาม')).toBeVisible();
});

test('Phase 10 reminders, shared monitoring and Vet Report work on desktop and mobile', async ({ page, request }, testInfo) => {
  test.setTimeout(90_000);
  const fixture = await setup(request);
  const today = bangkokToday();
  await post(request, `pets/${fixture.pet.id}/passport`, fixture.owner.token, { entry_type: 'vaccination', title: 'วัคซีนพิษสุนัขบ้า', next_due_date: today });
  for (let index = 0; index < 14; index += 1) {
    const day = shiftDay(today, index - 17);
    await post(request, `pets/${fixture.pet.id}/wellness-logs`, fixture.owner.token, { recorded_at: `${day}T08:00:00+07:00`, activity_level: 'usual', weight_kg: 12.5 });
  }
  for (const day of [-3, -2, -1].map(offset => shiftDay(today, offset))) {
    await post(request, `pets/${fixture.pet.id}/wellness-logs`, fixture.owner.token, { recorded_at: `${day}T08:00:00+07:00`, activity_level: 'low', weight_kg: 12.5 });
  }
  await openSession(page, fixture, fixture.owner);
  await page.getByRole('button', { name: /การแจ้งเตือน/ }).click();
  const notificationPanel = page.locator('.notification-panel');
  await expect(notificationPanel.getByText('วัคซีนพิษสุนัขบ้า')).toBeVisible();
  await expect(notificationPanel.getByText('ติดตามสุขภาพ')).toBeVisible();
  await page.getByRole('button', { name: 'ลบแจ้งเตือน วัคซีนพิษสุนัขบ้า' }).click();
  await page.getByRole('alertdialog', { name: 'ลบการแจ้งเตือนนี้?' }).getByRole('button', { name: 'ลบการแจ้งเตือน' }).click();
  await expect(notificationPanel.getByText('วัคซีนพิษสุนัขบ้า')).toHaveCount(0);
  await expect(notificationPanel.getByText('ติดตามสุขภาพ')).toBeVisible();
  await page.getByRole('button', { name: 'ปิดรายการแจ้งเตือน' }).click();
  await page.getByRole('button', { name: 'สัตว์เลี้ยง' }).first().click();
  await page.getByRole('tab', { name: 'สุขภาพ', exact: true }).click();
  await page.getByRole('tab', { name: 'เช็กอินรายวัน' }).click();
  await page.locator('.checkin-insight').filter({ hasText: 'รายการติดตามสุขภาพ' }).locator('summary').first().click();
  const alert = page.locator('.wellness-alert-card').first();
  await alert.getByRole('button', { name: 'จัดการผู้ติดตาม' }).click();
  await alert.getByRole('combobox').click();
  await page.getByRole('option', { name: 'สมาชิก' }).click();
  await alert.locator('.date-picker-trigger').click();
  await page.getByRole('dialog', { name: 'เลือกวันที่' }).getByRole('button', { name: 'วันนี้' }).click();
  await alert.getByLabel('หมายเหตุสำหรับคนในบ้าน').fill('สังเกตกิจกรรมหลังอาหารเย็น');
  await alert.getByRole('button', { name: 'บันทึกการติดตาม' }).click();
  await page.getByRole('alertdialog', { name: 'บันทึกแผนติดตาม?' }).getByRole('button', { name: 'ยืนยันบันทึก' }).click();
  await expect(alert.locator('.alert-follow-up-summary dd').first()).toHaveText('สมาชิก');
  await expect(alert.locator('.alert-follow-up-summary')).toContainText('สังเกตกิจกรรมหลังอาหารเย็น');
  await page.screenshot({ path: testInfo.outputPath('shared-follow-up.png'), fullPage: true });
  await page.getByRole('tab', { name: 'รายงานสัตวแพทย์' }).click();
  await expect(page.getByRole('heading', { name: 'รายงานสำหรับสัตวแพทย์' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'ดาวน์โหลด PDF' })).toBeEnabled();
  await expect(page.locator('.vet-report-paper').getByText('วัคซีนพิษสุนัขบ้า')).toBeVisible();
  await expect(page.locator('.vet-report-paper').getByText('สังเกตกิจกรรมหลังอาหารเย็น')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('vet-report.png'), fullPage: true });
  const downloadPromise = page.waitForEvent('download', { timeout: 45_000 });
  await page.getByRole('button', { name: 'ดาวน์โหลด PDF' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^PetRoutine-.*-Vet-Report-.*\.pdf$/);
  const pdf = await readFile(await download.path());
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  await download.saveAs(testInfo.outputPath('vet-report.pdf'));
  await page.evaluate(() => document.body.classList.add('printing-vet-report'));
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('.vet-report-paper')).toBeVisible();
  await expect(page.locator('.sidebar')).toBeHidden();
  await page.emulateMedia({ media: 'screen' });
  await page.evaluate(() => document.body.classList.remove('printing-vet-report'));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
