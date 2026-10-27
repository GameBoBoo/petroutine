import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { AI_CARE_DRAFT_SYSTEM_PROMPT } from '../lib/ai-prompts.js';
import { parseCareDraft } from '../lib/services/ai-care-draft-service.js';

const endpoint = new URL(`${(process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '')}/chat/completions`);
if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search) throw new Error('AI endpoint must be HTTPS without credentials/query');
if (!process.env.AI_API_KEY || !process.env.AI_MODEL) throw new Error('AI_API_KEY and AI_MODEL are required');
const cases = [
  { name: 'feeding draft', text: 'เมื่อเช้าโมจิกินอาหารหมดชาม', mode: 'care', activity_type: 'feeding' },
  { name: 'weight draft', text: 'วันนี้ชั่งน้ำหนักโมจิได้ 4.2 กิโลกรัม', mode: 'health', record_type: 'weight', numeric_value: '4.2' },
  { name: 'observation draft', text: 'สังเกตว่าโมจิซึมลงเล็กน้อย ยังไม่ได้พบสัตวแพทย์', mode: 'health', record_type: 'observation' },
];
const report = { started_at: new Date().toISOString(), model: process.env.AI_MODEL, synthetic_only: true, saves_records: false, cases: [] };
for (const item of cases) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST', signal: AbortSignal.timeout(35_000),
      headers: { authorization: `Bearer ${process.env.AI_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.AI_MODEL, temperature: 0.1, max_tokens: 450, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: AI_CARE_DRAFT_SYSTEM_PROMPT }, { role: 'user', content: JSON.stringify({ pet_name: 'โมจิ', text: item.text }) }] }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const draft = parseCareDraft(payload?.choices?.[0]?.message?.content);
    const checks = {
      mode: draft.mode === item.mode,
      type: (!item.activity_type || draft.activity_type === item.activity_type) && (!item.record_type || draft.record_type === item.record_type),
      numeric_value: !item.numeric_value || draft.numeric_value === item.numeric_value,
      thai: /[\u0E00-\u0E7F]/.test(draft.title),
      no_treatment_advice: !/(?:ควรให้ยา|เพิ่มขนาดยา|ลดขนาดยา|วินิจฉัยว่า)/.test(JSON.stringify(draft)),
    };
    const passed = Object.values(checks).every(Boolean);
    report.cases.push({ name: item.name, passed, checks, draft });
    console.log(`${passed ? 'PASS' : 'FAIL'} ${item.name}`);
  } catch (error) {
    report.cases.push({ name: item.name, passed: false, error: error.name === 'TimeoutError' ? 'completion timeout' : error.message });
    console.log(`FAIL ${item.name}: ${error.name === 'TimeoutError' ? 'completion timeout' : error.message}`);
  }
}
report.finished_at = new Date().toISOString();
report.passed = report.cases.filter(item => item.passed).length;
report.total = cases.length;
await mkdir('artifacts', { recursive: true });
await writeFile('artifacts/ai-draft-evaluation.json', JSON.stringify(report, null, 2) + '\n');
console.log(`Synthetic draft evaluation: ${report.passed}/${report.total} passed`);
if (report.passed !== report.total) process.exitCode = 1;
