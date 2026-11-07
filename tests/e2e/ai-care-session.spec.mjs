import { expect, test } from '@playwright/test';

test('care tools retain an in-flight summary across navigation and only refresh AI on request', async ({ page, request }) => {
  async function api(method, path, token, data) {
    const response = await request.fetch(`/api/v1/${path}`, { method, headers: token ? { authorization: `Bearer ${token}` } : {}, data });
    expect(response.ok()).toBeTruthy();
    return response.json();
  }
  const owner = await api('POST', 'auth/register', null, { name: 'Cache Owner', email: `care-cache-${Date.now()}-${Math.random()}@example.com`, password: 'testing123' });
  const { household } = await api('POST', 'households', owner.token, { name: 'Care cache test' });
  await api('POST', `households/${household.id}/pets`, owner.token, { name: 'Cache Pet', species: 'cat' });
  await api('PATCH', `households/${household.id}/ai-settings`, owner.token, { enabled: true });
  await api('PATCH', `households/${household.id}/ai-consent`, owner.token, { consented: true });
  await page.addInitScript(({ owner, id }) => {
    localStorage.setItem('pawroutine_session', JSON.stringify(owner));
    localStorage.setItem('pawroutine_household', id);
  }, { owner, id: household.id });
  let calls = 0;
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route('**/api/v1/households/*/ai-insights', async route => {
    const call = ++calls;
    if (call === 1) await pending;
    await route.fulfill({ json: { insight: { answer: `สรุปทดสอบครั้งที่ ${call}`, sources: [] } } });
  });
  await page.goto('/#today');
  await page.getByRole('button', { name: 'เปิดเครื่องมือช่วยดูแล', exact: true }).click();
  await page.getByRole('button', { name: 'สรุปส่งต่อคนในบ้าน', exact: true }).click();
  await expect.poll(() => calls).toBe(1);
  await page.evaluate(() => { location.hash = 'pets'; });
  await expect(page.locator('.ai-care-brief')).toHaveCount(0);
  release();
  await page.evaluate(() => { location.hash = 'today'; });
  await expect(page.getByText('สรุปทดสอบครั้งที่ 1', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'เปิดเครื่องมือช่วยดูแล', exact: true })).toHaveCount(0);
  for (const hash of ['calendar', 'today', 'pets', 'today']) {
    await page.evaluate(value => { location.hash = value; }, hash);
    if (hash === 'today') await expect(page.getByText('สรุปทดสอบครั้งที่ 1', { exact: true })).toBeVisible();
    else await expect(page.locator('.ai-care-brief')).toHaveCount(0);
  }
  expect(calls).toBe(1);
  await page.getByRole('button', { name: 'ปิดสรุป', exact: true }).click();
  await page.getByRole('button', { name: 'ดูสรุปล่าสุด', exact: true }).click();
  await expect(page.getByText('สรุปทดสอบครั้งที่ 1', { exact: true })).toBeVisible();
  expect(calls).toBe(1);
  await page.getByRole('button', { name: 'อัปเดตสรุป', exact: true }).click();
  await expect(page.getByText('สรุปทดสอบครั้งที่ 2', { exact: true })).toBeVisible();
  expect(calls).toBe(2);
  await expect(page.locator('.ai-care-result-head small')).toContainText('อัปเดตเมื่อ');
});
