import { expect, test } from '@playwright/test';

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
  const pet = await post(request, `households/${home.household.id}/pets`, owner.token, { name: 'โมจิ', species: 'dog' });
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

test('desktop care flow covers records, Timeline, change history, and household trash restore', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'desktop-only flow');
  const fixture = await setup(request);
  await openSession(page, fixture, fixture.owner);
  const cards = page.locator('.today-workflow .task-card');
  await expect(cards).toHaveCount(2);
  const first = cards.first();
  await first.getByRole('button', { name: 'เพิ่มหมายเหตุ' }).click();
  await first.getByRole('textbox', { name: 'หมายเหตุ (ไม่บังคับ)' }).fill('กินหมดแล้ว');
  await first.getByRole('button', { name: 'เสร็จแล้ว' }).click();
  await expect(page.getByRole('button', { name: 'ย้อนกลับ' })).toBeVisible();
  await Promise.all([
    page.waitForResponse(response => response.url().includes('/undo') && response.request().method() === 'POST'),
    page.getByRole('button', { name: 'ย้อนกลับ' }).click(),
  ]);
  await expect(first.getByRole('button', { name: 'เสร็จแล้ว' })).toBeVisible();

  const today = await request.get(`/api/v1/households/${fixture.home.id}/tasks/today`, { headers: { authorization: `Bearer ${fixture.member.token}` } }).then(response => response.json());
  const [taskA, taskB] = today.tasks;
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

  await page.getByRole('button', { name: 'สัตว์เลี้ยง' }).first().click();
  await page.getByRole('tab', { name: 'ไทม์ไลน์' }).click();
  await expect(page.getByText('เช็ดหู')).toBeVisible();
  await page.getByRole('button', { name: 'ประวัติการเปลี่ยนแปลง' }).first().click();
  await expect(page.getByRole('heading', { name: 'ประวัติการเปลี่ยนแปลง', level: 2, exact: true })).toBeVisible();
  await expect(page.locator('.activity-list article').first()).toBeVisible();

  await page.getByRole('button', { name: 'บ้านของเรา' }).first().click();
  await page.getByRole('button', { name: 'ย้ายบ้านไปถังขยะ' }).click();
  const trashDialog = page.getByRole('dialog');
  const confirmTrash = trashDialog.getByRole('button', { name: 'ย้ายบ้านไปถังขยะ' });
  await expect(confirmTrash).toBeDisabled();
  await trashDialog.getByRole('textbox', { name: /พิมพ์ชื่อบ้าน/ }).fill('ชื่อไม่ตรง');
  await expect(confirmTrash).toBeDisabled();
  await trashDialog.getByRole('textbox', { name: /พิมพ์ชื่อบ้าน/ }).fill(fixture.home.name);
  await expect(confirmTrash).toBeEnabled();
  await confirmTrash.click();
  await expect(page.getByRole('heading', { name: 'ถังขยะ' })).toBeVisible();
  await page.getByRole('button', { name: 'กู้คืนบ้าน' }).click();
  await expect(page.getByRole('heading', { name: fixture.home.name })).toBeVisible();
});

test('mobile navigation keeps Quick Add and More usable at 375px without horizontal overflow', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-375', 'mobile-only assertion');
  const fixture = await setup(request);
  await openSession(page, fixture, fixture.owner);
  await page.getByRole('navigation', { name: 'เมนูบนมือถือ' }).getByRole('button', { name: 'เพิ่ม', exact: true }).click();
  await expect(page.getByRole('button', { name: /สร้างจากเทมเพลต/ })).toBeVisible();
  await page.getByRole('button', { name: /สร้างจากเทมเพลต/ }).click();
  await expect(page.getByRole('button', { name: /อาหารเช้า/ })).toBeVisible();
  await page.getByRole('button', { name: 'ปิดหน้าต่าง' }).click();
  await page.getByRole('navigation', { name: 'เมนูบนมือถือ' }).getByRole('button', { name: 'เพิ่มเติม' }).click();
  await expect(page.getByRole('heading', { name: 'เพิ่มเติม', level: 2 })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
