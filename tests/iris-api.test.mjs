import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server.js';
import { loadTS } from './load-ts.mjs';
import { memoryDB } from './memory-db.mjs';

const own = {id:7,nickname:'내캐릭터',owner:'owner',alias:'내캐릭',job:'대검전사',sort_order:1,
  daily_checks:{1:true},weekly_checks:{normal:[2],repeat:{3:[true,false,true],9900:[true]}},raid_checks:['레이드 - 에이렐'],intro:'PRIVATE'};
const tables = {
  characters:[own,{...own,id:'legacy-id',nickname:'owner',owner:null},{...own,id:9,nickname:'타인',owner:'other'}],
  nexus_tasks:[{id:1,name:'일간',type:'daily',is_active:true},{id:2,name:'주간',type:'weekly',is_active:true},{id:3,name:'반복',type:'repeat_weekly',max_count:3,is_active:true}],
  nexus_contents:[{id:11,name:'허상의 정박지',type:'abyss',is_active:true},{id:12,name:'에이렐',type:'raid',is_active:true},{id:13,name:'숨김',type:'raid',is_active:false}],
  nexus_classes:[{id:1,name:'전사',is_active:true},{id:2,name:'마법사',is_active:true},{id:3,name:'숨김',is_active:false}],
};
test('class write context distinguishes missing values from malformed read-normalized nulls',async()=>{
  for(const [levels,want] of [[null,[true,true]],[{전사:53},[true,true]],[{전사:0},[false,true]],[[],[false,false]]]){
    const {call}=setup(undefined,{...tables,characters:[{...own,levels}]});
    const response=await call('app/api/iris/kronos/route.ts','?characterId=7');assert.equal(response.status,200);
    const body=await response.json();assert.deepEqual(body.writeContext.classes.map(c=>c.editable),want);
    assert.equal(body.writeContext.classes[0].baseLevel,levels?.전사===53?53:null);
  }
});
function setup(account={id:'account-id',nickname:'owner',status:'승인',role:'길드원'}, initial=tables) {
  const db = memoryDB(initial);
  const from = db.from;
  db.from = table => { const q=from(table);q.order=()=>q;return q; };
  const replacements = {'@/lib/server/sanctumSession':{
    getSessionAccount:async()=>account,isPendingAccount:a=>a.status==='승인대기',getServerSupabase:()=>db,SANCTUM_SESSION_COOKIE:'session',
  }};
  const call = (path,query='') => loadTS(path,replacements).GET(new NextRequest(`http://localhost:3000/api/iris/test${query}`));
  return {db,call};
}
test('IRIS owned character list includes stable IDs but never another owner or raw profile',async()=> {
  const {db,call}=setup();
  const response=await call('app/api/iris/characters/route.ts');
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.accountId,'account-id');
  assert.deepEqual(body.characters.map(c=>c.id),['legacy-id',7]);
  assert.equal(body.characters.some(c=>c.nickname==='타인'),false);
  assert.equal(body.characters[1].intro,undefined);
  assert.equal(body.characters[1].owner,undefined);
  assert.equal(db.writes.length,0);
});

test('selected character details expose task states and saved class levels without raw profiles',async()=> {
  const initial=structuredClone(tables);
  initial.characters[0].levels={전사:65,마법사:'35',숨김:100};
  const {db,call}=setup(undefined,initial);
  const response=await call('app/api/iris/kronos/route.ts','?characterId=7');
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.details?.schemaVersion,1);
  assert.deepEqual(body.details.tasks.daily,[{id:'1',name:'일간',completed:1,total:1}]);
  assert.deepEqual(body.details.tasks.weekly.slice(-2),[
    {id:'2',name:'주간',completed:1,total:1},{id:'3',name:'반복',completed:2,total:3},
  ]);
  assert.deepEqual(body.details.tasks.abyss,[{id:'11',name:'허상의 정박지',completed:0,total:1}]);
  assert.deepEqual(body.details.tasks.raid,[{id:'12',name:'에이렐',completed:1,total:1}]);
  assert.deepEqual(body.details.classes,[{id:'1',name:'전사',level:65},{id:'2',name:'마법사',level:null}]);
  for(const category of ['daily','weekly','abyss','raid']) {
    assert.equal(body.details.tasks[category].reduce((sum,row)=>sum+row.completed,0),body.summary[category].completed);
    assert.equal(body.details.tasks[category].reduce((sum,row)=>sum+row.total,0),body.summary[category].total);
  }
  for(const key of ['nickname','owner','levels','daily_checks','intro']) assert.equal(body[key],undefined);
  assert.equal(db.writes.length,0);
});

test('detail normalization rejects oversized duplicate and malformed catalogs without clamping',()=> {
  const {buildIrisKronosDetails:build}=loadTS('lib/irisKronos.ts');
  assert.equal(typeof build,'function');
  const daily=n=>Array.from({length:n},(_,id)=>({id,name:'항목'+id,type:'daily',is_active:true}));
  const classes=n=>Array.from({length:n},(_,id)=>({id,name:'클래스'+id,is_active:true}));
  assert.equal(build({},daily(200),[],classes(100)).tasks.daily.length,200);
  for(const [tasks,cls] of [[daily(201),[]],[[],classes(101)],[[daily(1)[0],daily(1)[0]],[]],
    [[{id:1,name:'가'.repeat(121),type:'daily'}],[]],[[{id:1,name:'반복',type:'repeat_weekly',max_count:0}],[]],
    [[{id:1,name:'반복',type:'repeat_weekly',max_count:1001}],[]],[[],[{id:1,name:'A'},{id:1,name:'B'}]]]) {
    assert.throws(()=>build({},tasks,[],cls));
  }
  assert.equal(build({},[{id:1,name:'😀'.repeat(120),type:'daily'}],[],[]).tasks.daily[0].name.length,240);
  for(const level of [undefined,null,'35',0,1001,1.5]) {
    assert.equal(build({levels:{전사:level}},[],[],[{id:1,name:'전사'}]).classes[0].level,null);
  }
  assert.deepEqual(build({},[],[],[]).classes,[]);
  assert.throws(()=>build({weekly_checks:{repeat:{9900:Array(14).fill(true)}}},[],[],[],new Date('2026-10-04T21:00:00Z')),/period/i);
});
test('IRIS summary shares legacy checkbox and repeat counts without returning raw checks',async()=> {
  const {db,call}=setup();
  const response=await call('app/api/iris/kronos/route.ts','?characterId=7');
  assert.equal(response.status,200);
  const body=await response.json();
  assert.equal(body.characterId,'7');
  assert.deepEqual(body.summary.daily,{completed:1,total:1});
  assert.equal(body.summary.weekly.completed,4); // normal1 + repeat2 + black-hole1
  assert.deepEqual(body.summary.abyss,{completed:0,total:1});
  assert.deepEqual(body.summary.raid,{completed:1,total:1});
  assert.equal(body.daily_checks,undefined);
  assert.equal(body.nickname,undefined);
  assert.equal(db.writes.length,0);
});
test('IRIS reads refuse missing or pending sessions before querying character data',async()=> {
  for (const account of [null,{id:'a',nickname:'owner',status:'승인대기'}]) {
    const {call}=setup(account);
    for (const path of ['app/api/iris/characters/route.ts','app/api/iris/kronos/route.ts']) {
      assert.equal((await call(path,'?characterId=7')).status,401);
    }
  }
});
test('IRIS summary rejects another owner and accepts only its own ownerless legacy main',async()=> {
  const {call}=setup();
  assert.equal((await call('app/api/iris/kronos/route.ts','?characterId=9')).status,403);
  assert.equal((await call('app/api/iris/kronos/route.ts','?characterId=legacy-id')).status,200);
  assert.equal((await call('app/api/iris/kronos/route.ts')).status,400);
});
test('IRIS summary fails closed on DB failure instead of reporting empty successful counts',async()=> {
  const {db,call}=setup();
  db.from=()=>({select(){return this},eq(){return this},maybeSingle(){return Promise.resolve({data:null,error:new Error('PRIVATE DB ERROR')})}});
  const response=await call('app/api/iris/kronos/route.ts','?characterId=7');
  assert.equal(response.status,503);
  assert.equal((await response.text()).includes('PRIVATE'),false);
});

test('shared KRONOS task lists preserve extra weekly jobs and use Korean06 game day',()=> {
  const {getKronosTaskLists,buildIrisKronosSummary}=loadTS('lib/irisKronos.ts');
  const monday=getKronosTaskLists([],new Date('2026-10-04T21:00:00Z'));
  assert.deepEqual(monday.weekly.map(t=>[t.id,t.max_count]),[[9900,8],[9901,7],[9902,3]]);
  const sunday=getKronosTaskLists([],new Date('2026-10-04T14:00:00Z'));
  assert.equal(sunday.weekly[0].max_count,14);
  const summary=buildIrisKronosSummary(own,tables.nexus_tasks,tables.nexus_contents,new Date('2026-10-04T21:00:00Z'));
  assert.deepEqual(summary.weekly,{completed:4,total:22});
});
test('older repeat slots beyond current calendar allowance are not silently clamped into a different summary',()=> {
  const {buildIrisKronosSummary}=loadTS('lib/irisKronos.ts');
  assert.throws(()=>buildIrisKronosSummary({weekly_checks:{repeat:{9900:Array(14).fill(true)}}},[],[],new Date('2026-10-04T21:00:00Z')),/period/i);
});
