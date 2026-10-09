import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {loadTS} from './load-ts.mjs';
import {memoryDB} from './memory-db.mjs';
import {NextRequest} from 'next/server.js';

const noop=()=>{};
const cabrak={id:'raid_cabrak',name:'레이드 - 카브락',category:'레이드',size:8};
const memo='카브락 어려움 가실 분~ 인원 부족시 에이렐';
test('reselecting content in the real create modal preserves a handwritten notice',()=>{
  const hooks={...React,useState:v=>[typeof v==='function'?v():v,noop],useEffect:noop,useMemo:f=>f(),useRef:v=>({current:v})};
  const Modal=loadTS('components/party/modals/BusCreateModal.tsx',{react:hooks,'@/lib/supabase':{supabase:{}},'@/lib/memberMutationClient':{}}).default;
  let value=memo;
  const tree=Modal({catalog:{loaded:true,error:null,classes:[],contents:[],powerReqs:[]},showBusCreateModal:true,setShowBusCreateModal:noop,busCreateContent:cabrak,setBusCreateContent:noop,busCreateDiff:'어려움',setBusCreateDiff:noop,busCreateDate:'2026-10-09',setBusCreateDate:noop,busCreateTimeStart:'20:00',setBusCreateTimeStart:noop,busCreateTimeEnd:'23:59',setBusCreateTimeEnd:noop,busCreateMemo:value,setBusCreateMemo:v=>value=v,busCharSelections:{},setBusCharSelections:noop,handleCreateGuildBus:noop,myCharacters:[]});
  const find=e=>Array.isArray(e)?e.map(find).find(Boolean):e&&typeof e==='object'?(e.props?.applyContentModal?e:find(e.props?.children)):null;
  find(tree).props.applyContentModal(undefined,{content:cabrak,difficulty:'어려움'});
  assert.equal(value,memo);
});

const characters=Array.from({length:6},(_,i)=>({id:i+1,nickname:i===0?'제스':`참가${i}`,owner:i===0?'제스':`계정${i}`,job:i===1?'사제':'대검전사',combat_power:300-i*30,magic_resistance:50,raid_checks:i===2?[13]:[12]}));
const members=characters.map((c,i)=>({name:c.nickname,character_name:c.nickname,character_id:c.id,owner:c.owner,account_id:c.owner,owner_account:c.owner,job:c.job,allow_repeat:true,is_completed:true,selection_order:i,time_start:'20:00',time_end:'23:59'}));
const party={id:7,content_name:'레이드 - 카브락',difficulty:'어려움',party_type:'1회 클리어',sub_content:'[성역 길드 버스] 예전 공지',memo:'[성역 길드 버스] 예전 공지',party_date:'2026-10-09',time_start:'20:00',time_end:'23:59',max_members:8,status:'모집중',leader_name:'제스',selected_sub_contents:null,final_start_time:null,members};
const reqs=[{id:1,content_id:12,content_type:'raid',content_name:'카브락',difficulty:'어려움',max_members:8,min_cp:50,rec_cp:150,op_cp:250},{id:2,content_id:13,content_type:'raid',content_name:'에이렐',difficulty:'어려움',max_members:4,min_cp:50,rec_cp:150,op_cp:250}];
function setup(account={nickname:'제스',role:'부마스터'}){
  const db=memoryDB({characters,parties:[party],accounts:characters.map(c=>({id:c.owner,nickname:c.owner})),content_power_reqs:reqs,nexus_contents:[{id:12,type:'raid',name:'카브락',is_active:true},{id:13,type:'raid',name:'에이렐',is_active:true}],nexus_classes:[{name:'대검전사',role:'근딜'},{name:'사제',role:'힐러'}]});
  const {POST}=loadTS('app/api/member-mutations/route.ts',{'@/lib/supabase':{supabase:{}},'@/lib/server/sanctumSession':{getServerSupabase:()=>db,getSessionAccount:async()=>account,isPendingAccount:()=>false,SANCTUM_SESSION_COOKIE:'session'}});
  const settings={baseline:structuredClone(party),contentId:'raid_eirel',difficulty:'어려움',memo:'오늘 에이렐로 변경합니다',partyDate:'2026-10-09',timeStart:'21:00',timeEnd:'23:30',members:[{name:'제스',allowRepeat:true}],roundFinished:true};
  const call=edit=>POST(new NextRequest('http://localhost:3000/api/member-mutations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({table:'parties',action:'update',filter:{column:'id',value:7},payload:{_busSettings:{...settings,...edit}}})}));
  return {db,call,settings};
}
test('operator changes Cabrak to Eirel with four seats and keeps all six registrants and old checklists',async()=>{
  const {db,call}=setup(); const before=structuredClone(db.tables.characters);
  const response=await call({}); assert.equal(response.status,200,await response.text());
  const saved=db.tables.parties[0];
  assert.equal(saved.content_name,'레이드 - 에이렐'); assert.equal(saved.max_members,4);
  assert.equal(saved.members.length,6); assert.equal(saved.time_start,'21:00');
  assert.equal(saved.sub_content,'[성역 길드 버스] 오늘 에이렐로 변경합니다');
  assert.equal(saved.memo,saved.sub_content); assert.deepEqual(db.tables.characters,before);
  assert.equal(saved.members[0].is_completed,false); assert.equal(saved.members[2].is_completed,true);
});
test('another administrator cannot edit the operator bus',async()=>{
  const {db,call}=setup({nickname:'다른운영진',role:'부마스터'});
  const response=await call({}); assert.equal(response.status,403); assert.equal(db.writes.length,0);
});
test('stale notice or new participant conflicts instead of overwriting',async()=>{
  for(const mutate of [p=>p.memo='다른 화면 수정',p=>p.members.push({...members[0],name:'추가'})]){
    const {db,call}=setup(); mutate(db.tables.parties[0]); const response=await call({});
    assert.equal(response.status,409); assert.equal(db.writes.length,0);
  }
});
test('server rejects unregistered difficulties, missing characters, duplicate selection and malformed schedule',async()=>{
  for(const edit of [{difficulty:'지옥 9'},{members:[{name:'제스',allowRepeat:true},{name:'제스',allowRepeat:true}]},{partyDate:'2026-02-31'},{timeStart:'25:01'}]){
    const {db,call}=setup(); const response=await call(edit); assert.equal(response.status,400); assert.equal(db.writes.length,0);
  }
});
test('editing during operation needs round confirmation; completed same-content entries stay completed',async()=>{
  const {db,call,settings}=setup(); db.tables.parties[0].status='운행중'; settings.baseline.status='운행중';
  let response=await call({roundFinished:false}); assert.equal(response.status,400); assert.equal(db.writes.length,0);
  response=await call({contentId:'raid_cabrak'}); assert.equal(response.status,200,await response.text());
  assert.ok(db.tables.parties[0].members.every(m=>m.is_completed));
});
test('a configuration change during the save is caught by an atomic compare-and-set',async()=>{
  const {db,call}=setup(); const from=db.from;
  db.from=table=>{const q=from(table),update=q.update; q.update=payload=>{if(table==='parties')db.tables.parties[0].time_end='22:00';return update(payload);};return q;};
  const response=await call({}); assert.equal(response.status,409); assert.equal(db.writes.length,0);
});

test('a stale round completion cannot mark the newly edited content complete',async()=>{
  const db=memoryDB({characters,parties:[{...party,content_name:'레이드 - 에이렐',max_members:4}],nexus_contents:[{id:13,name:'에이렐',type:'raid'}]});
  const {POST}=loadTS('app/api/parties/sync-checklist/route.ts',{'@/lib/server/sanctumSession':{getServerSupabase:()=>db,getSessionAccount:async()=>({nickname:'제스',role:'부마스터'}),isPendingAccount:()=>false,SANCTUM_SESSION_COOKIE:'session'}});
  const response=await POST(new NextRequest('http://localhost:3000/api/parties/sync-checklist',{method:'POST',body:JSON.stringify({partyId:7,completedNames:['제스'],finishRound:true,baseline:party})}));
  assert.equal(response.status,409);assert.equal(db.writes.length,0);
});

test('next-day picker times and legacy midnight can be saved without losing their offsets',async()=>{
  for (const end of ['01:00 (+1일)','24:00']) {
    const {db,call}=setup();
    const response=await call({timeStart:'23:00',timeEnd:end,members:[{name:'제스',allowRepeat:true,timeStart:'23:00',timeEnd:end}]});
    assert.equal(response.status,200,await response.text());
    assert.equal(db.tables.parties[0].time_end,end);
    assert.equal(db.tables.parties[0].members[0].time_end,'23:59');
  }
});

test('select-all in the actual editor preserves individual participant times',()=>{
  const noop=()=>{};
  const hooks={...React,useState:v=>[v==='SETTINGS'?'CHARACTERS':typeof v==='function'?v():v,noop],useEffect:noop,useMemo:f=>f(),useRef:v=>({current:v})};
  const Modal=loadTS('components/party/modals/BusCreateModal.tsx',{react:hooks,'@/lib/supabase':{supabase:{}},'@/lib/memberMutationClient':{}}).default;
  let configs={'제스':{selected:true,allowRepeat:true,timeStart:'22:00',timeEnd:'23:00'}};
  const tree=Modal({mode:'edit',catalog:{loaded:true,error:null,classes:[],contents:[],powerReqs:[]},showBusCreateModal:true,setShowBusCreateModal:noop,busCreateContent:cabrak,setBusCreateContent:noop,busCreateDiff:'어려움',setBusCreateDiff:noop,busCreateDate:'2026-10-09',setBusCreateDate:noop,busCreateTimeStart:'20:00',setBusCreateTimeStart:noop,busCreateTimeEnd:'23:59',setBusCreateTimeEnd:noop,busCreateMemo:memo,setBusCreateMemo:noop,busCharSelections:configs,setBusCharSelections:f=>configs=f(configs),handleCreateGuildBus:noop,myCharacters:[characters[0],characters[1]]});
  const text=e=>Array.isArray(e)?e.map(text).join(''):typeof e==='string'?e:e?.props?text(e.props.children):'';
  const find=e=>Array.isArray(e)?e.map(find).find(Boolean):e&&typeof e==='object'?(e.type==='button'&&text(e).includes('전체 선택')?e:find(e.props?.children)):null;
  find(tree).props.onClick();
  assert.equal(configs['제스'].timeStart,'22:00');assert.equal(configs['제스'].timeEnd,'23:00');
});

test('abyss selection keeps the existing text-array CAS and evaluates completion for every selected dungeon',async()=>{
  const {db,call,settings}=setup();
  const names=['허상의 정박지','광기의 동굴'];
  for(let i=0;i<2;i++){
    db.tables.content_power_reqs.push({content_id:20+i,content_name:names[i],content_type:'abyss',difficulty:'어려움',max_members:4,min_cp:50,rec_cp:150,op_cp:250});
    db.tables.nexus_contents.push({id:20+i,name:names[i],type:'abyss',is_active:true});
  }
  db.tables.characters[0].raid_checks=[20];db.tables.characters[1].raid_checks=[20,21];
  db.tables.parties[0].selected_sub_contents=['abyss_1'];settings.baseline.selected_sub_contents=['abyss_1'];
  const from=db.from,filters=[];
  db.from=table=>{const q=from(table),eq=q.eq;q.eq=(key,value)=>{if(key==='selected_sub_contents'){filters.push(value);value=JSON.stringify(JSON.parse(`[${value.slice(1,-1)}]`));}return eq(key,value);};return q;};
  const response=await call({contentId:'abyss_all',subContents:['abyss_1','abyss_2']});assert.equal(response.status,200,await response.text());
  assert.deepEqual(filters,['{"abyss_1"}']);
  const saved=db.tables.parties[0];assert.deepEqual(saved.selected_sub_contents,['abyss_1','abyss_2']);assert.equal(saved.max_members,4);
  assert.equal(saved.members[0].is_completed,false);assert.equal(saved.members[1].is_completed,true);
});

test('bus editor cannot add another account character, even as the operator',async()=>{
  const {db,call}=setup();
  const response=await call({members:[{name:'참가1',allowRepeat:false}]});
  assert.equal(response.status,403);assert.equal(db.writes.length,0);
});

test('operator can remove their own entry without removing other registrants',async()=>{
  const {db,call}=setup();
  const response=await call({members:[]});
  assert.equal(response.status,200,await response.text());
  assert.deepEqual(db.tables.parties[0].members.map(m=>m.name),['참가1','참가2','참가3','참가4','참가5']);
});

test('editing bus schedule cannot rewrite prior participant times or another account repeat setting',async()=>{
  const {db,call}=setup();
  db.tables.parties[0].members[1].allow_repeat=false;
  const baseline=structuredClone(db.tables.parties[0]);
  const response=await call({baseline,members:[{name:'제스',allowRepeat:false,timeStart:'21:00',timeEnd:'23:30'}]});
  assert.equal(response.status,200,await response.text());
  const saved=db.tables.parties[0];
  assert.equal(saved.members.length,6);
  for(const member of saved.members){assert.equal(member.time_start,'20:00');assert.equal(member.time_end,'23:59');}
  assert.equal(saved.members[1].allow_repeat,false);
});

test('adding another owned character preserves other accounts and assigns only the new entry the bus window',async()=>{
  const {db,call}=setup();
  db.tables.characters.push({...characters[0],id:22,nickname:'제스부캐'});
  const response=await call({members:[{name:'제스부캐',allowRepeat:true}]});
  assert.equal(response.status,200,await response.text());
  const saved=db.tables.parties[0];
  assert.deepEqual(saved.members.map(m=>m.name),['참가1','참가2','참가3','참가4','참가5','제스부캐']);
  assert.equal(saved.members[5].time_start,'21:00');assert.equal(saved.members[5].time_end,'23:30');
  assert.equal(saved.members[0].time_start,'20:00');assert.equal(saved.members[0].allow_repeat,true);
});
