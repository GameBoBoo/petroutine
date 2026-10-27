import { spawn } from 'node:child_process';
import { mkdir, writeFile, copyFile } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';

await mkdir('artifacts', { recursive: true });
const report = { started_at: new Date().toISOString(), revision: process.env.DELIVERY_REVISION || 'working-tree', node: process.version, checks: [] };
for (const name of ['audit:production', 'test', 'build', 'test:e2e']) {
  const started = Date.now();
  const logfile = `artifacts/${name.replaceAll(':', '-')}.log`;
  const log = createWriteStream(logfile);
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', name], { env: process.env, shell: process.platform === 'win32' });
    for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { process.stdout.write(chunk); log.write(chunk); });
    child.on('error', reject);
    child.on('close', resolve);
  });
  await new Promise(resolve => log.end(resolve));
  report.checks.push({ name, exit_code: code, duration_ms: Date.now() - started, log: logfile });
  report.finished_at = new Date().toISOString();
  await writeFile('artifacts/verification.json', JSON.stringify(report, null, 2) + '\n');
  if (code !== 0) { process.exitCode = 1; break; }
}
try { await copyFile('test-results/.last-run.json', 'artifacts/playwright-last-run.json'); } catch {}
