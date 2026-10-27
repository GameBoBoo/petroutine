import { expect, test } from '@playwright/test';

test('owner can enable AI and open the household chatbot', async ({ page, request }, testInfo) => {
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const ownerResponse = await request.post('/api/v1/auth/register', { data: { name: 'AI Owner', email: `ai-e2e-${nonce}@example.com`, password: 'testing123' } });
  expect(ownerResponse.ok()).toBeTruthy();
  const owner = await ownerResponse.json();
  const homeResponse = await request.post('/api/v1/households', { headers: { authorization: `Bearer ${owner.token}` }, data: { name: 'AI Test Home' } });
  expect(homeResponse.ok()).toBeTruthy();
  const home = (await homeResponse.json()).household;
  const petResponse = await request.post(`/api/v1/households/${home.id}/pets`, { headers: { authorization: `Bearer ${owner.token}` }, data: { name: 'Mochi', species: 'dog' } });
  expect(petResponse.ok()).toBeTruthy();
  await page.addInitScript(({ session, householdId }) => {
    localStorage.setItem('pawroutine_session', JSON.stringify(session));
    localStorage.setItem('pawroutine_household', householdId);
  }, { session: owner, householdId: home.id });
  await page.goto('/#today');
  if (testInfo.project.name === 'mobile-375') await page.getByRole('button', { name: 'เพิ่มเติม' }).click();
  await page.getByRole('button', { name: 'ตั้งค่า', exact: true }).first().click();
  const aiSettings = page.getByRole('region', { name: 'การตั้งค่า AI' });
  await expect(aiSettings.getByRole('checkbox', { name: 'เปิดใช้งาน AI สำหรับบ้านนี้' })).toBeEnabled();
  await aiSettings.getByRole('checkbox', { name: 'เปิดใช้งาน AI สำหรับบ้านนี้' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'ยืนยัน', exact: true }).click();
  await expect(aiSettings.getByRole('checkbox', { name: 'เปิดใช้งาน AI สำหรับบ้านนี้' })).toBeChecked();
  await page.getByRole('button', { name: 'เปิดแชต AI' }).click();
  const chat = page.getByRole('dialog', { name: 'ถามเรื่องสัตว์เลี้ยง' });
  await expect(chat.getByRole('combobox', { name: 'สัตว์เลี้ยง' })).toContainText('ทุกตัวในบ้าน');
  await chat.getByRole('button', { name: 'ยินยอมและเริ่มถาม' }).click();
  await page.getByRole('alertdialog', { name: 'ยืนยันความยินยอมใช้ AI?' }).getByRole('button', { name: 'ยินยอมและเริ่มใช้งาน' }).click();
  await chat.getByLabel('พิมพ์คำถาม').fill('วันนี้ทำอะไรไปแล้วบ้าง');
  await expect(chat.getByRole('button', { name: 'ส่งคำถาม' })).toBeEnabled();
  await expect(chat.getByLabel('พิมพ์คำถาม')).toBeEnabled();
  await page.screenshot({ path: testInfo.outputPath('ai-consent.png'), fullPage: true });
});
