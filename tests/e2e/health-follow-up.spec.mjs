import { expect, test } from '@playwright/test';

const bangkokToday = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Bangkok' }).format(new Date());
const shift = (day, offset) => new Date(Date.parse(`${day}T00:00:00Z`) + offset * 86_400_000).toISOString().slice(0, 10);

test('Today can complete a scheduled wellness follow-up', async ({ page, request }) => {
  const nonce = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const register = await request.post('/api/v1/auth/register', { data: { name: 'Follow Up Owner', email: `follow-up-${nonce}@example.com`, password: 'testing123' } });
  expect(register.ok()).toBeTruthy();
  const owner = await register.json();
  const headers = { authorization: `Bearer ${owner.token}` };
  const homeResponse = await request.post('/api/v1/households', { headers, data: { name: 'Follow Up Home' } });
  const home = (await homeResponse.json()).household;
  const petResponse = await request.post(`/api/v1/households/${home.id}/pets`, { headers, data: { name: 'Mochi', species: 'dog' } });
  const pet = (await petResponse.json()).pet;
  const today = bangkokToday();
  for (let index = -17; index <= -4; index += 1) {
    const response = await request.post(`/api/v1/pets/${pet.id}/wellness-logs`, { headers, data: { recorded_at: `${shift(today, index)}T08:00:00+07:00`, activity_level: 'usual' } });
    expect(response.status()).toBe(201);
  }
  for (let index = -3; index <= -1; index += 1) {
    const response = await request.post(`/api/v1/pets/${pet.id}/wellness-logs`, { headers, data: { recorded_at: `${shift(today, index)}T08:00:00+07:00`, activity_level: 'low' } });
    expect(response.status()).toBe(201);
  }
  const alerts = await request.get(`/api/v1/pets/${pet.id}/wellness-alerts`, { headers });
  const alert = (await alerts.json()).items.find(item => item.metric === 'activity_level');
  expect(alert).toBeTruthy();
  const schedule = await request.patch(`/api/v1/wellness-alerts/${alert.id}/follow-up`, { headers, data: { follow_up_due_date: today } });
  expect(schedule.ok()).toBeTruthy();

  await page.addInitScript(({ session, householdId }) => {
    localStorage.setItem('pawroutine_session', JSON.stringify(session));
    localStorage.setItem('pawroutine_household', householdId);
  }, { session: owner, householdId: home.id });
  await page.goto('/#today');
  const followUp = page.locator('.task-card').filter({ hasText: 'ติดตามสุขภาวะ: กิจกรรม' });
  await expect(followUp).toBeVisible();
  await followUp.getByRole('button', { name: 'เสร็จแล้ว' }).click();
  await expect(page.getByRole('alertdialog', { name: 'บันทึกว่าติดตามแล้ว?' })).toBeVisible();
  await page.getByRole('alertdialog').getByRole('button', { name: 'ยืนยันติดตามแล้ว' }).click();
  const after = await request.get(`/api/v1/households/${home.id}/tasks/today`, { headers });
  expect((await after.json()).tasks.find(item => item.id === alert.id).display_status).toBe('completed');
});
