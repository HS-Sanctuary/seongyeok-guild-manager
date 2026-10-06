import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTS} from './load-ts.mjs';
import {memoryDB} from './memory-db.mjs';
import {NextRequest} from 'next/server.js';
const now=new Date('2026-10-04T10:00:00Z');
const catalog={tasks:[{id:1,name:'일간',type:'daily',is_active:true},{id:2,name:'반복',type:'repeat_weekly',max_count:3,is_active:true}],contents:[{id:11,name:'레이드',type:'raid',is_active:true}]};
const character={id:7,owner:'owner',nickname:'내캐릭',daily_checks:['기존'],weekly_checks:{normal:['구형'],repeat:{2:[true,false,false],999:[true]},extra:'보존'},raid_checks:[]};
const edit=(over={})=>({requestId:'11111111-1111-4111-8111-111111111111',generation:1,selectionVersion:1,accountId:'account',characterId:'7',category:'daily',taskId:'1',baseCompleted:0,desiredCompleted:1,periodKey:'2026-10-03T21:00:00.000Z',...over});
const pure=()=>loadTS('lib/irisKronosWrite.ts');
test('single edit preserves unrelated checks and weekly wrapper',()=>{
  const {computeIrisKronosEdit:compute}=pure();
  const r=compute(character,catalog,edit(),now);
  assert.deepEqual(r.nextRaw,['기존',1]);assert.deepEqual(character.daily_checks,['기존']);
  const repeat=compute(character,catalog,edit({category:'weekly',taskId:'2',baseCompleted:1,desiredCompleted:2,periodKey:'2026-09-27T21:00:00.000Z'}),now);
  assert.deepEqual(repeat.nextRaw,{normal:['구형'],repeat:{2:[true,true,false],999:[true]},extra:'보존'});
});
test('already desired is no-op; conflicts bounds hidden fields and old periods rejected',()=>{
  const {computeIrisKronosEdit:compute,getIrisPeriodKeys:keys}=pure();
  assert.equal(compute({...character,daily_checks:[1]},catalog,edit(),now).changed,false);
  for(const patch of [{desiredCompleted:2},{desiredCompleted:-1},{category:'other'},{taskId:'999'},{owner:'other'}]) assert.throws(()=>compute(character,catalog,edit(patch),now),e=>e.status===400);
  assert.throws(()=>compute(character,catalog,edit({periodKey:'old'}),now),e=>e.status===409);
  assert.throws(()=>compute({...character,weekly_checks:{repeat:{2:[true,true,true]}}},catalog,edit({category:'weekly',taskId:'2',baseCompleted:1,desiredCompleted:2,periodKey:keys(now).weekly}),now),e=>e.status===409);
  assert.deepEqual(keys(new Date('2026-10-04T20:59:59Z')),{daily:'2026-10-03T21:00:00.000Z',weekly:'2026-09-27T21:00:00.000Z',abyss:'2026-09-27T21:00:00.000Z',raid:'2026-09-27T21:00:00.000Z'});
  assert.equal(keys(new Date('2026-10-04T21:00:00Z')).weekly,'2026-10-04T21:00:00.000Z');
});
test('ambiguous repeat slots never silently clamped or reset',()=>{
  const {computeIrisKronosEdit:compute,getIrisPeriodKeys:keys}=pure();
  const raw={repeat:{9900:Array(14).fill(true)}};
  assert.throws(()=>compute({...character,weekly_checks:raw},catalog,edit({category:'weekly',taskId:'9900',baseCompleted:14,desiredCompleted:0,periodKey:keys(new Date('2026-10-04T22:00:00Z')).weekly}),new Date('2026-10-04T22:00:00Z')),e=>e.status===503);
  assert.equal(raw.repeat[9900].length,14);
});
test('shared legacy completion keys fail closed rather than clearing other content',()=>{
  const {computeIrisKronosEdit:compute,getIrisPeriodKeys:keys}=pure();
  const contents=[{id:11,name:'허상의 경계',type:'abyss',is_active:true},{id:12,name:'광기의 동굴',type:'abyss',is_active:true},{id:13,name:'흩어진 물길',type:'abyss',is_active:true}];
  const original={...character,raid_checks:['abyss_all','unrelated']};
  assert.throws(()=>compute(original,{...catalog,contents},edit({category:'abyss',taskId:'11',baseCompleted:1,desiredCompleted:0,periodKey:keys(now).abyss}),now),e=>e.status===409);
  assert.deepEqual(original.raid_checks,['abyss_all','unrelated']);
});
test('daily repeats use existing weekly wrapper; synthetic weekly facilities stay bounded',()=>{
  const {computeIrisKronosEdit:compute,getIrisPeriodKeys:keys}=pure();
  const c={...catalog,tasks:[...catalog.tasks,{id:3,name:'Daily repeat',type:'repeat_daily',max_count:2,is_active:true}]};
  const r=compute(character,c,edit({taskId:'3',desiredCompleted:2}),now);
  assert.equal(r.field,'weekly_checks');assert.deepEqual(r.nextRaw.repeat['3'],[true,true]);assert.deepEqual(r.nextRaw.repeat['2'],[true,false,false]);
  for(const [taskId,total] of [['9900',14],['9901',7],['9902',3]]){
    const next=compute(character,c,edit({category:'weekly',taskId,desiredCompleted:total,periodKey:keys(now).weekly}),now);
    assert.equal(next.nextRaw.repeat[taskId].filter(Boolean).length,total);
  }
});
function setup(account={id:'account',nickname:'owner',status:'승인'},initial=character){
  const db=memoryDB({characters:[initial],nexus_tasks:catalog.tasks,nexus_contents:catalog.contents,nexus_classes:[]});
  const route=loadTS('app/api/iris/kronos/route.ts',{'@/lib/server/sanctumSession':{getSessionAccount:async()=>account,isPendingAccount:a=>a.status==='승인대기',getServerSupabase:()=>db,SANCTUM_SESSION_COOKIE:'session'}});
  const post=(body,origin='http://localhost:3000')=>route.POST(new NextRequest('http://localhost:3000/api/iris/kronos',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)}));
  return {db,post};
}
test('authenticated POST changes only intended field; rejects bad owners origin and extra fields',async()=>{
  // Server uses current clock; period comes from real GET convention, not a stale fixture.
  const e=edit({periodKey:pure().getIrisPeriodKeys(new Date()).daily});
  const {post,db}=setup();const res=await post({edit:e});assert.equal(res.status,200);
  assert.deepEqual(db.writes[0].payload,{daily_checks:['기존',1]});
  assert.equal((await res.json()).result.status,'saved');
  for(const [account,row,body,origin,want] of [[null,character,{edit:e},undefined,401],[{id:'account',nickname:'other'},character,{edit:e},undefined,403],[{id:'account',nickname:'owner'}, {...character,owner:null},{edit:e},undefined,403],[undefined,character,{edit:e},'https://evil.test',403],[undefined,character,{edit:e,levels:{}},undefined,400],[undefined,character,{edit:{...e,accountId:'other'}},undefined,403]]){
    const s=setup(account,row);assert.equal((await s.post(body,origin)).status,want);assert.equal(s.db.writes.length,0);
  }
});
test('POST no-op avoids update and malformed oversized input rejected',async()=>{
  const e=edit({periodKey:pure().getIrisPeriodKeys(new Date()).daily});
  const s=setup(undefined,{...character,daily_checks:[1]});assert.equal((await s.post({edit:e})).status,200);assert.equal(s.db.writes.length,0);
  assert.equal((await s.post({edit:{...e,requestId:'x'}})).status,400);
  assert.equal((await s.post({edit:e,padding:'x'.repeat(65536)})).status,413);
});
test('server conditional update loses race without overwriting unrelated completion',async()=>{
  const {saveIrisKronosEdit}=loadTS('lib/server/irisKronosWrite.ts');
  const db=memoryDB({characters:[character],nexus_tasks:catalog.tasks,nexus_contents:catalog.contents});
  const from=db.from;db.from=table=>{const q=from(table);const update=q.update;q.update=p=>{db.tables.characters[0].daily_checks=['기존','別'];return update(p);};return q;};
  await assert.rejects(()=>saveIrisKronosEdit(db,{id:'account',nickname:'owner'},edit(),now),e=>e.status===409);
  assert.deepEqual(db.tables.characters[0].daily_checks,['기존','別']);assert.equal(db.writes.length,0);
});
test('JSONB legacy string CAS uses quoted JSON literal, not an object literal',async()=>{
  const {saveIrisKronosEdit}=loadTS('lib/server/irisKronosWrite.ts');
  const raw=JSON.stringify(['기존']);const db=memoryDB({characters:[{...character,daily_checks:raw}],nexus_tasks:catalog.tasks,nexus_contents:catalog.contents});
  const from=db.from;let supplied;
  db.from=table=>{const q=from(table),eq=q.eq;q.eq=(key,value)=>{if(key==='daily_checks'){supplied=value;assert.equal(value,JSON.stringify(raw));return eq(key,JSON.parse(value));}return eq(key,value);};return q;};
  await saveIrisKronosEdit(db,{id:'account',nickname:'owner'},edit(),now);
  assert.equal(supplied,JSON.stringify(raw));assert.deepEqual(db.tables.characters[0].daily_checks,['기존',1]);
});

test('desktop adapter saves original A while B is displayed, preserving B and enforcing owners',async()=>{
  const {createDesktopTransport}=loadTS('lib/irisDesktopTransport.ts');
  const db=memoryDB({characters:[character,{...character,id:8,nickname:'B',daily_checks:['B-preserve']},{...character,id:9,owner:'other'}],nexus_tasks:catalog.tasks,nexus_contents:catalog.contents,nexus_classes:[]});
  const from=db.from;db.from=table=>{const q=from(table);q.order=()=>q;return q;};
  const route=loadTS('app/api/iris/kronos/route.ts',{'@/lib/server/sanctumSession':{
    getSessionAccount:async()=>({id:'account',nickname:'owner'}),isPendingAccount:()=>false,getServerSupabase:()=>db,SANCTUM_SESSION_COOKIE:'session',
  }});
  const requests=[];
  const transport=createDesktopTransport({fetch:async(path,init)=>{
    requests.push([init.method,path]);const request=new NextRequest('http://localhost:3000'+path,{...init,headers:{...init.headers,origin:'http://localhost:3000'}});
    return init.method==='POST'?route.POST(request):route.GET(request);
  }});
  const latest=await transport.details('account','7');
  const pending={...edit({periodKey:latest.writeContext.periodKeys.daily}),environment:'development',revision:1,deadlineAt:15000,phase:'inflight'};
  const displayedCharacter='8';
  assert.deepEqual(await transport.save(pending),{kind:'saved',completed:1});
  assert.equal(displayedCharacter,'8');assert.deepEqual(db.tables.characters[0].daily_checks,['기존',1]);
  assert.deepEqual(db.tables.characters[1].daily_checks,['B-preserve']);
  assert.deepEqual(await transport.save({...pending,accountId:'other'}),{kind:'rejected'});
  assert.deepEqual(await transport.save({...pending,characterId:'9'}),{kind:'rejected'});
  assert.equal(db.writes.length,1);assert.equal(requests.filter(r=>r[0]==='GET').length,1);assert.equal(requests.filter(r=>r[0]==='POST').length,3);
});

test('daily and Monday weekly writes crossing KST06 fail without modifying old checks',()=>{
  const {computeIrisKronosEdit:compute}=pure();
  const cases=[
    ['2026-10-06T20:59:59.000Z','2026-10-06T21:00:00.000Z','daily','1','2026-10-05T21:00:00.000Z'],
    ['2026-10-04T20:59:59.000Z','2026-10-04T21:00:00.000Z','weekly','2','2026-09-27T21:00:00.000Z'],
  ];
  for(const [before,after,category,taskId,periodKey] of cases){
    const source=structuredClone(character),original=structuredClone(source);
    const e=edit({category,taskId,periodKey,baseCompleted:category==='weekly'?1:0,desiredCompleted:category==='weekly'?2:1});
    assert.equal(compute(source,catalog,e,new Date(before)).changed,true);
    assert.throws(()=>compute(source,catalog,e,new Date(after)),error=>error.status===409);
    assert.deepEqual(source,original);
  }
});
