import { readFile, readdir } from 'node:fs/promises';

// Runtime and full-schema tests share the same ordered migration set.
// Migration-specific tests can still construct an older schema explicitly.
export async function applyMigrations(client) {
  const directory = new URL('./migrations/', import.meta.url);
  const files = (await readdir(directory)).filter(name => /^\d{3}_[a-z0-9_]+\.sql$/.test(name)).sort();
  if (!files.length) throw new Error('No database migrations found');
  for (const filename of files) await client.query(await readFile(new URL(filename, directory), 'utf8'));
}
