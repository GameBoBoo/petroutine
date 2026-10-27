import 'dotenv/config';

const model = process.argv[2] || process.env.AI_MODEL;
const key = process.env.AI_API_KEY;
const base = (process.env.AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');

if (!key || !model) {
  console.error('AI_API_KEY and AI_MODEL must be set in .env');
  process.exitCode = 1;
} else {
  try {
    const endpoint = new URL(`${base}/models/${encodeURIComponent(model)}`);
    if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search) {
      throw new Error('AI_BASE_URL must be an HTTPS URL without credentials or query parameters');
    }
    const response = await fetch(endpoint, {
      headers: { authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15_000),
    });
    console.log(`AI provider model check: HTTP ${response.status}; model=${model}; host=${endpoint.host}`);
    if (!response.ok) process.exitCode = 1;
    if (response.ok) {
      const completion = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        signal: AbortSignal.timeout(25_000),
        body: JSON.stringify({ model, response_format: { type: 'json_object' }, max_tokens: 700,
          messages: [{ role: 'system', content: 'Return only JSON with answer and source_ids.' }, { role: 'user', content: 'Use only this synthetic record: id=00000000-0000-4000-8000-000000000001, food=usual. Reply in Thai.' }] }),
      });
      let valid = false;
      if (completion.ok) {
        const payload = await completion.json();
        try { const answer = JSON.parse(payload?.choices?.[0]?.message?.content); valid = typeof answer.answer === 'string' && Array.isArray(answer.source_ids); } catch { /* no content is logged */ }
      }
      console.log(`AI provider completion check: HTTP ${completion.status}; valid_json=${valid}`);
      if (!completion.ok || !valid) process.exitCode = 1;
    }
  } catch (error) {
    console.error(`AI provider model check failed: ${error.name || 'Error'}`);
    process.exitCode = 1;
  }
}
