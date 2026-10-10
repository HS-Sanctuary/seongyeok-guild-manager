import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTS} from './load-ts.mjs';

const io={'@/lib/supabase':{supabase:{}},'@/lib/memberMutationClient':{}};
const bus=(id,date,time,created,status='모집중')=>({id,party_date:date,time_start:time,time_end:'23:59',created_at:created,status,content_name:'레이드 - 카브락',party_type:'길드버스',memo:'성역 길드 버스',members:[]});
// Exercises the actual list consumer. IO/effects are disabled, not the filtering/sorting.
function list(parties){
  let index=0;
  // Two read-status states precede user/mounted/activeParties in the shared hook.
  const react={...React,useState:initial=>[index++===4?parties:typeof initial==='function'?initial():initial,()=>{}],useEffect:()=>{},useMemo:f=>f(),useCallback:f=>f,useRef:v=>({current:v})};
  const {usePartyManager}=loadTS('hooks/usePartyManager.ts',{...io,react,'@/hooks/usePartyCatalog':{usePartyCatalog:()=>({classes:[],contents:[],powerReqs:[],loaded:true,error:null})}});
  return usePartyManager().filteredParties.map(p=>p.id);
}
test('guild buses prioritize nearer scheduled date before creation time and matching status',()=>{
  const parties=[bus('later','2126-10-11','20:00','2026-10-09'),bus('near','2126-10-10','20:00','2026-10-01'),bus('completed-later','2126-10-12','18:00','2026-10-10','매칭 완료')];
  assert.deepEqual(list(parties),['near','later','completed-later']);
});
test('same-day guild buses prioritize earlier start, retaining latest creation for exact ties',()=>{
  assert.deepEqual(list([bus('late','2126-10-10','22:00','2026-10-09'),bus('early-old','2126-10-10','08:00','2026-10-01'),bus('early-new','2126-10-10','08:00','2026-10-02')]),['early-new','early-old','late']);
});
test('ordinary party order stays matching-complete then latest-created, below guild buses',()=>{
  const normal=(id,status,created)=>({...bus(id,'2126-10-10','20:00',created,status),party_type:'1회 클리어',memo:undefined});
  assert.deepEqual(list([normal('old','모집중','2026-10-01'),normal('new','모집중','2026-10-09'),normal('complete','매칭 완료','2026-09-01'),bus('bus','2126-10-11','23:00','2026-08-01')]),['bus','complete','new','old']);
});

export const catalog={loaded:true,error:null,classes:[],powerReqs:[{content_name:'카브락',content_type:'raid',difficulty:'어려움',max_members:8}],contents:[
  {id:1,type:'raid',name:'레이드 - 카브락',is_active:true},
  {id:2,type:'raid',name:'레이드 - 에이렐',is_active:true},
  {id:3,type:'abyss',name:'어비스 - 허상의 정박지',is_active:true},
  {id:4,type:'abyss',name:'어비스 - 광기의 동굴',is_active:true},
  {id:5,type:'raid',name:'숨겨진 레이드',is_active:false},
  {id:6,type:'daily',name:'일일 미션',is_active:true},
]};
const char={id:9,nickname:'열두글자캐릭터이름테스트',job:'대검전사',raid_checks:[1,'어비스 - 허상의 정박지']};
const noop=()=>{};
test('normal join exposes nickname completion view and an independent participation selector',()=>{
  const Modal=loadTS('components/party/modals/JoinPartyModal.tsx',io).default;
  const html=renderToStaticMarkup(React.createElement(Modal,{catalog,joinPopupParty:{...bus(1,'2126-10-10','20:00','2026-10-09'),max_members:8},myCharacters:[char],joinSelectedChar:char.nickname,setJoinSelectedChar:noop,setJoinPopupParty:noop,getDayOfWeekKorean:()=>'',executeJoinParty:noop}));
  assert.ok(html.includes(`${char.nickname} 완료 상태 보기`));
  assert.ok(html.includes(`${char.nickname} 참가 선택`));
});
test('guild bus join exposes nickname completion view without using the selection checkbox as its trigger',()=>{
  const Modal=loadTS('components/party/GuildBusJoinModal.tsx',io).default;
  const html=renderToStaticMarkup(React.createElement(Modal,{catalog,isOpen:true,myCharacters:[char],contentName:'레이드 - 카브락',difficulty:'어려움',onClose:noop,onSubmit:noop}));
  assert.ok(html.includes(`${char.nickname} 완료 상태 보기`));
  assert.ok(html.includes(`${char.nickname} 참가 선택`));
});

test('completion view accepts saved ID, name, legacy alias and boolean-object check formats',()=>{
  const Status=loadTS('components/party/CharacterCompletionStatus.tsx',io).default;
  for(const checks of [[1,'abyss_1'],JSON.stringify([1,'어비스 - 허상의 정박지']),{'1':true,'abyss_1':true}]){
    const html=renderToStaticMarkup(React.createElement(Status,{character:{...char,raid_checks:checks},catalog,onClose:noop}));
    assert.ok(html.replace(/<[^>]*>/g,'').includes('레이드 1/2'));
    assert.equal(html.match(/✓ 완료/g)?.length,2);
    assert.equal(html.match(/미완료/g)?.length,2);
    assert.ok(!html.includes('숨겨진 레이드'));assert.ok(!html.includes('일일 미션'));
  }
});
test('missing or corrupt checks and failed catalogs are never reported as incomplete content',()=>{
  const Status=loadTS('components/party/CharacterCompletionStatus.tsx',io).default;
  for(const [checks,criteria] of [[undefined,catalog],['{broken',catalog],[false,catalog],[[],{...catalog,error:'실패'}],[[],{...catalog,loaded:false}]]){
    const html=renderToStaticMarkup(React.createElement(Status,{character:{...char,raid_checks:checks},catalog:criteria,onClose:noop}));
    assert.ok(html.includes('role="status"'));assert.ok(!html.includes('미완료'));
  }
});
test('known empty checks are incomplete and an empty catalog has explicit empty-state text',()=>{
  const Status=loadTS('components/party/CharacterCompletionStatus.tsx',io).default;
  for(const checks of [[],null,{}]){
    const html=renderToStaticMarkup(React.createElement(Status,{character:{...char,raid_checks:checks},catalog,onClose:noop}));
    assert.equal(html.match(/미완료/g)?.length,4);assert.ok(!html.includes('확인할 수 없어요'));
  }
  const html=renderToStaticMarkup(React.createElement(Status,{character:char,catalog:{...catalog,contents:[]},onClose:noop}));
  assert.equal(html.match(/등록된 컨텐츠가 없어요/g)?.length,2);
});
