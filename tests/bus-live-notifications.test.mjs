import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {loadTS} from './load-ts.mjs';

const before={id:7,content_name:'카브락',difficulty:'어려움',max_members:8,memo:'길드 버스 공지',sub_content:'길드 버스 공지',party_date:'2026-10-09',time_start:'20:00',time_end:'23:59',status:'모집중',members:[{name:'내캐릭터',owner:'uuid-account',allow_repeat:true,time_start:'21:00',time_end:'23:00'}]};

function setup({holdRead=false,storageBroken=false,initialParty=before,role='길드원',now='2026-10-09T12:00:00Z'}={}){
  const effects=[],states=[],channels=[],reads=[],intervals=new Map();
  const RealDate=globalThis.Date,previousWindow=globalThis.window,previousStorage=globalThis.localStorage;
  let clock=RealDate.parse(now),timerId=0;
  globalThis.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[clock]));}static now(){return clock;}};
  const hooks={...React,useState(initial){const index=states.length;states.push(typeof initial==='function'?initial():initial);return [states[index],value=>states[index]=typeof value==='function'?value(states[index]):value];},useRef:value=>({current:value}),useMemo:f=>f(),useCallback:f=>f,useEffect:(run,deps)=>effects.push({run,deps})};
  let release;
  const gate=holdRead?new Promise(resolve=>release=resolve):Promise.resolve();
  const db={from(table){const filters=[];const query={select(){return query;},eq(key,value){filters.push([key,value]);return query;},neq(){return query;},async then(done){reads.push({table,filters});if(table==='parties')await gate;const data=table==='parties'?[structuredClone(initialParty)]:table==='characters'&&filters.length?[{nickname:'내캐릭터',owner:'내계정'}]:[];return done({data,error:null});}};return query;},channel(name){const callbacks={};let status;const channel={name,callbacks,on(kind,filter,run){callbacks[filter.event]=run;return channel;},subscribe(callback){status=callback;return channel;},status(value){status?.(value);}};channels.push(channel);return channel;},removeChannel(){}};
  const store=new Map();globalThis.localStorage={getItem(key){if(storageBroken)throw Error('blocked');return store.get(key)||null;},setItem(key,value){if(storageBroken)throw Error('blocked');store.set(key,value);}};
  globalThis.window={setInterval(run){const id=++timerId;intervals.set(id,run);return id;},clearInterval(id){intervals.delete(id);},setTimeout:()=>1,clearTimeout(){}};
  const {useNoticeNotifications}=loadTS('hooks/useNoticeNotifications.ts',{react:hooks,'next/navigation':{usePathname:()=>'/party'},'@/lib/supabase':{supabase:db},'@/lib/approvedCharacters':{getApprovedAccountNames:async()=>null,filterApprovedCharacters:data=>data},'@/lib/weeklyReset':{getWeeklyReminderKey:()=>null,formatWeeklyResetRemaining:()=>''}});
  const result=useNoticeNotifications('내계정',role,'uuid-account');
  const effect=effects.find(e=>e.deps?.[0]==='내계정'&&e.deps?.[1]===role&&e.deps.length>=3);
  assert.ok(effect,'real operational notification effect is installed');
  const dispose=effect.run();const channel=channels.find(c=>c.name.startsWith('sanctum-party-notification'));
  channel.status('SUBSCRIBED');
  const update=(row,timestamp='2026-10-09T12:00:00Z')=>channel.callbacks.UPDATE({new:row,old:{id:row.id},commit_timestamp:timestamp});
  let disposed=false;
  const cleanup=()=>{if(disposed)return;disposed=true;dispose();globalThis.Date=RealDate;globalThis.window=previousWindow;globalThis.localStorage=previousStorage;};
  const tick=value=>{if(value)clock=RealDate.parse(value);for(const run of intervals.values())run();};
  const remove=id=>channel.callbacks.DELETE?.({old:{id}});
  return {states,reads,cleanup,update,remove,channel,release,store,tick,intervals,result};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));

test('actual notification hook routes a bus setting change to an owned character account with UUID members',async()=>{
  const f=setup();await flush();
  f.update({...before,memo:'길드 버스 새 공지',sub_content:'길드 버스 새 공지',time_start:'21:00'});
  assert.equal(f.states[0].length,1);assert.equal(f.states[0][0].type,'SYNAXIS · 길드 버스 변경');
  assert.match(f.states[0][0].title,/공지.*일정/);assert.equal(f.states[0][0].href,'/party#guild-bus-7');
  assert.ok(f.reads.some(r=>r.table==='characters'&&r.filters.some(([key,value])=>key==='owner'&&value==='내계정')));
  f.cleanup();
});

test('repeated events, ordinary completion/stat refresh and unregistered buses do not trigger setting alerts',async()=>{
  const f=setup();await flush();const changed={...before,memo:'길드 버스 새 공지'};
  f.update(changed);f.update(changed);
  f.update({...changed,members:[{...before.members[0],combat_power:999,is_completed:true,selection_order:8}]});
  f.update({...before,id:8,members:[{name:'타인'}],memo:'길드 버스 남의 공지'});
  assert.equal(f.states[0].length,1);f.cleanup();
});

test('removed participants are informed and events after cleanup are ignored',async()=>{
  const f=setup();await flush();f.update({...before,members:[]});
  assert.equal(f.states[0].length,1);assert.match(f.states[0][0].title,/참가/);
  f.cleanup();f.update({...before,memo:'길드 버스 늦은 공지'});
  assert.equal(f.states[0].length,1);
});

test('disconnected and pending initial read never announce historical settings as live changes',async()=>{
  const f=setup({holdRead:true});f.update({...before,memo:'길드 버스 읽기 전 변경'});
  assert.equal(f.states[0].length,0);f.cleanup();f.release();await flush();
  f.update({...before,memo:'길드 버스 종료 후 변경'});assert.equal(f.states[0].length,0);
});

test('reconnection resets baseline without replaying missed offline events',async()=>{
  const f=setup();await flush();f.channel.status('CHANNEL_ERROR');
  f.update({...before,memo:'길드 버스 단절 중 변경'});assert.equal(f.states[0].length,0);
  f.channel.status('SUBSCRIBED');await flush();f.update({...before,memo:'길드 버스 재연결 후 변경'});
  assert.equal(f.states[0].length,1);f.cleanup();
});

test('browser storage restrictions must not prevent in-session bus notifications',async()=>{
  const f=setup({storageBroken:true});await flush();f.update({...before,memo:'길드 버스 새 공지'});
  assert.equal(f.states[0].length,1);f.cleanup();
});

test('new or renamed owned characters get later notifications by account identity without polling',async()=>{
  const f=setup();await flush();
  const renamed={...before,members:[{...before.members[0],name:'새닉네임',character_name:'새닉네임',account_id:'uuid-account'}]};
  f.update(renamed,'2026-10-09T12:01:00Z');
  const readCount=f.reads.length;
  f.update({...renamed,memo:'길드 버스 이름 변경 후 공지'},'2026-10-09T12:02:00Z');
  assert.equal(f.states[0].length,2);assert.equal(f.reads.length,readCount);f.cleanup();
});

test('a different UUID account never receives a registered bus change alert',async()=>{
  const foreign={...before,members:[{name:'다른캐릭터',owner:'uuid-other',account_id:'uuid-other'}]};
  const f=setup({initialParty:foreign});await flush();
  f.update({...foreign,memo:'길드 버스 남의 공지'});assert.equal(f.states[0].length,0);f.cleanup();
});

const passengers=count=>Array.from({length:count},(_,i)=>({name:`승객${i}`,owner:`account-${i}`,time_start:'20:00',time_end:'23:59'}));
const managedBus={...before,max_members:4,leader_name:'내캐릭터',members:passengers(3)};
const readyAlerts=f=>f.states[0].filter(n=>n.type==='SYNAXIS · 길드 버스 출발');

test('4 and 8 eligible accounts notify only their bus operator, with card link and exact departure copy',async t=>{
  for(const size of [4,8]){
    const party={...managedBus,max_members:size,members:passengers(size-1)};
    const f=setup({role:'길드마스터',initialParty:party});t.after(f.cleanup);await flush();
    f.update({...party,members:passengers(size)});
    assert.equal(readyAlerts(f).length,1);
    assert.match(readyAlerts(f)[0].title,/길드버스 출발 가능합니다!/);
    assert.equal(readyAlerts(f)[0].href,'/party#guild-bus-7');
    f.cleanup();
  }
});

test('alts on the same account do not fill seats, and a non-repeat cleared entry does not count',async t=>{
  const f=setup({role:'부마스터',initialParty:managedBus});t.after(f.cleanup);await flush();
  const alt={name:'승객0부캐',owner:'account-0'};
  f.update({...managedBus,members:[...passengers(3),alt]});assert.equal(readyAlerts(f).length,0);
  const cleared={...passengers(4)[3],is_completed:true,allow_repeat:false};
  f.update({...managedBus,members:[...passengers(3),cleared]});assert.equal(readyAlerts(f).length,0);
  f.update({...managedBus,members:[...passengers(3),{...cleared,allow_repeat:true}]});
  assert.equal(readyAlerts(f).length,1);
});

test('time boundaries evaluate cached entries without additional database reads',async t=>{
  const party={...managedBus,members:passengers(4).map(p=>({...p,time_start:'21:30'}))};
  const f=setup({role:'master',initialParty:party});t.after(f.cleanup);await flush();const readCount=f.reads.length;
  f.tick('2026-10-09T12:29:00Z');assert.equal(readyAlerts(f).length,0);
  f.tick('2026-10-09T12:30:00Z');assert.equal(readyAlerts(f).length,1);
  f.tick('2026-10-09T12:31:00Z');assert.equal(readyAlerts(f).length,1);
  await flush();assert.equal(f.reads.length,readCount);
});

test('duplicate full events stay quiet but a fresh readiness episode and next round notify again',async t=>{
  const f=setup({role:'길드마스터',initialParty:managedBus});t.after(f.cleanup);await flush();
  const full={...managedBus,members:passengers(4)};
  f.update(full);f.update({...full,combat_power:999});f.tick();assert.equal(readyAlerts(f).length,1);
  f.update(managedBus);f.update(full);assert.equal(readyAlerts(f).length,2);
  f.update({...full,status:'운행중'});f.tick();assert.equal(readyAlerts(f).length,2);
  f.update(full);assert.equal(readyAlerts(f).length,3);
});

test('another moderator, ordinary member, ordinary party, ended bus and invalid seat count get no readiness alert',async t=>{
  for(const [role,overrides] of [['길드마스터',{leader_name:'다른운행자'}],['길드원',{}],['admin',{sub_content:'일반 파티',memo:'',party_type:'일반'}],['admin',{status:'종료됨'}],['admin',{max_members:5}]]){
    const party={...managedBus,...overrides};const f=setup({role,initialParty:party});t.after(f.cleanup);await flush();
    f.update({...party,members:passengers(8)});f.tick();assert.equal(readyAlerts(f).length,0);f.cleanup();
  }
});

test('initial full snapshots, disconnected timers and cleaned-up events never replay readiness alerts',async t=>{
  const full={...managedBus,members:passengers(4)};
  const f=setup({role:'길드마스터',initialParty:full});t.after(f.cleanup);await flush();
  f.tick();f.update(full);assert.equal(readyAlerts(f).length,0);
  f.update(managedBus);f.channel.status('CHANNEL_ERROR');f.update(full);f.tick();assert.equal(readyAlerts(f).length,0);
  f.channel.status('SUBSCRIBED');await flush();f.tick();assert.equal(readyAlerts(f).length,0);
  f.update(managedBus);f.cleanup();f.update(full);f.tick();assert.equal(readyAlerts(f).length,0);
  assert.equal(f.intervals.size,0);
});

test('legacy time aliases and midnight windows share the existing eligibility rules',async t=>{
  const party={...managedBus,party_date:'2026-10-09',time_start:'23:00',time_end:'02:00',members:passengers(4).map(p=>({...p,time_start:undefined,time_end:undefined,startTime:'00:30',endTime:'01:30'}))};
  const f=setup({role:'SUB_MASTER',initialParty:party,now:'2026-10-09T14:30:00Z'});t.after(f.cleanup);await flush();
  f.tick('2026-10-09T15:29:00Z');assert.equal(readyAlerts(f).length,0);
  f.tick('2026-10-09T15:30:00Z');assert.equal(readyAlerts(f).length,1);
});

test('unknown account identities are not guessed from character names',async t=>{
  const f=setup({role:'길드마스터',initialParty:managedBus});t.after(f.cleanup);await flush();
  f.update({...managedBus,members:[...passengers(3),{name:'소유미확인'}]});assert.equal(readyAlerts(f).length,0);
  f.update({...managedBus,members:passengers(4)});assert.equal(readyAlerts(f).length,1);
});

test('deleted buses cannot announce departure when their time window starts',async t=>{
  const party={...managedBus,members:passengers(4).map(p=>({...p,time_start:'21:30'}))};
  const f=setup({role:'길드마스터',initialParty:party});t.after(f.cleanup);await flush();
  f.remove(party.id);f.tick('2026-10-09T12:30:00Z');assert.equal(readyAlerts(f).length,0);
});

test('a deletion during baseline loading cannot restore a deleted bus from an older read',async t=>{
  const party={...managedBus,members:passengers(4).map(p=>({...p,time_start:'21:30'}))};
  const f=setup({role:'길드마스터',initialParty:party,holdRead:true});t.after(f.cleanup);
  f.remove(party.id);f.release();await flush();f.tick('2026-10-09T12:30:00Z');assert.equal(readyAlerts(f).length,0);
});

test('one account represented by UUID and nickname aliases never becomes two seats',async t=>{
  const f=setup({role:'길드마스터',initialParty:managedBus});t.after(f.cleanup);await flush();
  const verified=passengers(4).map((p,i)=>({...p,owner:`00000000-0000-4000-8000-00000000000${i}`}));
  const mixed=[...verified.slice(0,2),{name:'주캐릭터',account_id:verified[2].owner,owner:'세번째계정',owner_account:verified[2].owner},
    {name:'부캐릭터',owner:'세번째계정'}];
  f.update({...managedBus,members:mixed});assert.equal(readyAlerts(f).length,0);
  f.update({...managedBus,members:[...mixed,verified[3]]});assert.equal(readyAlerts(f).length,1);
});

test('unlinked legacy names in UUID rows are not guessed into an additional account',async t=>{
  const f=setup({role:'길드마스터',initialParty:managedBus});t.after(f.cleanup);await flush();
  const verified=passengers(4).map((p,i)=>({...p,account_id:`a0000000-0000-4000-8000-00000000000${i}`,owner:undefined}));
  f.update({...managedBus,members:[...verified.slice(0,3),{name:'미연결부캐',owner:'추측할수없는계정'}]});
  assert.equal(readyAlerts(f).length,0);
  f.update({...managedBus,members:verified});assert.equal(readyAlerts(f).length,1);
});

test('the alert uses the same leader permission as the card, without inventing UUID-only management',async t=>{
  const party={...managedBus,leader_name:'uuid-account'};
  const f=setup({role:'길드마스터',initialParty:party});t.after(f.cleanup);await flush();
  f.update({...party,members:passengers(4)});assert.equal(readyAlerts(f).length,0);
});

test('baseline live rows are merged quietly, not overwritten by a slow initial snapshot',async t=>{
  const future={...managedBus,members:passengers(3)};
  const f=setup({role:'길드마스터',initialParty:future,holdRead:true});t.after(f.cleanup);
  f.update({...future,members:passengers(4)});f.release();await flush();f.tick();assert.equal(readyAlerts(f).length,0);
  f.update({...future,members:passengers(4)});assert.equal(readyAlerts(f).length,0);
  f.update(future);f.update({...future,members:passengers(4)});assert.equal(readyAlerts(f).length,1);
});

test('a newly created ready bus is routed to its operator through the existing channel',async t=>{
  const f=setup({role:'길드마스터',initialParty:managedBus});t.after(f.cleanup);await flush();
  f.channel.callbacks.INSERT({new:{...managedBus,id:9,members:passengers(4)}});
  assert.equal(readyAlerts(f).length,1);assert.equal(readyAlerts(f)[0].href,'/party#guild-bus-9');
});

test('muted Synaxis settings suppress departure alerts as well as the existing notifications',async t=>{
  const f=setup({role:'길드마스터',initialParty:managedBus});t.after(f.cleanup);await flush();
  f.result.setModuleEnabled('synaxis',false);f.update({...managedBus,members:passengers(4)});
  assert.equal(readyAlerts(f).length,0);assert.equal(f.states[0].length,0);
});

test('management handover alerts the newly assigned operator only',async t=>{
  const full={...managedBus,leader_name:'다른관리자',members:passengers(4)};
  const f=setup({role:'길드마스터',initialParty:full});t.after(f.cleanup);await flush();
  f.update({...full,leader_name:'내캐릭터'});assert.equal(readyAlerts(f).length,1);
  f.update(full);f.update({...full,members:passengers(8)});assert.equal(readyAlerts(f).length,1);
});
