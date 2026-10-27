import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { before, after, test } from 'node:test';
import pg from 'pg';
const schema=`experience_${crypto.randomBytes(8).toString('hex')}`;
const admin=new pg.Client({connectionString:process.env.DATABASE_URL});
let handlers,pool,owner,member,outsider,house,pet;
before(async()=>{
  await admin.connect();await admin.query(`CREATE SCHEMA ${schema}`);
  const setup=new pg.Client({connectionString:process.env.DATABASE_URL,options:`-c search_path=${schema},public`});await setup.connect();
  try{for(const file of (await readdir(new URL('../db/migrations/',import.meta.url))).filter(n=>n.endsWith('.sql')).sort())await setup.query(await readFile(new URL(`../db/migrations/${file}`,import.meta.url),'utf8'));}finally{await setup.end();}
  process.env.PGOPTIONS=`-c search_path=${schema},public`;
  handlers=await import('../app/api/v1/[...path]/route.js');({pool}=await import('../lib/db.js'));
  async function register(name){const r=await call('POST','auth/register',null,{name,email:`${name}@example.com`,password:'testpassword123'});assert.equal(r.status,201);return r.body;}
  owner=await register('Owner');member=await register('Member');outsider=await register('Outsider');
  house=(await call('POST','households',owner.token,{name:'Experience Home'})).body.household;
  await call('POST','households/join',member.token,{invite_code:house.invite_code});
  pet=(await call('POST',`households/${house.id}/pets`,owner.token,{name:'Mochi',species:'dog'})).body.pet;
});
after(async()=>{if(pool)await pool.end();await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end();});
async function call(method,path,token,body){const r=await handlers[method](new Request(`http://localhost/api/v1/${path}`,{method,headers:token?{authorization:`Bearer ${token}`}:{},...(body===undefined?{}:{body:JSON.stringify(body)})}),{params:Promise.resolve({path:path.split('/')})});return {status:r.status,body:await r.json()};}
test('invite rotation revokes old code; expired and unauthorized invitations fail',async()=>{
  assert.equal((await call('POST',`households/${house.id}/rotate-invite`,member.token,{})).status,403);
  const r=await call('POST',`households/${house.id}/rotate-invite`,owner.token,{});assert.equal(r.status,200);assert.notEqual(r.body.invite_code,house.invite_code);
  assert.equal((await call('POST','households/join',outsider.token,{invite_code:house.invite_code})).status,404);
  await pool.query("UPDATE households SET invite_expires_at=NOW()-INTERVAL '1 minute' WHERE id=$1",[house.id]);
  assert.equal((await call('POST','households/join',outsider.token,{invite_code:r.body.invite_code})).status,404);
});
test('contact profile rejects unsafe image sources and cross-house access',async()=>{
  assert.equal((await call('POST',`pets/${pet.id}/contact-profile`,owner.token,{photo_url:'https://example.com/pixel.png'})).status,400);
  assert.equal((await call('POST',`pets/${pet.id}/contact-profile`,outsider.token,{emergency_contact:'x'})).status,403);
  assert.equal((await call('POST',`pets/${pet.id}/contact-profile`,member.token,{emergency_contact:'Call family',photo_url:null})).status,200);
});
test('only owner restores archived pets and child records require an active parent',async()=>{
  const entry=(await call('POST',`households/${house.id}/care-entries`,owner.token,{pet_id:pet.id,title:'Grooming',activity_type:'grooming',occurred_at:new Date().toISOString()})).body.entry;
  await call('POST',`care-entries/${entry.id}/archive`,owner.token,{});
  await call('POST',`pets/${pet.id}/archive`,owner.token,{});
  assert.equal((await call('GET',`households/${house.id}/archived-items`,member.token)).status,403);
  const r=await call('GET',`households/${house.id}/archived-items`,owner.token);assert.equal(r.status,200);assert.ok(r.body.items.some(i=>i.id===pet.id));
  assert.equal((await call('POST',`households/${house.id}/archived-items/restore`,outsider.token,{type:'pet',id:pet.id})).status,403);
  assert.equal((await call('POST',`households/${house.id}/archived-items/restore`,owner.token,{type:'care_entry',id:entry.id})).status,409);
  assert.equal((await call('POST',`households/${house.id}/archived-items/restore`,owner.token,{type:'pet',id:pet.id})).status,200);
  assert.equal((await call('POST',`households/${house.id}/archived-items/restore`,owner.token,{type:'care_entry',id:entry.id})).status,200);
});
test('calendar materialization validates the schedule and preserves assignment overrides',async()=>{
  const routine=(await call('POST',`pets/${pet.id}/routines`,owner.token,{title:'Calendar food',activity_type:'feeding',schedule:{type:'weekly',times:['23:59'],days:[0,1,2,3,4,5,6]}})).body.routine;
  const day=new Date(Date.now()+86400000).toISOString().slice(0,10);const scheduled_at=`${day}T23:59:00+07:00`;
  const path=`households/${house.id}/calendar/materialize`;
  assert.equal((await call('POST',path,outsider.token,{routine_id:routine.id,scheduled_at})).status,403);
  assert.equal((await call('POST',path,owner.token,{routine_id:routine.id,scheduled_at:`${day}T11:00:00+07:00`})).status,409);
  const materialized=await call('POST',path,owner.token,{routine_id:routine.id,scheduled_at});assert.equal(materialized.status,200);
  const again=await call('POST',path,owner.token,{routine_id:routine.id,scheduled_at});assert.equal(again.body.task.id,materialized.body.task.id);
  assert.equal((await call('PATCH',`tasks/${materialized.body.task.id}`,owner.token,{action:'reassign',expected_version:0,assigned_user_id:member.user.id})).status,200);
  const calendar=await handlers.GET(new Request(`http://localhost/api/v1/households/${house.id}/calendar?from=${day}&to=${day}`,{headers:{authorization:`Bearer ${owner.token}`}}),{params:Promise.resolve({path:['households',house.id,'calendar']})});
  assert.equal(calendar.status,200);const data=await calendar.json();assert.equal(data.events.find(e=>e.id===materialized.body.task.id).assigned_user_id,member.user.id);
});
test('ownership transfer updates permissions; removing member preserves records',async()=>{
  assert.equal((await call('POST',`households/${house.id}/transfer-owner`,owner.token,{user_id:member.user.id})).status,200);
  assert.equal((await call('POST',`households/${house.id}/rotate-invite`,owner.token,{})).status,403);
  assert.equal((await call('POST',`households/${house.id}/remove-member`,member.token,{user_id:owner.user.id})).status,200);
  assert.equal((await call('GET',`households/${house.id}`,owner.token)).status,403);
  assert.equal((await pool.query('SELECT COUNT(*)::int AS count FROM pets WHERE id=$1',[pet.id])).rows[0].count,1);
});
