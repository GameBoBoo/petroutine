import { expect, test } from '@playwright/test';

async function workspace(request, page) {
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const register = await request.post('/api/v1/auth/register', {
    data: { name: 'UI Review', email: `ui-${nonce}@example.com`, password: 'testing123' },
  });
  expect(register.ok()).toBeTruthy();
  const session = await register.json();
  const createHome = await request.post('/api/v1/households', {
    headers: { authorization: `Bearer ${session.token}` },
    data: { name: 'บ้าน UI' },
  });
  expect(createHome.ok()).toBeTruthy();
  const home = (await createHome.json()).household;
  const createPet = await request.post(`/api/v1/households/${home.id}/pets`, {
    headers: { authorization: `Bearer ${session.token}` },
    data: { name: 'โมจิ', species: 'dog' },
  });
  expect(createPet.ok()).toBeTruthy();
  const pet = (await createPet.json()).pet;
  const createRoutine = await request.post(`/api/v1/pets/${pet.id}/routines`, {
    headers: { authorization: `Bearer ${session.token}` },
    data: { title: 'ให้อาหารโมจิ', activity_type: 'feeding', schedule: { type: 'weekly', times: ['08:00', '19:00'], days: [0, 1, 2, 3, 4, 5, 6] } },
  });
  expect(createRoutine.ok()).toBeTruthy();
  await page.addInitScript(({ sessionValue, householdId }) => {
    localStorage.setItem('pawroutine_session', JSON.stringify(sessionValue));
    localStorage.setItem('pawroutine_household', householdId);
  }, { sessionValue: session, householdId: home.id });
  await page.goto('/#today');
  await expect(page.locator('.app-shell.brand-workspace')).toBeVisible();
  await expect(page.locator('.sidebar-add')).toBeAttached();
  await expect(page.locator('.today-workflow .task-card').first()).toBeVisible();
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
}

const measure = async (page, selectors) => page.evaluate(keys => Object.fromEntries(keys.map(key => {
  const element = document.querySelector(key);
  const rect = element.getBoundingClientRect();
  const style = getComputedStyle(element);
  return [key, {
    x: Math.round(rect.x), width: Math.round(rect.width),
    padding: style.padding, background: style.backgroundColor, font: style.fontFamily,
  }];
})), selectors);

test('desktop navigation and every Pets tab keep one workspace layout', async ({ page, request }, testInfo) => {
  test.setTimeout(90_000);
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await workspace(request, page);
  await expect(page.getByRole('heading', { name: 'งานดูแลวันนี้' })).toBeVisible();
  await expect(page.locator('.today-welcome')).toBeVisible();
  await expect(page.locator('.today-next-card')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('today-desktop.png'), fullPage: true });
  await page.locator('.today-task-area').getByRole('button', { name: 'เพิ่มรายการ' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'ปิดหน้าต่าง' }).click();
  const firstTask = page.locator('.today-workflow .task-card').first();
  await firstTask.getByRole('button', { name: 'เสร็จแล้ว' }).click();
  await expect(page.getByRole('alertdialog', { name: 'บันทึกว่างานเสร็จแล้ว?' })).toBeVisible();
  await page.getByRole('alertdialog').getByRole('button', { name: 'ยืนยัน' }).click();
  await expect(page.locator('.undo-bar')).toBeVisible();
  await page.locator('.undo-bar').getByRole('button', { name: 'ย้อนกลับ' }).click();
  await expect(page.getByRole('alertdialog', { name: 'ย้อนกลับการเปลี่ยนแปลง?' })).toBeVisible();
  await page.getByRole('alertdialog').getByRole('button', { name: 'ยืนยันย้อนกลับ' }).click();
  await expect(firstTask.getByRole('button', { name: 'เสร็จแล้ว' })).toBeVisible();
  const shellSelectors = ['.sidebar', '.household-picker', '.sidebar-add', '.topbar'];
  const original = await measure(page, shellSelectors);
  const nav = page.getByRole('navigation', { name: 'เมนูหลัก' });
  for (const label of ['ปฏิทิน', 'สัตว์เลี้ยง', 'กิจวัตร', 'ประวัติ', 'บ้านและสมาชิก', 'ตั้งค่า', 'วันนี้']) {
    const item = label === 'วันนี้' ? nav.getByRole('button', { name: /^วันนี้(?: \d+)?$/ }) : nav.getByRole('button', { name: label, exact: true });
    await item.click();
    await expect(item).toHaveAttribute('aria-current', 'page');
    expect(await measure(page, shellSelectors)).toEqual(original);
  }

  await nav.getByRole('button', { name: 'สัตว์เลี้ยง' }).click();
  const petSelectors = ['.pet-workspace', '.pet-workspace-head', '.pet-workspace > .tab-list'];
  const petLayout = await measure(page, petSelectors);
  await expect(page.locator('.context-rail')).toBeHidden();
  for (const label of ['กิจวัตร', 'สุขภาพ', 'ไทม์ไลน์', 'รายงานสัตวแพทย์', 'ภาพรวม']) {
    await page.getByRole('tab', { name: label, exact: true }).click();
    await expect(page.getByRole('tab', { name: label, exact: true })).toHaveAttribute('aria-selected', 'true');
    expect(await measure(page, petSelectors)).toEqual(petLayout);
    await expect(page.locator('.context-rail')).toBeHidden();
  }
});

test('mobile navigation keeps page titles visible and Pets tabs in place', async ({ page, request }, testInfo) => {
  test.setTimeout(90_000);
  test.skip(testInfo.project.name !== 'mobile-375');
  await workspace(request, page);
  await expect(page.getByRole('heading', { name: 'งานดูแลวันนี้' })).toBeVisible();
  await expect(page.locator('.today-welcome')).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('today-mobile.png'), fullPage: true });
  const nav = page.getByRole('navigation', { name: 'เมนูบนมือถือ' });
  for (const label of ['ปฏิทิน', 'สัตว์เลี้ยง', 'วันนี้', 'เพิ่มเติม']) {
    await nav.getByRole('button', { name: label, exact: true }).click();
    await expect(page.locator('.topbar h1')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
  await nav.getByRole('button', { name: 'สัตว์เลี้ยง' }).click();
  const petLayout = await measure(page, ['.pet-workspace', '.pet-workspace-head', '.pet-workspace > .tab-list']);
  for (const label of ['กิจวัตร', 'สุขภาพ', 'ไทม์ไลน์', 'รายงานสัตวแพทย์', 'ภาพรวม']) {
    await page.getByRole('tab', { name: label, exact: true }).click();
    expect(await measure(page, ['.pet-workspace', '.pet-workspace-head', '.pet-workspace > .tab-list'])).toEqual(petLayout);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  }
});
