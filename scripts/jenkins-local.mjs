// Helper for the isolated Course Jenkins. Never logs its password or auth header.
import { readFile } from 'node:fs/promises';

const settings = await readFile('/workspace/jenkins-private.env', 'utf8');
const password = settings.split('\n').find(line => line.startsWith('JENKINS_ADMIN_PASSWORD='))?.split('=').slice(1).join('=').trim();
if (!password) throw new Error('Course Jenkins private configuration is missing');
const base = 'http://127.0.0.1:8080';
const authorization = `Basic ${Buffer.from(`delivery-admin:${password}`).toString('base64')}`;
const action = process.argv[2] || 'status';
if (action === 'build') {
  const response = await fetch(`${base}/crumbIssuer/api/json`, { headers: { authorization } });
  if (!response.ok) throw new Error(`Crumb request HTTP ${response.status}`);
  const crumb = await response.json();
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  const build = await fetch(`${base}/job/PawRoutine-delivery/build`, { method: 'POST', headers: { authorization, [crumb.crumbRequestField]: crumb.crumb, ...(cookie ? { cookie } : {}) } });
  if (!build.ok) throw new Error(`Build request HTTP ${build.status}`);
  console.log(JSON.stringify({ queued: true, location: build.headers.get('location') }));
} else if (action === 'status' || action === 'console') {
  const endpoint = action === 'console' ? '/job/PawRoutine-delivery/lastBuild/consoleText' : '/job/PawRoutine-delivery/api/json?tree=lastBuild[number,result,building,url]';
  const response = await fetch(base + endpoint, { headers: { authorization } });
  if (!response.ok) throw new Error(`Jenkins request HTTP ${response.status}`);
  console.log(await response.text());
} else throw new Error('Usage: node scripts/jenkins-local.mjs build|status|console');
