import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {NextRequest} from 'next/server.js';
import {loadTS} from './load-ts.mjs';
import {memoryDB} from './memory-db.mjs';

const characters=[{nickname:'driver',owner:'operator'},{nickname:'alt',owner:'participant'}];
const expired={id:7,party_type:'길드버스',content_name:'레이드 - 카브락',leader_name:'driver',status:'모집중',party_date:'2000-01-01',time_start:'20:00',time_end:'23:59',members:[{character_name:'driver',owner:'operator'},{character_name:'alt',owner:'participant'}]};

// Runs production hook callbacks; replaces only React scheduling and external IO.
function fixture(t,account,parties=[expired]) {
  const old={window:globalThis.window,localStorage:globalThis.localStorage,alert:globalThis.alert};
  const listeners=new Map(),alerts=[],mutations=[],states=[],refs=[];
  const storage=new Map([['nexus_user',JSON.stringify(account)]]);
  globalThis.window={addEventListener:(name,fn)=>listeners.set(name,fn),removeEventListener:()=>{}};
  globalThis.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};
  globalThis.alert=message=>alerts.push(message);
  t.after(()=>Object.assign(globalThis,old));
  let stateIndex=0,refIndex=0,initial=true; const effects=[];
  const react={...React,useState:value=>{
    const index=stateIndex++;
    if(!(index in states)) states[index]=typeof value==='function'?value():value;
    return [states[index],next=>states[index]=typeof next==='function'?next(states[index]):next];
  },useMemo:fn=>fn(),useCallback:fn=>fn,
  useEffect:fn=>{if(initial) effects.push(fn);}};
  // Each useRef has its own stable slot, including rerenders.
  react.useRef=value=>{const index=refIndex++;return refs[index]??(refs[index]={current:value});};
  const data={parties,characters};
  const supabase={from:table=>{
    const query={select:()=>query,order:()=>query,neq:()=>query,then:done=>Promise.resolve({data:structuredClone(data[table]),error:null}).then(done)};
    return query;
  },channel:()=>{const channel={on:()=>channel,subscribe:()=>channel};return channel;},removeChannel:()=>{}};
  const {usePartyManager}=loadTS('hooks/usePartyManager.ts',{react,'@/lib/supabase':{supabase},
    '@/lib/memberMutationClient':{memberMutationOrThrow:async input=>mutations.push(input)},
    '@/hooks/usePartyCatalog':{usePartyCatalog:()=>({classes:[],contents:[],powerReqs:[],loaded:true,error:null}),refreshPartyCatalog:async()=>{}}});
  const render=()=>{stateIndex=0;refIndex=0;return usePartyManager();};
  let manager=render(); for(const effect of effects) effect(); initial=false;
  return {data,alerts,mutations,render,listeners,refresh:async()=>{await manager.fetchData(account.nickname);manager=render();return manager;}};
}

for(const [name,account,leader,want] of [
  ['ordinary participant',{nickname:'participant',role:'길드원'},'driver',false],
  ['non-operating guild master participant',{nickname:'participant',role:'길드마스터'},'driver',false],
  ['unrelated admin',{nickname:'outsider',role:'부마스터'},'driver',false],
  ['operator account name',{nickname:'operator',role:'부마스터'},'operator',true],
  ['operator owned character',{nickname:'operator',role:'부마스터 대행'},'driver',true],
  ['non-admin character owner',{nickname:'operator',role:'길드원'},'driver',false],
]) test(`expired guild bus prompts only authorized current operator: ${name}`,async t=>{
  const f=fixture(t,account,[{...expired,leader_name:leader}]);
  assert.equal(Boolean((await f.refresh()).timeoutParty),want);
  assert.equal(f.mutations.length,0);
});

test('ordinary expired party still prompts its participant',async t=>{
  const f=fixture(t,{nickname:'participant',role:'길드원'},[{...expired,party_type:'1회 클리어'}]);
  assert.equal((await f.refresh()).timeoutParty?.id,7);
});

test('current operator still receives notice when their leader character is not a participant',async t=>{
  const f=fixture(t,{nickname:'operator',role:'부마스터'},[{...expired,members:[]}]);
  assert.equal((await f.refresh()).timeoutParty?.id,7);
});

test('realtime handoff clears former operator expiry prompt',async t=>{
  const f=fixture(t,{nickname:'operator',role:'부마스터'});
  assert.equal((await f.refresh()).timeoutParty?.id,7);
  f.data.parties=[{...expired,leader_name:'alt'}];
  assert.equal((await f.refresh()).timeoutParty,null);
});

test('Escape dismisses same expired schedule across subsequent realtime refresh',async t=>{
  const f=fixture(t,{nickname:'operator',role:'부마스터'});
  assert.equal((await f.refresh()).timeoutParty?.id,7);
  f.listeners.get('keydown')({key:'Escape'});
  assert.equal(f.render().timeoutParty,null);
  assert.equal((await f.refresh()).timeoutParty,null);
  f.data.parties=[{...expired,time_end:'23:00'}];
  assert.equal((await f.refresh()).timeoutParty?.id,7,'changed schedule may prompt again');
});

for(const [action,payload] of [['30M',{time_end:'00:29'}],['1H',{time_end:'00:59'}],['TOMORROW',{party_date:'2126-10-11'}],['CANCEL',undefined]]) {
  for(const [nickname,role,allowed] of [['operator','부마스터',true],['participant','길드마스터',false]]) {
    test(`existing server preserves ${action} permission for ${nickname}`,async()=>{
      const db=memoryDB({characters,parties:[expired]});
      const {POST}=loadTS('app/api/member-mutations/route.ts',{'@/lib/server/sanctumSession':{
        getServerSupabase:()=>db,getSessionAccount:async()=>({nickname,role}),isPendingAccount:()=>false,SANCTUM_SESSION_COOKIE:'session',
      }});
      const response=await POST(new NextRequest('http://fixture.test/api/member-mutations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({table:'parties',action:action==='CANCEL'?'delete':'update',filter:{column:'id',value:7},payload})}));
      assert.equal(response.status,allowed?200:403,await response.text());
      if(!allowed) assert.equal(db.tables.parties.length,1);
      if(allowed&&payload) for(const [key,value] of Object.entries(payload)) assert.equal(db.tables.parties[0][key],value);
      if(allowed&&!payload) assert.equal(db.tables.parties.length,0);
      if(!allowed) assert.deepEqual(db.tables.parties[0],expired);
    });
  }
}
