import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {RetentionModel,functionSql} from './account-online-retention.model.mjs';
import {touch,expiredRowsSql} from './account-online-retention.queries.mjs';
const original=readFileSync('supabase/proposals/20261028_account_online.sql','utf8');
const path='supabase/proposals/20261029_account_online_retention.sql';
const proposal=existsSync(path)?readFileSync(path,'utf8'):'';
const db=()=>new RetentionModel(original+'\n'+proposal);
function seed(d,token,{valid=true,count=1,environment='local',closed=true}={}){
 d.sessions.set(token,{account:'synthetic-A',expires:d.now+(valid?86400000:-1)});
 for(let i=0;i<count;i++){const id=String(i).padStart(4,'0');d.rows.set(d.key(environment,token,id),{environment,token,id,closed,sequence:100,expires:d.now-1,updated:d.now-90000000});}
}
function perform(d,fn){const tx=d.begin();try{const out=fn(tx);tx.commit();return out;}catch(e){tx.rollback();throw e;}}
test('PG query contract: retained-marker replay uses the same web kind as its expired seed',()=>{
 // Exercise the actual runner's query emitters without pretending to execute PG.
 // A mismatched kind is rejected before closed, so this must agree before the
 // extension scenario is allowed to assert that its terminal marker survives.
 const seedKind=expiredRowsSql().match(/md5\('race'\|\|i\)::uuid,'([^']+)'/)[1];
 const replay=touch('e','00000001-1111-4111-8111-111111111111',999);
 const replayKind=replay.match(/,999,'([^']+)'/)[1];
 assert.equal(seedKind,'web');assert.equal(replayKind,'web');assert.equal(seedKind,replayKind);
 assert.match(replay,/'touch','local'\);$/);
});
test('synthetic policy: valid closed marker survives a 25-hour delayed heartbeat',()=>{
 const d=db();seed(d,'valid');assert.equal(perform(d,t=>t.touch('valid','0000',101)).status,'closed');
 assert.equal(d.rows.get('local:valid:0000').closed,true);
});
test('synthetic policy: highest sequence survives an expired lease on a valid session',()=>{
 const d=db();seed(d,'valid',{closed:false});assert.equal(perform(d,t=>t.touch('valid','0000',2)).status,'stale');assert.equal(d.rows.get('local:valid:0000').sequence,100);
});
test('synthetic policy: prune removes only expired-session connections in its environment',()=>{
 const d=db();seed(d,'valid',{count:2});seed(d,'expired',{valid:false,count:3});
 d.rows.set('preview:expired:0000',{...d.rows.get('local:expired:0000'),environment:'preview'});
 const sessions=structuredClone(d.sessions);assert.equal(perform(d,t=>t.prune('local')).deleted,3);
 assert.equal(d.rows.size,3);assert.deepEqual(d.sessions,sessions);assert.equal(perform(d,t=>t.touch('expired','0000',999)).status,'unauthorized');
});
test('synthetic policy: deletion is bounded and invalid parameters have no effects',()=>{
 const d=db();seed(d,'expired',{valid:false,count:300});
 for(const [env,n]of [['local',0],['local',257],['local',null],['unknown',1]])assert.deepEqual(perform(d,t=>t.prune(env,n)),{status:'invalid',deleted:0});
 assert.equal(d.rows.size,300);assert.equal(perform(d,t=>t.prune('local',128)).deleted,128);assert.equal(d.rows.size,172);assert.equal(perform(d,t=>t.prune('local',256)).deleted,172);
});
test('synthetic scheduler: two cleaners skip session locks and rollback preserves rows',()=>{
 const d=db();seed(d,'expired',{valid:false,count:3});const first=d.begin(),second=d.begin();
 assert.equal(first.prune('local',2).deleted,2);assert.equal(second.prune('local',2).deleted,0);second.commit();assert.equal(d.rows.size,3);first.rollback();assert.equal(d.rows.size,3);
 assert.equal(perform(d,t=>t.prune('local',2)).deleted,2);assert.equal(d.rows.size,1);
});
test('synthetic scheduler: an extension holding the session lock protects its markers',()=>{
 const d=db();seed(d,'expired',{valid:false});const renewal=d.begin();renewal.extend('expired',d.now+86400000);
 assert.equal(perform(d,t=>t.prune('local')).deleted,0);renewal.commit();assert.equal(perform(d,t=>t.prune('local')).deleted,0);assert.equal(perform(d,t=>t.touch('expired','0000',999)).status,'closed');
});
test('synthetic scheduler: cleanup holding session lock serializes revocation and rolls back on failure',()=>{
 const d=db();seed(d,'expired',{valid:false});const cleaner=d.begin(),logout=d.begin();cleaner.prune('local');assert.equal(logout.revoke('expired').status,'busy');cleaner.rollback();assert.equal(logout.revoke('expired').status,'revoked');logout.commit();assert.equal(d.rows.size,0);assert.equal(d.sessions.size,0);
});
test('synthetic transaction: a thrown deletion failure rolls back all provisional deletes',()=>{
 const d=db();seed(d,'expired',{valid:false,count:3});const before=structuredClone(d.rows);
 assert.throws(()=>perform(d,t=>{t.prune('local',2);throw Error('synthetic storage failure');}),/synthetic storage failure/);
 assert.deepEqual(d.rows,before);assert.equal(d.locks.size,0);assert.equal(perform(d,t=>t.prune('local',2)).deleted,2);
});
test('synthetic scheduler: a writer crossing expiry keeps its session lock until commit',()=>{
 const d=db();seed(d,'writer',{closed:false});d.sessions.get('writer').expires=d.now+1;
 const writer=d.begin();assert.equal(writer.touch('writer','0000',101).status,'recorded');d.now+=2;
 assert.equal(perform(d,t=>t.prune('local')).deleted,0);writer.commit();assert.equal(perform(d,t=>t.prune('local')).deleted,1);
 assert.equal(perform(d,t=>t.touch('writer','0000',102)).status,'unauthorized');
});
test('synthetic manual policy: ordinary heartbeats do no global cleanup and returned candidates cap at 32',()=>{
 const d=db();seed(d,'valid');for(let i=0;i<40;i++)seed(d,'expired'+i,{valid:false});
 assert.equal(perform(d,t=>t.touch('valid','0000',101)).status,'closed');assert.equal(d.rows.size,41);
 const r=perform(d,t=>t.prune('local',256));assert.equal(r.sessions,32);assert.equal(r.deleted,32);assert.equal(d.rows.size,9);
});
test('synthetic policy boundary: renewing an already pruned token cannot recover deleted markers',()=>{
 // Current product creates fresh tokens and has no renewal path. This captures
 // why adding expired-token renewal requires a new retention/auth decision.
 const d=db();seed(d,'expired',{valid:false});perform(d,t=>t.prune('local'));perform(d,t=>t.extend('expired',d.now+86400000));
 assert.equal(perform(d,t=>t.touch('expired','0000',101)).status,'recorded');
});
test('synthetic quota: 256 valid-session markers remain and a new connection is limited',()=>{
 const d=db();seed(d,'valid',{count:256});assert.equal(perform(d,t=>t.prune('local')).deleted,0);assert.equal(perform(d,t=>t.touch('valid','new',1)).status,'limit');assert.equal(d.rows.size,256);
});
test('SQL change guard: replacement touch differs only by removal of the old marker deletion',()=>{
 const before=functionSql(original,'sanctum_online_touch');
 const after=functionSql(proposal,'sanctum_online_touch');
 const normalize=s=>s.replace(/--[^\n]*/g,'').replace(/\s+/g,' ').trim();
 const removed=before.replace(/delete from public\.sanctum_online_connections c where c\.environment=input_environment and c\.token_hash=input_token_hash and c\.updated_at<t-interval '1 day';/,'');
 assert.ok(after,'retention proposal must replace touch');assert.equal(normalize(after),normalize(removed));
});
test('SQL safety structure: invoker maintenance enforces bounds, locks sessions first and changes only connections',()=>{
 const sql=functionSql(proposal,'sanctum_online_prune').replace(/--[^\n]*/g,'').replace(/\s+/g,' ');
 assert.match(sql,/security invoker set search_path=pg_catalog,public/);
 assert.match(sql,/input_batch is null or input_batch<1 or input_batch>256/);
 assert.match(sql,/input_environment is null or input_environment not in/);
 assert.match(sql,/s\.expires_at<=t and exists/);
 assert.match(sql,/limit 32 for update of s skip locked/);
 assert.match(sql,/if not found or valid_until>t then continue/);
 assert.match(sql,/limit \(input_batch-removed\) for update of c skip locked/);
 assert.match(sql,/where c\.environment=b\.environment and c\.token_hash=b\.token_hash and c\.connection_id=b\.connection_id/);
 assert.equal((sql.match(/delete from /g)||[]).length,1);
 assert.doesNotMatch(sql,/(?:delete from|update|insert into|truncate) public\.(?:sanctum_sessions|accounts|sanctum_account_activity)/);
 assert.ok(sql.indexOf('for update of s skip locked')<sql.indexOf('for update of c skip locked'));
 assert.match(proposal,/revoke all on function public\.sanctum_online_prune\(text,integer\) from public,anon,authenticated;/);
 assert.match(proposal,/grant execute on function public\.sanctum_online_prune\(text,integer\) to service_role;/);
});
