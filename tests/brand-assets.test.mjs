import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { test } from 'node:test';

test('public brand artwork is present for the real landing and app shell', async () => {
  const logo = await readFile(new URL('../public/assets/brand/logo-horizontal.svg', import.meta.url), 'utf8');
  assert.match(logo, /<svg[\s>]/);
  assert.match(logo, /PawRoutine/);
  const hero = await stat(new URL('../public/assets/illustrations/hero-family.png', import.meta.url));
  assert.ok(hero.size > 10_000);
});
