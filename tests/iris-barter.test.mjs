import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {NextRequest} from 'next/server.js';
import {loadTS} from './load-ts.mjs';
import {memoryDB} from './memory-db.mjs';
const load=path=>{assert.ok(existsSync(path),'Missing approved barter implementation');return loadTS(path);};
const model=()=>load('lib/irisBarter.ts');
const now=new Date('2026-10-08T22:00:00Z'),period='2026-10-04T21:00:00.000Z';
const digest=value=>createHash('sha256').update(value).digest('hex');
const trades=[{id:1,map:'티르코네일',npc:'데이안',reward:'우유',reward_cnt:2,cost:'양털',cost_cnt:5,limit:3,reset_type:'주간',scope:'계정당'},
  {id:2,map:'던바튼',npc:'발터',reward:'종이',reward_cnt:1,cost:'나무',cost_cnt:2,limit:2,reset_type:'일간',scope:'캐릭당'}];
const record=(count,buyer='가나')=>({count,completed_by:count?buyer:null,period_version:2,period_start:1791147600000});
const chars=()=>[{id:'A',owner:'owner',nickname:'가나',trade_checks:{1:record(3),2:{count:9},legacy:{keep:true}},daily_checks:['보존']},
  {id:'B',owner:'owner',nickname:'다라',trade_checks:{1:record(3),hidden:7},weekly_checks:['보존']}];
const details=(rows=chars(),catalog=trades,clock=now)=>model().buildBarterDetails(rows,catalog,'A',clock,digest);
const edit=(patch={})=>{const d=details();return {requestId:'11111111-1111-4111-8111-111111111111',accountId:'account',characterId:'A',tradeId:'1',scope:'account',periodKey:period,catalogKey:d.contexts[0].catalogKey,baseRecords:d.contexts[0].baseRecords,baseCompleted:3,desiredCompleted:0,...patch};};
test('barter reads shared current values without promoting expired or legacy records',()=>{
  const d=details();assert.equal(d.rows[0].completed,3);assert.equal(d.rows[0].completedBy,'가나');assert.equal(d.rows[0].consistent,true);
  assert.equal(d.rows[1].completed,0);assert.equal(d.rows[1].periodKey,'2026-10-08T21:00:00.000Z');
  const mixed=chars();mixed[1].trade_checks[1]=record(2,'다라');assert.equal(details(mixed).rows[0].consistent,false);
  assert.equal(details(mixed).contexts[0].baseRecords.length,2);
});
test('barter validation bounds forged metadata and detects catalog or period changes',()=>{
  const {validateBarterEdit:validate,planBarterEdit:plan}=model();
  for(const patch of [{owner:'other'},{desiredCompleted:'1'},{desiredCompleted:-1},{baseCompleted:1001},{scope:'unknown'},{requestId:'x'},{baseRecords:[]}])assert.throws(()=>validate(edit(patch)),e=>e.status===400);
  assert.throws(()=>plan(chars(),trades,edit({periodKey:'2026-09-27T21:00:00.000Z'}),now,digest),e=>e.status===409);
  assert.throws(()=>plan(chars(),[{...trades[0],scope:'캐릭당'},trades[1]],edit(),now,digest),e=>e.status===409);
  assert.throws(()=>plan(chars(),trades,edit({desiredCompleted:4}),now,digest),e=>e.status===400);
});
test('barter plan copies decreases to every owner while preserving unrelated JSON',()=>{
  const original=chars(),plan=model().planBarterEdit(original,trades,edit(),now,digest);
  assert.equal(plan.changes.length,2);assert.deepEqual(plan.changes[0].nextRaw,{1:record(0),2:{count:9},legacy:{keep:true}});
  assert.deepEqual(plan.changes[1].nextRaw,{1:record(0),hidden:7});assert.equal(original[0].trade_checks[1].count,3);
});
test('validated partial intent may retry but a newer same-count record cannot be overwritten',()=>{
  const mixed=chars();mixed[0].trade_checks[1]=record(0);
  assert.equal(model().planBarterEdit(mixed,trades,edit(),now,digest).changes.length,1);
  mixed[1].trade_checks[1]=record(3,'다라');assert.throws(()=>model().planBarterEdit(mixed,trades,edit(),now,digest),e=>e.status===409);
  const added=[...chars(),{id:'C',owner:'owner',nickname:'마바',trade_checks:{}}];assert.throws(()=>model().planBarterEdit(added,trades,edit(),now,digest),e=>e.status===409);
});
function setup(account={id:'account',nickname:'owner',status:'승인'},rows=chars()){
  const db=memoryDB({characters:rows,nexus_trades:trades,nexus_tasks:[],nexus_contents:[],nexus_classes:[]});
  assert.ok(existsSync('app/api/iris/barter/route.ts'),'Missing authenticated barter API');
  const injected=loadTS('app/api/iris/barter/route.ts',{'@/lib/server/sanctumSession':{getSessionAccount:async()=>account,isPendingAccount:a=>a.status==='승인대기',getServerSupabase:()=>db,SANCTUM_SESSION_COOKIE:'session'}});
  const post=(body,origin='http://localhost:3000')=>injected.POST(new NextRequest('http://localhost:3000/api/iris/barter',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)}));
  return {db,post};
}
test('authenticated barter save checks all owners and only updates trade JSON',async()=>{
  const {saveIrisBarterEdit:save}=load('lib/server/irisBarterWrite.ts'),db=memoryDB({characters:chars(),nexus_trades:trades});
  const result=await save(db,{id:'account',nickname:'owner'},edit(),now);
  assert.equal(result.status,'saved');assert.equal(db.writes.length,2);assert.deepEqual(Object.keys(db.writes[0].payload),['trade_checks']);
  assert.deepEqual(db.tables.characters[0].daily_checks,['보존']);assert.equal(db.tables.characters[1].trade_checks[1].count,0);
  assert.equal((await save(db,{id:'account',nickname:'owner'},edit(),now)).status,'saved');assert.equal(db.writes.length,2);
});
test('prevalidation prevents any write when one target is newer or malformed',async()=>{
  const {saveIrisBarterEdit:save}=load('lib/server/irisBarterWrite.ts');
  for(const changed of [record(2,'다라'),'malformed']){
    const rows=chars();rows[1].trade_checks[1]=changed;const db=memoryDB({characters:rows,nexus_trades:trades});
    await assert.rejects(()=>save(db,{id:'account',nickname:'owner'},edit(),now),e=>e.status===409||e.status===503);assert.equal(db.writes.length,0);
  }
});
test('CAS partial failure is unknown and never saved from an equal shared MAX',async()=>{
  const {saveIrisBarterEdit:save}=load('lib/server/irisBarterWrite.ts');
  const db=memoryDB({characters:chars(),nexus_trades:trades}),from=db.from;let updates=0;
  db.from=table=>{const q=from(table),update=q.update;q.update=value=>{if(++updates===2)db.tables.characters[1].trade_checks.hidden=8;return update(value);};return q;};
  const result=await save(db,{id:'account',nickname:'owner'},edit(),now);assert.equal(result.status,'unknown');assert.equal(db.writes.length,1);
  assert.equal(db.tables.characters[0].trade_checks[1].count,0);assert.equal(db.tables.characters[1].trade_checks[1].count,3);
  assert.equal((await save(db,{id:'account',nickname:'owner'},edit(),now)).status,'saved');assert.equal(db.tables.characters[1].trade_checks.hidden,8);
});
test('readback refuses saved when a later concurrent sibling intent differs',async()=>{
  const {saveIrisBarterEdit:save}=load('lib/server/irisBarterWrite.ts');const db=memoryDB({characters:chars(),nexus_trades:trades}),from=db.from;let reads=0;
  db.from=table=>{if(table==='characters'&&++reads===4)db.tables.characters[0].trade_checks[1]=record(1);return from(table);};
  const result=await save(db,{id:'account',nickname:'owner'},edit(),now);assert.equal(result.status,'unknown');
});
test('barter POST rejects sessions origins extra fields and oversized bodies',async()=>{
  const e=edit({periodKey:new Date(model().barterPeriodStart('주간',new Date())).toISOString()});
  for(const [account,patch,origin,want] of [[null,{},undefined,401],[{id:'account',nickname:'other'}, {},undefined,403],[undefined,{accountId:'other'},undefined,403],[undefined,{},'https://evil.test',403],[undefined,{owner:'other'},undefined,400]]){
    const s=setup(account);assert.equal((await s.post({edit:{...e,...patch}},origin)).status,want);assert.equal(s.db.writes.length,0);
  }
  const s=setup();assert.equal((await s.post({edit:e,padding:'x'.repeat(65536)})).status,413);
});
test('owned kronos GET adds barter while preserving older missing catalog homework',async()=>{
  const db=memoryDB({characters:chars(),nexus_trades:trades,nexus_tasks:[],nexus_contents:[],nexus_classes:[]});
  const deps={'@/lib/server/sanctumSession':{getSessionAccount:async()=>({id:'account',nickname:'owner'}),isPendingAccount:()=>false,getServerSupabase:()=>db,SANCTUM_SESSION_COOKIE:'session'}};
  // memoryDB omits ordering because its other contracts do not need it.
  const from=db.from;db.from=table=>{const query=from(table);query.order=()=>query;return query;};
  const route=loadTS('app/api/iris/kronos/route.ts',deps),response=await route.GET(new NextRequest('http://localhost:3000/api/iris/kronos?characterId=A'));
  const body=await response.json();assert.equal(response.status,200);assert.equal(body.details.barter.length,2);assert.equal(body.writeContext.barter[0].baseRecords.length,2);
  delete db.tables.nexus_trades;
  const older=await route.GET(new NextRequest('http://localhost:3000/api/iris/kronos?characterId=A'));assert.equal(older.status,200);assert.equal((await older.json()).details.barter,undefined);
});
test('catalog changed during multirow CAS never yields a saved acknowledgement',async()=>{
  const {saveIrisBarterEdit:save}=load('lib/server/irisBarterWrite.ts');const db=memoryDB({characters:chars(),nexus_trades:trades}),from=db.from;
  let updates=0;db.from=table=>{const query=from(table),update=query.update;query.update=value=>{if(++updates===2)db.tables.nexus_trades[0].limit=4;return update(value);};return query;};
  assert.equal((await save(db,{id:'account',nickname:'owner'},edit(),now)).status,'unknown');
});
test('reset crossed before sending a CAS stops writes rather than stamping the old period',async()=>{
  const {saveIrisBarterEdit:save}=load('lib/server/irisBarterWrite.ts');const db=memoryDB({characters:chars(),nexus_trades:trades});let ticks=0;
  await assert.rejects(()=>save(db,{id:'account',nickname:'owner'},edit(),()=>new Date(++ticks===1?'2026-10-11T20:59:59Z':'2026-10-11T21:00:00Z')),e=>e.status===409);
  assert.equal(db.writes.length,0);
});
