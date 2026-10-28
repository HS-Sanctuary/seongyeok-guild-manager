// Explicit integration command: node tests/account-online.pg-run.mjs
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {createPgFixture,bootstrapPg} from './account-online.pg.mjs';
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222';
const token=c=>`repeat('${c}',64)`;
const touch=(c,id,seq=1,action='touch',owner=A,env='local')=>`select public.sanctum_online_touch(${token(c)},'${owner}','${id}',${seq},'web','${action}','${env}');`;
const snapshot=(c='a')=>`select public.sanctum_online_snapshot(${token(c)},'local');`;
const service=q=>'set role service_role; '+q;
const f=await createPgFixture(),results=[],sessions=[];
function check(name,run){const start=performance.now();return Promise.resolve().then(run).then(()=>{results.push({name,status:'PASS',ms:Math.round(performance.now()-start)});console.log('PASS',name);});}
const json=q=>JSON.parse(f.sql(service(q)));
const count=()=>Number(f.sql('select count(*) from public.sanctum_online_connections;'));
function client(name){const s=f.session();sessions.push(s);return {s,init:()=>s.query(`set application_name='${name}';`)};}
async function locked(name){for(let i=0;i<20;i++){if(f.sql(`select count(*) from pg_stat_activity where application_name='${name}' and wait_event_type='Lock';`)==='1')return;}throw Error('expected lock wait was not observed');}
try{
 await check('SQL bootstrap + original multi-device / terminal cases',()=>bootstrapPg(f));
 await check('actual anon/authenticated direct tables and RPC denied',()=>{
  for(const role of ['anon','authenticated'])for(const q of [
   'select * from public.sanctum_online_connections;',
   'delete from public.sanctum_online_connections;',
   snapshot(),touch('a',randomUUID()),
   `select * from public.sanctum_account_activity;`,
   `select public.sanctum_touch_account_activity(${token('a')},'${A}');`
  ])assert.throws(()=>f.sql(`set role ${role};${q}`),/permission denied/);
  assert.equal(f.sql("select count(*) from pg_class where oid in ('public.sanctum_online_connections'::regclass,'public.sanctum_account_activity'::regclass) and relrowsecurity;"),'2');
 });
 await check('wrong owner / missing / expired / pending leave no writes',()=>{
  const before=count();for(const [c,owner] of [['b',A],['d',A],['e',A],['f',A]])assert.ok(['conflict','unauthorized'].includes(json(touch(c,randomUUID(),1,'touch',owner)).status));assert.equal(count(),before);
 });
 await check('720 seconds DB clock and shorter session expiry',()=>{
  const id=randomUUID();assert.equal(json(touch('a',id)).status,'recorded');
  const seconds=Number(f.sql(`select extract(epoch from expires_at-updated_at) from public.sanctum_online_connections where connection_id='${id}';`));assert.equal(seconds,720);
  f.sql(`update public.sanctum_sessions set expires_at=clock_timestamp()+interval '90 seconds' where token_hash=${token('c')};`);
  const short=randomUUID();json(touch('c',short));assert.equal(f.sql(`select c.expires_at=s.expires_at from public.sanctum_online_connections c join public.sanctum_sessions s using(token_hash) where connection_id='${short}';`),'t');
  f.sql(`update public.sanctum_sessions set expires_at=clock_timestamp()-interval '1 second' where token_hash=${token('c')};`);assert.equal(json(snapshot()).accounts.length,1);
  f.sql(`update public.sanctum_online_connections set expires_at=clock_timestamp()-interval '1 second' where connection_id='${id}';`);assert.equal(json(snapshot()).accounts.length,0);
  f.sql(`update public.sanctum_sessions set expires_at=clock_timestamp()+interval '1 day' where token_hash=${token('c')};delete from public.sanctum_online_connections;`);
 });
 await check('activity 20min throttle / two sessions / online heartbeat independent',()=>{
  const activity=c=>`select public.sanctum_touch_account_activity(${token(c)},'${A}');`;
  assert.equal(json(activity('a')).status,'recorded');const before=f.sql('select last_active_at from public.sanctum_account_activity;');
  assert.equal(json(activity('c')).status,'throttled');json(touch('a',randomUUID()));assert.equal(f.sql('select last_active_at from public.sanctum_account_activity;'),before);
  f.sql("update public.sanctum_account_activity set last_active_at=clock_timestamp()-interval '21 minutes';");assert.equal(json(activity('c')).status,'recorded');f.sql('delete from public.sanctum_online_connections;');
 });
 await check('parallel activity across devices records one timestamp',async()=>{
  f.sql('delete from public.sanctum_account_activity;');const x=client('activity_a'),y=client('activity_c');await x.init();await y.init();
  const first=await x.s.query('begin;set local role service_role;'+`select public.sanctum_touch_account_activity(${token('a')},'${A}');`);
  const pending=y.s.query(service(`select public.sanctum_touch_account_activity(${token('c')},'${A}');`));await locked('activity_c');await x.s.query('commit;');const replies=[first,await pending];
  assert.deepEqual(replies.map(r=>JSON.parse(r).status).sort(),['recorded','throttled']);assert.equal(f.sql('select count(*) from public.sanctum_account_activity;'),'1');x.s.close();y.s.close();
 });
 for(const first of ['touch','leave'])await check(`two SQL connections serialize ${first} then ${first==='touch'?'leave':'late touch'}`,async()=>{
  const id=randomUUID(),name='concurrent_'+first,x=client(name+'_first'),y=client(name+'_wait');await x.init();await y.init();
  await x.s.query('begin;set local role service_role;'+touch('a',id,1,first));
  const waiting=y.s.query('begin;set local role service_role;'+touch('a',id,2,first==='touch'?'leave':'touch')+'commit;');
  await locked(name+'_wait');await x.s.query('commit;');const result=JSON.parse(await waiting);assert.equal(result.status,'closed');
  assert.equal(f.sql(`select closed from public.sanctum_online_connections where connection_id='${id}';`),'t');x.s.close();y.s.close();
 });
 await check('transaction rollback never publishes provisional online',async()=>{
  const id=randomUUID(),x=client('rollback');await x.init();await x.s.query('begin;set local role service_role;'+touch('a',id));assert.equal(f.sql(`select count(*) from public.sanctum_online_connections where connection_id='${id}';`),'0');await x.s.query('rollback;');assert.equal(f.sql(`select count(*) from public.sanctum_online_connections where connection_id='${id}';`),'0');x.s.close();
 });
 await check('account lock timeout is bounded and writes zero',async()=>{
  const id=randomUUID(),x=client('timeout_holder'),y=client('timeout_waiter');await x.init();await y.init();await x.s.query(`begin;select id from public.accounts where id='${A}' for update;`);
  const waiting=y.s.query(service(touch('a',id)));const rejected=assert.rejects(waiting,/lock timeout/);await locked('timeout_waiter');await rejected;await x.s.query('rollback;');assert.equal(f.sql(`select count(*) from public.sanctum_online_connections where connection_id='${id}';`),'0');x.s.close();y.s.close();
 });
 await check('revoke during account-lock wait denies stale discovery',async()=>{
  const id=randomUUID(),x=client('revoke_holder'),y=client('revoke_waiter');await x.init();await y.init();await x.s.query(`begin;select id from public.accounts where id='${A}' for update;`);
  const waiting=y.s.query(service(touch('c',id)));await locked('revoke_waiter');await x.s.query(`delete from public.sanctum_sessions where token_hash=${token('c')};commit;`);assert.equal(JSON.parse(await waiting).status,'unauthorized');
  assert.equal(f.sql(`select count(*) from public.sanctum_online_connections where connection_id='${id}';`),'0');x.s.close();y.s.close();f.sql(`insert into public.sanctum_sessions values(${token('c')},'${A}',clock_timestamp()+interval '1 day');`);
 });
 await check('session owner switch during discovery never transfers write',async()=>{
  const id=randomUUID(),x=client('owner_holder'),y=client('owner_waiter');await x.init();await y.init();await x.s.query(`begin;select id from public.accounts where id='${A}' for update;`);
  const waiting=y.s.query(service(touch('c',id)));await locked('owner_waiter');await x.s.query(`update public.sanctum_sessions set account_id='${B}' where token_hash=${token('c')};commit;`);assert.equal(JSON.parse(await waiting).status,'unauthorized');x.s.close();y.s.close();f.sql(`update public.sanctum_sessions set account_id='${A}' where token_hash=${token('c')};`);
 });
 await check('snapshot and simultaneous commits stay within authoritative TTL',async()=>{
  f.sql('delete from public.sanctum_online_connections;');const id=randomUUID(),x=client('snapshot_touch'),y=client('snapshot_read');await x.init();await y.init();
  for(let i=1;i<=12;i++){const [,raw]=await Promise.all([x.s.query(service(touch('a',id,i))),y.s.query(service(snapshot()))]);const s=JSON.parse(raw);const at=Date.parse(s.observedAt);for(const row of s.accounts){const until=Date.parse(row.expiresAt);assert.ok(until>at&&until-at<=720000);}}
  x.s.close();y.s.close();
 });
 await check('active8 / total256 admission + own 24h cleanup',()=>{
  f.sql('delete from public.sanctum_online_connections;');for(let i=0;i<8;i++)assert.equal(json(touch('a',randomUUID())).status,'recorded');assert.equal(json(touch('a',randomUUID())).status,'limit');
  f.sql('delete from public.sanctum_online_connections;');
  f.sql(`insert into public.sanctum_online_connections select 'local',${token('a')},md5(i::text)::uuid,'web',1,true,clock_timestamp(),clock_timestamp() from generate_series(1,256) i;`);
  assert.equal(json(touch('a',randomUUID())).status,'limit');f.sql("update public.sanctum_online_connections set updated_at=clock_timestamp()-interval '25 hours';");assert.equal(json(touch('a',randomUUID())).status,'recorded');assert.equal(count(),1);
 });
 await check('parallel admission never exceeds eight active connections',async()=>{
  f.sql(`delete from public.sanctum_online_connections;insert into public.sanctum_online_connections select 'local',${token('a')},md5(i::text)::uuid,'web',1,false,clock_timestamp()+interval '12 minutes',clock_timestamp() from generate_series(1,7) i;`);
  const x=client('limit_a'),y=client('limit_b');await x.init();await y.init();
  const first=await x.s.query('begin;set local role service_role;'+touch('a',randomUUID()));const pending=y.s.query(service(touch('a',randomUUID())));await locked('limit_b');await x.s.query('commit;');const replies=[first,await pending];assert.deepEqual(replies.map(r=>JSON.parse(r).status).sort(),['limit','recorded']);assert.equal(count(),8);x.s.close();y.s.close();
 });
 await check('account cascade waits for writer then completes without deadlock',async()=>{
  const id='44444444-4444-4444-8444-444444444444';f.sql(`insert into public.accounts values('${id}','합성삭제','길드원','승인');insert into public.sanctum_sessions values(${token('9')},'${id}',clock_timestamp()+interval '1 day');`);
  const x=client('delete_writer'),y=client('delete_waiter');await x.init();await y.init();await x.s.query('begin;set local role service_role;'+touch('9',randomUUID(),1,'touch',id));
  const deletion=y.s.query(`begin;set local lock_timeout='3s';delete from public.accounts where id='${id}';commit;`);await locked('delete_waiter');await x.s.query('commit;');await deletion;assert.equal(f.sql(`select count(*) from public.sanctum_online_connections where token_hash=${token('9')};`),'0');x.s.close();y.s.close();
 });
 await check('session/account FK cascade + independent activity retention',()=>{
  const id=randomUUID();json(touch('b',id,1,'touch',B));f.sql(`delete from public.sanctum_sessions where token_hash=${token('b')};`);assert.equal(f.sql(`select count(*) from public.sanctum_online_connections where connection_id='${id}';`),'0');assert.equal(f.sql(`select count(*) from public.sanctum_account_activity where account_id='${A}';`),'1');
  f.sql(`delete from public.accounts where id='${A}';`);assert.equal(count(),0);assert.equal(f.sql('select count(*) from public.sanctum_account_activity;'),'0');
 });
 const storage=JSON.parse(f.sql("select json_build_object('onlineBytes',pg_total_relation_size('public.sanctum_online_connections'),'activityBytes',pg_total_relation_size('public.sanctum_account_activity'),'indexes',(select json_agg(indexname) from pg_indexes where tablename='sanctum_online_connections'));"));
 f.sql(`insert into public.accounts select md5('account'||i)::uuid,'합성부하'||i,'길드원','승인' from generate_series(1,40) i;
 insert into public.sanctum_sessions select md5('session'||i||':'||d)||md5('hash'||i||':'||d),md5('account'||i)::uuid,clock_timestamp()+interval '1 day' from generate_series(1,40) i cross join generate_series(1,2) d;
 insert into public.sanctum_online_connections select 'local',token_hash,md5(token_hash)::uuid,'iris',1,false,clock_timestamp()+interval '12 minutes',clock_timestamp() from public.sanctum_sessions where account_id in(select md5('account'||i)::uuid from generate_series(1,40) i);
 analyze public.sanctum_online_connections;`);
 const viewer=f.sql("select token_hash from public.sanctum_sessions where account_id=md5('account1')::uuid limit 1;");
 const plan=JSON.parse(f.sql(`set role service_role;explain(analyze,buffers,format json) select public.sanctum_online_snapshot('${viewer}','local');`));
 storage.activeFixtureRows=count();storage.activeFixtureAccounts=JSON.parse(f.sql(`set role service_role;select public.sanctum_online_snapshot('${viewer}','local');`)).accounts.length;storage.activeFixtureBytes=Number(f.sql("select pg_total_relation_size('public.sanctum_online_connections');"));storage.snapshotExecutionMs=plan[0]['Execution Time'];storage.planScope='one local 40-account/80-connection fixture sample, not Vercel CPU or production load';
 const report={status:'PASS',version:f.sql('show server_version;'),groups:results,storage,operationalDatabaseCalls:0,gui:'NOT_RUN',globalExpiredSessionCleanup:'NOT_IMPLEMENTED; activation requires retention decision'};
 writeFileSync(join(f.root,'result.json'),JSON.stringify(report,null,2));writeFileSync('.superpowers/astra-online-night/pg-result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}catch(e){writeFileSync(join(f.root,'failure.txt'),String(e.stack));console.error(e);process.exitCode=1;}
finally{for(const s of sessions)s.close();f.stop();}
