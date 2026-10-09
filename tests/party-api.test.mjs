import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server.js';
import { loadTS } from './load-ts.mjs';
import { memoryDB } from './memory-db.mjs';
const own = {id:1,nickname:'alt',owner:'owner',raid_checks:{0:11,1:12,'레이드 - 에이렐':true}};
const other = {id:2,nickname:'driver',owner:'admin',raid_checks:[11]};
const party = {id:7,content_name:'레이드 - 에이렐',difficulty:'어려움',party_type:'1회 클리어',sub_content:'[성역 길드 버스] memo',leader_name:'driver',status:'운행중',members:[
  {character_name:'driver',owner:'admin',allow_repeat:true}, {character_name:'alt',owner:'owner',allow_repeat:true},
]};
function setup(path, account = {nickname:'owner',role:'길드원'}) {
  const db = memoryDB({characters:[own,other],parties:[party],nexus_contents:[{id:13,name:'에이렐',type:'raid'}],nexus_tasks:[{id:3,name:'weekly',type:'weekly'}]});
  const { POST } = loadTS(path, {'@/lib/server/sanctumSession':{
    getServerSupabase:()=>db,getSessionAccount:async()=>account,isPendingAccount:()=>false,SANCTUM_SESSION_COOKIE:'session',
  }});
  const call = body => POST(new NextRequest('http://localhost:3000/api/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
  return {db,call};
}
test('own repeat toggle works from either page and keeps unrelated members', async () => {
  const {db,call}=setup('app/api/member-mutations/route.ts');
  const response=await call({table:'parties',action:'update',filter:{column:'id',value:7},payload:{_busMemberAction:{type:'repeat',name:'alt',allow_repeat:false}}});
  assert.equal(response.status,200,await response.text());
  assert.equal(db.tables.parties[0].members[1].allow_repeat,false);
  assert.deepEqual(db.tables.parties[0].members[0],party.members[0]);
});
test('own leave removes the selected alt, not the account nickname', async () => {
  const {db,call}=setup('app/api/member-mutations/route.ts');
  const response=await call({table:'parties',action:'update',filter:{column:'id',value:7},payload:{_busMemberAction:{type:'leave',name:'alt'}}});
  assert.equal(response.status,200,await response.text());
  assert.deepEqual(db.tables.parties[0].members, [party.members[0]]);
});
test('targeted own toggle cannot smuggle a controller change', async () => {
  const {db,call}=setup('app/api/member-mutations/route.ts');
  const response=await call({table:'parties',action:'update',filter:{column:'id',value:7},payload:{status:'종료됨',_busMemberAction:{type:'repeat',name:'alt',allow_repeat:false}}});
  assert.equal(response.status,403);
  assert.equal(db.writes.length,0);
});
test('bus round completion preserves old checks and writes canonical content ID', async () => {
  const {db,call}=setup('app/api/parties/sync-checklist/route.ts',{nickname:'admin',role:'부마스터'});
  const response=await call({partyId:7,completedNames:['alt'],finishRound:true,baseline:party});
  assert.equal(response.status,200,await response.text());
  assert.deepEqual(db.tables.characters[0].raid_checks,[11,12,13]);
  assert.equal(db.tables.parties[0].members[1].is_completed,true);
  assert.equal(db.tables.parties[0].members[0].is_completed,undefined);
});
test('non-operating admin cannot complete a guild bus round', async () => {
  const {db,call}=setup('app/api/parties/sync-checklist/route.ts',{nickname:'outsider',role:'부마스터'});
  const response=await call({partyId:7,completedNames:['alt'],finishRound:true});
  assert.equal(response.status,403);
  assert.equal(db.writes.length,0);
});
test('home uncheck matches bus aliases and preserves other completions on server', async () => {
  const {db,call}=setup('app/api/member-mutations/route.ts');
  const response=await call({table:'characters',action:'update',filter:{column:'id',value:1},payload:{_checklistAction:{type:'raid',id:13,completed:false}}});
  assert.equal(response.status,200,await response.text());
  assert.deepEqual(db.tables.characters[0].raid_checks,[11,12]);
});
test('bus reconfiguration persists waiting order instead of repeating CP sort', async () => {
  const {db,call}=setup('app/api/member-mutations/route.ts',{nickname:'admin',role:'부마스터'});
  const response=await call({table:'parties',action:'update',filter:{column:'id',value:7},payload:{_busMemberAction:{type:'reconfigure',selectedNames:['driver']}}});
  assert.equal(response.status,200,await response.text());
  assert.deepEqual(db.tables.parties[0].members.map(m=>m.character_name),['alt','driver']);
  assert.deepEqual(db.tables.parties[0].members.map(m=>m.selection_order),[0,1]);
});
test('legacy join cannot modify another character while adding an owned character', async () => {
  const {db,call}=setup('app/api/member-mutations/route.ts');
  db.tables.characters.push({id:3,nickname:'alt2',owner:'owner'});
  const members=[{...party.members[0],allow_repeat:false},party.members[1],{character_name:'alt2'}];
  const response=await call({table:'parties',action:'update',filter:{column:'id',value:7},payload:{members,_busJoin:true}});
  assert.equal(response.status,403);
  assert.equal(db.writes.length,0);
});
test('non-operating admin cannot disband another guild bus through API', async () => {
  const {db,call}=setup('app/api/member-mutations/route.ts',{nickname:'outsider',role:'부마스터'});
  const response=await call({table:'parties',action:'delete',filter:{column:'id',value:7}});
  assert.equal(response.status,403);
  assert.equal(db.tables.parties.length,1);
});
test('KRONOS autosave merges only edits against the loaded baseline', async () => {
  const {db,call}=setup('app/api/member-mutations/route.ts');
  db.tables.characters[0].raid_checks=[11,12,13];
  const response=await call({table:'characters',action:'update',filter:{column:'nickname',value:'alt'},payload:{raid_checks:[12],_checklistBase:{raid_checks:[11,12]}}});
  assert.equal(response.status,200,await response.text());
  assert.deepEqual(db.tables.characters[0].raid_checks,[12,13]);
  assert.equal('_checklistBase' in db.tables.characters[0],false);
});
test('concurrent bus join is preserved and stale toggle reports a conflict', async () => {
  const {db,call}=setup('app/api/member-mutations/route.ts');
  const from=db.from;
  db.from=table => {
    const query=from(table), update=query.update;
    query.update=payload => {
      if (table==='parties') db.tables.parties[0].members.push({character_name:'joined-concurrently'});
      return update(payload);
    };
    return query;
  };
  const response=await call({table:'parties',action:'update',filter:{column:'id',value:7},payload:{_busMemberAction:{type:'repeat',name:'alt',allow_repeat:false}}});
  assert.equal(response.status,409);
  assert.equal(db.writes.length,0);
  assert.equal(db.tables.parties[0].members[1].allow_repeat,true);
  assert.equal(db.tables.parties[0].members.length,3);
});
test('concurrent checklist update is not overwritten by KRONOS autosave', async () => {
  const {db,call}=setup('app/api/member-mutations/route.ts');
  db.tables.characters[0].raid_checks=[11,12];
  const from=db.from;
  db.from=table => {
    const query=from(table), update=query.update;
    query.update=payload => {
      if (table==='characters') db.tables.characters[0].raid_checks.push(13);
      return update(payload);
    };
    return query;
  };
  const response=await call({table:'characters',action:'update',filter:{column:'nickname',value:'alt'},payload:{raid_checks:[12],_checklistBase:{raid_checks:[11,12]}}});
  assert.equal(response.status,409);
  assert.equal(db.writes.length,0);
  assert.deepEqual(db.tables.characters[0].raid_checks,[11,12,13]);
});
