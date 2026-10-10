import 'dotenv/config';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const schema = `e2e_${crypto.randomBytes(8).toString('hex')}`;
const admin = new pg.Client({ connectionString: process.env.DATABASE_URL });
await admin.connect();
await admin.query(`CREATE SCHEMA ${schema}`);
const setup = new pg.Client({ connectionString: process.env.DATABASE_URL, options: `-c search_path=${schema},public` });
await setup.connect();
try {
  for (const filename of ['001_initial.sql', '002_phase4.sql', '003_ci_calendar_settings.sql', '004_product_refinement.sql', '005_household_trash.sql']) {
    await setup.query(await readFile(new URL(`../db/migrations/${filename}`, import.meta.url), 'utf8'));
  }
} finally { await setup.end(); }

let exitCode = 1;
let server;
try {
  const nextCli = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url));
  server = spawn(process.execPath, [nextCli, 'dev', '-p', '3105'], {
    cwd: process.cwd(), stdio: 'inherit',
    env: { ...process.env, PGOPTIONS: `-c search_path=${schema},public` },
  });
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (server.exitCode != null) throw new Error(`Next.js test server stopped with code ${server.exitCode}`);
    try {
      const response = await fetch('http://127.0.0.1:3105/api/v1/health');
      if (response.ok) break;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  if (Date.now() >= deadline) throw new Error('Timed out waiting for the Next.js test server');
  exitCode = await new Promise((resolve, reject) => {
    const cli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url));
    const child = spawn(process.execPath, [cli, 'test'], {
      cwd: process.cwd(), stdio: 'inherit',
      env: { ...process.env, PGOPTIONS: `-c search_path=${schema},public`, PLAYWRIGHT_BASE_URL: 'http://127.0.0.1:3105', PLAYWRIGHT_MANAGED_SERVER: '1' },
    });
    child.on('error', reject);
    child.on('exit', code => resolve(code ?? 1));
  });
} finally {
  if (server?.pid) {
    server.kill('SIGTERM');
    await Promise.race([
      new Promise(resolve => server.once('exit', resolve)),
      new Promise(resolve => setTimeout(resolve, 3_000)),
    ]);
  }
  await admin.query(`DROP SCHEMA ${schema} CASCADE`);
  await admin.end();
}
process.exitCode = exitCode;
