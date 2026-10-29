// Explicit isolated PostgreSQL integration; accepts no database URL or user data.
// --baseline proves the original 24-hour deletion can resurrect a closed connection.
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {createPgFixture,bootstrapPg} from './account-online.pg.mjs';
import {touch,expiredRowsSql} from './account-online-retention.queries.mjs';

const baseline=process.argv.includes('--baseline');
const A='11111111-1111-4111-8111-111111111111';
const token=c=>`repeat('${c}',64)`;
const service=q=>'set role service_role;'+q;
const logRoot=resolve('.superpowers/stabilize-20261029/retention');
mkdirSync(logRoot,{recursive:true});
const f=await createPgFixture(),results=[],sessions=[];
const json=q=>JSON.parse(f.sql(service(q)));
const prune=(n=128)=>`select public.sanctum_online_prune('local',${n});`;
function client(name){const s=f.session();sessions.push(s);return {s,init:()=>s.query(`set application_name='${name}';`)};}
async function locked(name){for(let i=0;i<20;i++)if(f.sql(`select count(*) from pg_stat_activity where application_name='${name}' and wait_event_type='Lock';`)==='1')return;throw Error('expected lock wait was not observed');}
function expiredRows(){f.sql(expiredRowsSql());}
async function check(name,run){
 const started=performance.now();
 try{await run();results.push({name,status:'PASS',ms:Math.round(performance.now()-started)});console.log('PASS',name);}
 catch(error){results.push({name,status:'FAIL',error:String(error)});throw error;}
}
try{
 bootstrapPg(f);
 if(!baseline)f.sql(readFileSync('supabase/proposals/20261029_account_online_retention.sql','utf8'));
 await check('a 25-hour closed marker on a valid session rejects delayed heartbeat',()=>{
  f.sql('delete from public.sanctum_online_connections;');
  const id=randomUUID();assert.equal(json(touch('a',id,10,'leave')).status,'closed');
  f.sql(`update public.sanctum_online_connections set updated_at=clock_timestamp()-interval '25 hours' where connection_id='${id}';`);
  assert.equal(json(touch('a',id,11)).status,'closed');
  assert.equal(f.sql(`select closed from public.sanctum_online_connections where connection_id='${id}';`),'t');
 });
 if(baseline)throw Error('baseline unexpectedly passed; missing reproduction');
 await check('a valid session preserves an old highest sequence even when its lease expired',()=>{
  const id=randomUUID();assert.equal(json(touch('a',id,100)).status,'recorded');
  f.sql(`update public.sanctum_online_connections set updated_at=clock_timestamp()-interval '25 hours',expires_at=clock_timestamp()-interval '1 hour' where connection_id='${id}';`);
  assert.equal(json(touch('a',id,2)).status,'stale');
  assert.equal(f.sql(`select sequence from public.sanctum_online_connections where connection_id='${id}';`),'100');
 });
 await check('actual SQL batch, invalid arguments, auth/activity preservation, environment, sequence, quota',()=>{
  f.sql(readFileSync('tests/fixtures/astra-online-retention.pg-cases.sql','utf8'));
 });
 await check('actual anon/authenticated maintenance execute denied',()=>{
  for(const role of ['anon','authenticated'])assert.throws(()=>f.sql(`set role ${role};${prune()}`),/permission denied/);
 });
 await check('two cleaners skip locked session; rollback and retry preserve exact bounded rows',async()=>{
  expiredRows();const x=client('retention_cleaner_first'),y=client('retention_cleaner_second');await x.init();await y.init();
  assert.equal(JSON.parse(await x.s.query('begin;set local role service_role;'+prune(2))).deleted,2);
  assert.equal(JSON.parse(await y.s.query(service(prune(2)))).deleted,0);
  assert.equal(f.sql('select count(*) from public.sanctum_online_connections;'),'3');
  await x.s.query('rollback;');assert.equal(json(prune(2)).deleted,2);assert.equal(f.sql('select count(*) from public.sanctum_online_connections;'),'1');
  x.s.close();y.s.close();
 });
 await check('session extension holding row lock is skipped; committed extension retains markers',async()=>{
  expiredRows();const x=client('retention_renewal');await x.init();
  await x.s.query(`begin;update public.sanctum_sessions set expires_at=clock_timestamp()+interval '1 day' where token_hash=${token('e')};`);
  assert.equal(json(prune()).deleted,0);await x.s.query('commit;');assert.equal(json(prune()).deleted,0);
  assert.equal(json(touch('e',f.sql('select connection_id from public.sanctum_online_connections limit 1;'),999)).status,'closed');x.s.close();
 });
 await check('session deletion waits for cleanup then cascades without deadlock',async()=>{
  expiredRows();const x=client('retention_delete_holder'),y=client('retention_delete_waiter');await x.init();await y.init();
  await x.s.query('begin;set local role service_role;'+prune(1));
  const pending=y.s.query(`begin;set local lock_timeout='3s';delete from public.sanctum_sessions where token_hash=${token('e')};commit;`);
  await locked('retention_delete_waiter');await x.s.query('commit;');await pending;
  assert.equal(f.sql('select count(*) from public.sanctum_online_connections;'),'0');x.s.close();y.s.close();
  f.sql(`insert into public.sanctum_sessions values(${token('e')},'${A}',clock_timestamp()-interval '1 minute');`);
 });
 await check('delete failure atomically preserves all markers and permits a later explicit retry',()=>{
  expiredRows();f.sql(`create function astra_fixture_guard.reject_prune() returns trigger language plpgsql as $$begin raise exception 'synthetic deletion failure';end;$$;
   create trigger retention_failure before delete on public.sanctum_online_connections for each row execute function astra_fixture_guard.reject_prune();`);
  assert.throws(()=>json(prune(2)),/synthetic deletion failure/);assert.equal(f.sql('select count(*) from public.sanctum_online_connections;'),'3');
  f.sql('drop trigger retention_failure on public.sanctum_online_connections;drop function astra_fixture_guard.reject_prune();');assert.equal(json(prune(2)).deleted,2);
 });
 await check('40 accounts/two connections EXPLAIN and storage evidence are captured without persistent deletion',()=>{
  f.sql(`delete from public.sanctum_online_connections;
   insert into public.accounts select md5('load-account'||i)::uuid,'합성정리부하'||i,'길드원','승인' from generate_series(1,40)i;
   insert into public.sanctum_sessions select md5('load-token'||i||':'||d)||md5('load-hash'||i||':'||d),md5('load-account'||i)::uuid,clock_timestamp()-interval '1 day' from generate_series(1,40)i cross join generate_series(1,2)d;
   insert into public.sanctum_online_connections select 'local',s.token_hash,md5(s.token_hash)::uuid,'iris',1,true,clock_timestamp(),clock_timestamp() from public.sanctum_sessions s join public.accounts a on a.id=s.account_id where a.nickname like '합성정리부하%';
   analyze public.sanctum_sessions;analyze public.sanctum_online_connections;`);
  const plan=JSON.parse(f.sql(`begin;set local statement_timeout='5s';set local role service_role;explain(analyze,buffers,format json) select public.sanctum_online_prune('local',64);rollback;`));
  const candidatePlan=JSON.parse(f.sql(`set role service_role;explain(analyze,buffers,format json) select s.token_hash from public.sanctum_sessions s where s.expires_at<=clock_timestamp() and exists(select 1 from public.sanctum_online_connections c where c.environment='local' and c.token_hash=s.token_hash) order by s.expires_at,s.token_hash limit 32 for update of s skip locked;`));
  const storage=JSON.parse(f.sql("select json_build_object('onlineBytes',pg_total_relation_size('public.sanctum_online_connections'),'sessionsBytes',pg_total_relation_size('public.sanctum_sessions'));"));
  assert.equal(f.sql('select count(*) from public.sanctum_online_connections;'),'80');
  writeFileSync(join(logRoot,'pg-plan.json'),JSON.stringify({plan,candidatePlan,storage},null,2));
 });
}finally{
 for(const s of sessions)s.close();
 try{f.stop();}finally{
  writeFileSync(join(logRoot,(baseline?'red':'green')+'-results.json'),JSON.stringify({baseline,owner:f.owner,container:f.container,results},null,2));
 }
}
