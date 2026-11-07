async function showManagement(page) { const button = page.locator('.management-toolbar button'); await button.waitFor(); if (await button.getAttribute('aria-pressed') !== 'true') await button.click(); }
import { expect, test } from '@playwright/test';

// An unchanged Bangkok time must survive edits even on a browser outside Thailand.
test.use({ timezoneId: 'UTC' });

async function post(request, path, token, data) {
  const response = await request.post(`/api/v1/${path}`, { headers: token ? { authorization: `Bearer ${token}` } : {}, data });
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json();
}

async function get(request, path, token) {
  const response = await request.get(`/api/v1/${path}`, { headers: { authorization: `Bearer ${token}` } });
  expect(response.ok(), await response.text()).toBeTruthy();
  return response.json();
}

async function fixture(request) {
  const nonce = `${Date.now()}-${Math.random()}`;
  const owner = await post(request, 'auth/register', null, { name: 'Care Owner', email: `edit-owner-${nonce}@example.com`, password: 'testing123' });
  const creator = await post(request, 'auth/register', null, { name: 'Care Creator', email: `edit-creator-${nonce}@example.com`, password: 'testing123' });
  const reader = await post(request, 'auth/register', null, { name: 'Care Reader', email: `edit-reader-${nonce}@example.com`, password: 'testing123' });
  const { household } = await post(request, 'households', owner.token, { name: 'Record Editing Home' });
  await post(request, 'households/join', creator.token, { invite_code: household.invite_code });
  await post(request, 'households/join', reader.token, { invite_code: household.invite_code });
  const { pet } = await post(request, `households/${household.id}/pets`, owner.token, { name: 'Mochi', species: 'cat' });
  return { owner, creator, reader, household, pet };
}

async function openPetsAs(page, session, household) {
  await page.goto('/#pets');
  await page.evaluate(({ session, householdId }) => {
    localStorage.setItem('pawroutine_session', JSON.stringify(session));
    localStorage.setItem('pawroutine_household', householdId);
  }, { session, householdId: household.id });
  await page.reload();
  await expect(page.getByRole('tab', { name: 'ไทม์ไลน์', exact: true })).toBeVisible({ timeout: 15_000 });
}

const bangkokToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const careCard = page => page.locator('.timeline-item').filter({ has: page.locator('.timeline-type-care_entry') });

test('care entries can be edited and archived from Timeline by creator or owner, with confirmation and read-only access for other members', async ({ page, request }) => {
  test.setTimeout(90_000);
  const { owner, creator, reader, household, pet } = await fixture(request);
  const originalTime = `${bangkokToday()}T08:45:37.125+07:00`;
  const { entry } = await post(request, `households/${household.id}/care-entries`, creator.token, {
    pet_id: pet.id, title: 'Special grooming', activity_type: 'grooming', occurred_at: originalTime, notes: 'Original note',
  });

  await openPetsAs(page, owner, household);
  await page.getByRole('tab', { name: 'ไทม์ไลน์', exact: true }).click();
  await page.getByRole('searchbox', { name: 'ค้นหารายการหรือผู้บันทึก' }).fill('Special');
  let card = careCard(page);
  await showManagement(page);
  await card.getByRole('button', { name: 'แก้ไขบันทึก Special grooming', exact: true }).click();
  let form = card.getByRole('form', { name: 'แก้ไขบันทึกการดูแล' });
  await expect(form.getByLabel('เลือกเวลา', { exact: true })).toHaveValue('08:45');
  await form.getByRole('textbox', { name: /ชื่อรายการ/ }).fill('Special grooming revised');
  await form.getByRole('button', { name: 'บันทึกการแก้ไข', exact: true }).click();
  await page.getByRole('alertdialog', { name: 'บันทึกการแก้ไขรายการดูแล?' }).getByRole('button', { name: 'ยกเลิก', exact: true }).click();
  expect((await get(request, `households/${household.id}/care-entries`, owner.token)).items[0].title).toBe('Special grooming');
  await form.getByRole('button', { name: 'บันทึกการแก้ไข', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'ยืนยันบันทึก', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'บันทึกการแก้ไขรายการดูแลแล้ว' })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'ค้นหารายการหรือผู้บันทึก' })).toHaveValue('Special');
  let activeEntry = (await get(request, `households/${household.id}/care-entries`, owner.token)).items.find(item => item.id === entry.id);
  expect(activeEntry.title).toBe('Special grooming revised');
  expect(activeEntry.occurred_at).toBe(new Date(originalTime).toISOString());
  await page.goto('/#today');
  await expect(page.locator('.task-card').filter({ hasText: 'Special grooming revised' })).toBeVisible();

  await openPetsAs(page, reader, household);
  await page.getByRole('tab', { name: 'ไทม์ไลน์', exact: true }).click();
  card = careCard(page);
  await expect(card).toBeVisible();
  // Wait for the permission-data request before asserting controls are absent.
  await expect.poll(() => page.locator('.timeline-list[aria-busy="false"]').count()).toBe(1);
  await expect(card.getByRole('button', { name: /แก้ไขบันทึก|ลบบันทึก/ })).toHaveCount(0);

  await openPetsAs(page, creator, household);
  await page.getByRole('tab', { name: 'ไทม์ไลน์', exact: true }).click();
  card = careCard(page);
  await showManagement(page);
  await card.getByRole('button', { name: 'แก้ไขบันทึก Special grooming revised', exact: true }).click();
  form = card.getByRole('form', { name: 'แก้ไขบันทึกการดูแล' });
  await form.getByLabel('เลือกเวลา', { exact: true }).fill('09:30');
  await form.getByRole('textbox', { name: 'รายละเอียด', exact: true }).fill('Updated by creator');
  await form.getByRole('button', { name: 'บันทึกการแก้ไข', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'ยืนยันบันทึก', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'บันทึกการแก้ไขรายการดูแลแล้ว' })).toBeVisible();
  activeEntry = (await get(request, `households/${household.id}/care-entries`, creator.token)).items.find(item => item.id === entry.id);
  expect(activeEntry.occurred_at).toBe(new Date(`${bangkokToday()}T09:30:00+07:00`).toISOString());
  expect(activeEntry.notes).toBe('Updated by creator');

  card = careCard(page);
  await showManagement(page);
  await card.getByRole('button', { name: 'ลบบันทึก Special grooming revised', exact: true }).click();
  await page.getByRole('alertdialog', { name: 'ลบบันทึกการดูแล?' }).getByRole('button', { name: 'ยกเลิก', exact: true }).click();
  expect((await get(request, `households/${household.id}/care-entries`, creator.token)).items).toHaveLength(1);
  await showManagement(page);
  await card.getByRole('button', { name: 'ลบบันทึก Special grooming revised', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'ยืนยันลบ', exact: true }).click();
  await expect(card.getByText('ลบจากรายการที่ใช้งานแล้ว · เก็บไว้ในประวัติ', { exact: true })).toBeVisible();
  await expect(card.getByRole('button', { name: /แก้ไขบันทึก|ลบบันทึก/ })).toHaveCount(0);
  expect((await get(request, `households/${household.id}/care-entries`, creator.token)).items).toHaveLength(0);
  await page.goto('/#today');
  await expect(page.getByRole('heading', { name: 'งานดูแลวันนี้', exact: true })).toBeVisible();
  await expect(page.locator('.task-card').filter({ hasText: 'Special grooming revised' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test('health record title edits preserve the instant and time edits use Bangkok time in a UTC browser', async ({ page, request }) => {
  const { owner, household, pet } = await fixture(request);
  const originalTime = `${bangkokToday()}T08:45:37.125+07:00`;
  const { record } = await post(request, `pets/${pet.id}/health-records`, owner.token, {
    record_type: 'observation', title: 'Health observation', recorded_at: originalTime, details: 'Normal',
  });
  await openPetsAs(page, owner, household);
  await page.getByRole('tab', { name: 'สุขภาพ', exact: true }).click();
  await page.getByRole('tab', { name: 'บันทึกเหตุการณ์', exact: true }).click();
  let card = page.locator('.record-list > article').first();
  await showManagement(page);
  await card.getByRole('button', { name: 'แก้ไข', exact: true }).click();
  let form = card.locator('form');
  await expect(form.getByLabel('เลือกเวลา', { exact: true })).toHaveValue('08:45');
  await form.getByRole('textbox', { name: /ชื่อรายการ/ }).fill('Health observation revised');
  await form.getByRole('button', { name: 'บันทึกการแก้ไข', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'ยืนยันบันทึก', exact: true }).click();
  card = page.locator('.record-list > article').first();
  await expect(page.getByRole('button', { name: 'เสร็จสิ้น', exact: true })).toBeVisible();
  let updated = (await get(request, `pets/${pet.id}/health-records`, owner.token)).items.find(item => item.id === record.id);
  expect(updated.recorded_at).toBe(new Date(originalTime).toISOString());
  await showManagement(page);
  await card.getByRole('button', { name: 'แก้ไข', exact: true }).click();
  form = card.locator('form');
  await form.getByLabel('เลือกเวลา', { exact: true }).fill('09:30');
  await form.getByRole('button', { name: 'บันทึกการแก้ไข', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'ยืนยันบันทึก', exact: true }).click();
  await expect(page.getByRole('button', { name: 'เสร็จสิ้น', exact: true })).toBeVisible();
  updated = (await get(request, `pets/${pet.id}/health-records`, owner.token)).items.find(item => item.id === record.id);
  expect(updated.recorded_at).toBe(new Date(`${bangkokToday()}T09:30:00+07:00`).toISOString());
  await page.goto('/#today');
  await expect(page.locator('.task-card').filter({ hasText: 'Health observation revised' })).toBeVisible();
});
