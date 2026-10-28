import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

test('public brand artwork is present for the real landing and app shell', async () => {
  const logo = await readFile(new URL('../components/BrandLogo.jsx', import.meta.url), 'utf8');
  assert.match(logo, /<svg[\s>]/);
  assert.match(logo, /PetRoutine/);
  for (const species of ['cat', 'dog']) {
    const avatar = await readFile(new URL(`../public/assets/brand/pet-avatar-${species}.svg`, import.meta.url), 'utf8');
    assert.match(avatar, /<svg[\s>]/);
  }
});
