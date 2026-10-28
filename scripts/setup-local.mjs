import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

// Resolve against the script so running from another directory is safe.
const target = new URL('../.env', import.meta.url);
const example = await readFile(new URL('../.env.example', import.meta.url), 'utf8');
if (!/^JWT_SECRET=.*$/m.test(example)) throw new Error('.env.example is missing JWT_SECRET');
try {
  await writeFile(target, example.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${randomBytes(32).toString('hex')}`), { flag: 'wx', mode: 0o600 });
  console.log('Created .env with a random JWT secret. AI is disabled. No secrets were printed.');
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log('.env already exists; kept existing configuration unchanged.');
}
