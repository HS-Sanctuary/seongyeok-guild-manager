import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {loadTS} from './load-ts.mjs';
import {memoryDB} from './memory-db.mjs';
const load=p=>{assert.ok(existsSync(p),'workspace implementation missing');return loadTS(p);};
const now=new Date('2026-10-09T22:00:00Z'),period='2026-10-04T21:00:00.000Z';
const hash=v=>createHash('sha256').update(v).digest('hex');
const shops=[{id:1,map:'티르코네일',npc:'앨빈',reward:'사포',reward_cnt:1,cost_cnt:100,limit:9999,reset_type:'주간',scope:'계정당',is_active:true}];
const missions=[{id:2,town:'던바튼',title:'생활 지원',description:'긴 설명',max_count:3,rewards:[{name:'주화',count:10}],is_active:true}];
const progress=()=>[{account_id:'account',target_key:'',character_name:null,kind:'shop',item_id:1,period_start:period,count:2,bookmarked:true},{account_id:'account',target_key:'가나',character_name:'가나',kind:'mission',item_id:2,period_start:'2026-09-27T21:00:00Z',count:3,bookmarked:true}];
const details=(rows=progress())=>load('lib/irisWorkspace.ts').buildWorkspaceDetails(shops,missions,rows,'가나',now,hash);
const edit=(patch={})=>({requestId:'11111111-1111-4111-8111-111111111111',accountId:'account',characterId:'A',...details()[0].key,field:'count',baseCompleted:2,desiredCompleted:1,...patch});
test('workspace shows shared shop and resets mission count without clearing bookmarks',()=>{
  const rows=details();assert.equal(rows[0].scope,'account');assert.equal(rows[0].completed,2);assert.equal(rows[0].total,9999);
  assert.equal(rows[1].completed,0);assert.equal(rows[1].bookmarked,true);assert.equal(rows[1].resetType,'주간');
});
test('workspace validates absolute edits, fields and catalog fingerprint',()=>{
  const {validateWorkspaceEdit:validate}=load('lib/irisWorkspace.ts');
  assert.equal(validate(edit({desiredCompleted:9999})).desiredCompleted,9999);
  for(const patch of [{desiredCompleted:10000},{desiredCompleted:-1},{field:'bookmark',desiredCompleted:2},{itemKind:'raid'},{itemId:'1x'},{catalogKey:'x'},{owner:'other'}])assert.throws(()=>validate(edit(patch)),e=>e.status===400);
});
test('workspace rejects malformed or duplicate progress rather than silently replacing it',()=>{
  assert.throws(()=>details([...progress(),progress()[0]]),e=>e.status===503);
  assert.throws(()=>details([{...progress()[0],count:'2'}]),e=>e.status===503);
});
function db(){const value=memoryDB({characters:[{id:'A',nickname:'가나',owner:'owner'},{id:'B',nickname:'다라',owner:'other'}],kronos_shop_items:shops,kronos_missions:missions,kronos_progress:progress()});return value;}
function insertDB(){
  const store=db(),from=store.from;store.tables.kronos_progress=[];
  store.from=table=>{const q=from(table);q.insert=payload=>({select(){return this;},then(resolve,reject){
    const target_key=payload.character_name??'';
    const duplicate=store.tables[table].some(r=>r.account_id===payload.account_id&&r.kind===payload.kind&&r.item_id===payload.item_id&&(r.character_name??'')===target_key);
    if(duplicate)return Promise.resolve({data:null,error:{code:'23505'}}).then(resolve,reject);
    const row={...payload,target_key};store.tables[table].push(row);store.writes.push({table,payload});return Promise.resolve({data:[structuredClone(row)],error:null}).then(resolve,reject);
  }});return q;};return store;
}
test('workspace CAS decreases shared count and preserves bookmark and other character progress',async()=>{
  const store=db(),{saveIrisWorkspaceEdit:save}=load('lib/server/irisWorkspaceWrite.ts');
  assert.equal((await save(store,{id:'account',nickname:'owner'},edit(),now)).status,'saved');
  assert.equal(store.tables.kronos_progress[0].count,1);assert.equal(store.tables.kronos_progress[0].bookmarked,true);assert.equal(store.tables.kronos_progress[1].count,3);
  assert.equal((await save(store,{id:'account',nickname:'owner'},edit(),now)).status,'saved');assert.equal(store.writes.length,1);
});
test('workspace blocks foreign ownership, changed baseline, period and inactive catalog before writes',async()=>{
  const {saveIrisWorkspaceEdit:save}=load('lib/server/irisWorkspaceWrite.ts');
  for(const patch of [{characterId:'B'},{accountId:'foreign'},{baseCompleted:1},{periodKey:'2026-09-27T21:00:00.000Z'},{catalogKey:'0'.repeat(64)}]){
    const store=db();await assert.rejects(()=>save(store,{id:'account',nickname:'owner'},edit(patch),now),e=>[403,409].includes(e.status));assert.equal(store.writes.length,0);
  }
});
test('workspace bookmark changes preserve stale counts for later reset, and CAS conflicts are unknown',async()=>{
  const {saveIrisWorkspaceEdit:save}=load('lib/server/irisWorkspaceWrite.ts'),store=db();
  const key=details()[1].key;
  assert.equal((await save(store,{id:'account',nickname:'owner'},edit({...key,field:'bookmark',baseCompleted:1,desiredCompleted:0}),now)).status,'saved');
  assert.equal(store.tables.kronos_progress[1].count,3);assert.equal(store.tables.kronos_progress[1].period_start,'2026-09-27T21:00:00Z');
  const raced=db(),from=raced.from;raced.from=t=>{const q=from(t),update=q.update;q.update=p=>{raced.tables.kronos_progress[0].count=3;return update(p);};return q;};
  assert.equal((await save(raced,{id:'account',nickname:'owner'},edit(),now)).status,'unknown');assert.equal(raced.tables.kronos_progress[0].count,3);
});

test('workspace inserts missing shared and character rows once and never overwrites a duplicate winner',async()=>{
  const {saveIrisWorkspaceEdit:save}=load('lib/server/irisWorkspaceWrite.ts'),store=insertDB();
  assert.equal((await save(store,{id:'account',nickname:'owner'},edit({baseCompleted:0}),now)).status,'saved');
  assert.equal(store.tables.kronos_progress[0].character_name,null);assert.equal(store.tables.kronos_progress[0].bookmarked,false);
  const key=details()[1].key;
  assert.equal((await save(store,{id:'account',nickname:'owner'},edit({...key,field:'bookmark',baseCompleted:0,desiredCompleted:1}),now)).status,'saved');
  assert.equal(store.tables.kronos_progress[1].character_name,'가나');assert.equal(store.tables.kronos_progress[1].count,0);
  const race=insertDB(),from=race.from;race.from=table=>{const q=from(table),insert=q.insert;q.insert=p=>{race.tables.kronos_progress.push({...p,target_key:'',count:3});return insert(p);};return q;};
  assert.equal((await save(race,{id:'account',nickname:'owner'},edit({baseCompleted:0}),now)).status,'unknown');
  assert.equal(race.tables.kronos_progress[0].count,3);assert.equal(race.writes.length,0);
});

test('workspace rejects a reset during pre-write reads without sending a mutation',async()=>{
  const store=db(),{saveIrisWorkspaceEdit:save}=load('lib/server/irisWorkspaceWrite.ts');let clocks=0;
  await assert.rejects(save(store,{id:'account',nickname:'owner'},edit(),()=>++clocks===1?now:new Date('2026-10-12T00:00:00Z')),e=>e.status===409);
  assert.equal(store.writes.length,0);
});

test('workspace POST enforces same-origin session and bounded JSON before touching the write path',async()=>{
  const {NextRequest}=await import('next/server.js');let calls=0,session={id:'account',nickname:'owner'};
  const {POST}=loadTS('app/api/iris/workspace/route.ts',{
    '@/lib/server/sanctumSession':{getSessionAccount:async()=>session,isPendingAccount:()=>false,getServerSupabase:()=>({}),SANCTUM_SESSION_COOKIE:'fixture'},
    '@/lib/server/irisWorkspaceWrite':{saveIrisWorkspaceEdit:async()=>{calls++;return {status:'saved',completed:1};}},
  });
  const send=(body,headers={})=>POST(new NextRequest('http://localhost/api/iris/workspace',{method:'POST',headers:{origin:'http://localhost','content-type':'application/json',...headers},body}));
  for(const [body,headers,status] of [[JSON.stringify({edit:edit()}),{origin:'http://other.test'},403],['{}',{},400],['null',{},400],['{',{},400],[' '.repeat(16385),{},413],['{}',{'content-type':'text/plain'},400]]){
    assert.equal((await send(body,headers)).status,status);
  }
  session=null;assert.equal((await send(JSON.stringify({edit:edit()}))).status,401);assert.equal(calls,0);
  session={id:'account',nickname:'owner'};const response=await send(JSON.stringify({edit:edit()}));assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(calls,1);
});

test('administrator-valid 200-character names and a reduced limit retain readable raw CAS progress',async()=>{
  const {buildWorkspaceDetails,parseWorkspaceRows}=load('lib/irisWorkspace.ts');
  const catalog=shops.map(r=>({...r,reward:'가'.repeat(200),limit:1}));
  const rows=buildWorkspaceDetails(catalog,missions,progress(),'가나',now,hash);
  assert.equal(rows[0].completed,2);assert.equal(rows[0].total,1);assert.equal(parseWorkspaceRows(rows)[0].title.length,200);
  const store=db();store.tables.kronos_shop_items=catalog;
  const {saveIrisWorkspaceEdit:save}=load('lib/server/irisWorkspaceWrite.ts');
  assert.equal((await save(store,{id:'account',nickname:'owner'},edit({...rows[0].key,baseCompleted:2,desiredCompleted:0}),now)).status,'saved');
  assert.equal(store.tables.kronos_progress[0].count,0);
});
