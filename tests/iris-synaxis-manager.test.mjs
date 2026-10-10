import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {NextRequest} from 'next/server.js';
import {loadTS} from './load-ts.mjs';
import {memoryDB} from './memory-db.mjs';

function fixture(t){
  const old={window:globalThis.window,localStorage:globalThis.localStorage};
  const store=new Map([['nexus_user',JSON.stringify({id:'WRONG',nickname:'other',role:'길드마스터'})]]);
  const queries=[],channels=[],removed=[],effects=[],slots=[];let cursor=0,pending=null;
  globalThis.localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};
  globalThis.window={addEventListener:()=>{},removeEventListener:()=>{},setTimeout,clearTimeout};
  t.after(()=>{for(const slot of slots)slot?.cleanup?.();Object.assign(globalThis,old);});
  const react={...React,useState:init=>{const i=cursor++;if(!slots[i])slots[i]={value:typeof init==='function'?init():init};return [slots[i].value,v=>slots[i].value=typeof v==='function'?v(slots[i].value):v];},useRef:init=>{const i=cursor++;return (slots[i]??={current:init});},useMemo:fn=>fn(),useCallback:fn=>fn,
    useEffect:(fn,deps)=>{const i=cursor++,slot=slots[i]??={};if(!slot.deps||deps.some((d,n)=>!Object.is(d,slot.deps[n]))){slot.cleanup?.();slot.deps=deps;effects.push(()=>slot.cleanup=fn());}}};
  const characters=[{id:1,nickname:'mine',owner:'owner',job:'전사'},{id:2,nickname:'notMine',owner:'other',job:'힐러'}];
  const db={from:table=>{queries.push(table);const q={select:()=>q,order:()=>q,neq:()=>q,then:resolve=>(pending??Promise.resolve({data:table==='characters'?characters:[],error:null})).then(resolve)};return q;},channel:name=>{channels.push(name);const c={on:()=>c,subscribe:()=>c};return c;},removeChannel:c=>removed.push(c)};
  const {usePartyManager}=loadTS('hooks/usePartyManager.ts',{react,'@/lib/supabase':{supabase:db},'@/hooks/usePartyCatalog':{usePartyCatalog:()=>({classes:[],contents:[],powerReqs:[],loaded:true,error:null}),refreshPartyCatalog:async()=>{}}});
  let surface={account:{id:'A',nickname:'owner',role:'길드원'},active:true,locked:false,request:async()=>new Response('{}')};
  const render=()=>{cursor=0;const result=usePartyManager(surface);for(const effect of effects.splice(0))effect();return result;};
  return {render,queries,channels,removed,store,disable:()=>{surface={...surface,active:false};},enable:()=>{surface={...surface,active:true};},token:v=>{surface={...surface,refreshToken:v};},delay:()=>{let finish;pending=new Promise(r=>finish=r);return finish;}};
}
const tick=()=>new Promise(r=>setImmediate(r));
test('reactivation consumes an existing refresh token with only one party read',async t=>{
  const f=fixture(t);f.token(5);f.disable();f.render();await tick();
  f.enable();f.render();await tick();
  assert.equal(f.queries.filter(x=>x==='parties').length,1);
});
test('IRIS uses supplied account, own characters and own draft rather than nexus_user',async t=>{
  const f=fixture(t);f.store.set('iris_party_draft:v1:A',JSON.stringify({partyMemo:'own draft'}));f.store.set('sanctum_party_draft',JSON.stringify({partyMemo:'wrong draft'}));
  f.render();await tick();const manager=f.render();
  assert.equal(manager.user?.nickname,'owner');assert.equal(manager.isAdmin,false);
  assert.deepEqual(manager.myCharacterNames,['mine']);assert.equal(manager.partyMemo,'own draft');
});
test('IRIS list delegates channel to session provider and ignores pending response when hidden',async t=>{
  const f=fixture(t),finish=f.delay();f.render();assert.equal(f.channels.length,0);
  f.disable();f.render();assert.equal(f.removed.length,0);
  finish({data:[{id:9,nickname:'late',owner:'owner',members:[]}],error:null});await tick();
  assert.deepEqual(f.render().myCharacterNames,[]);
});
test('IRIS mounted inactive neither fetches nor subscribes',async t=>{
  const f=fixture(t);f.disable();f.render();await tick();assert.equal(f.queries.length,0);assert.equal(f.channels.length,0);
});
test('completion endpoint rejects switched cookie account before any DB operation',async()=>{
  const db=memoryDB({parties:[],characters:[]});
  const {POST}=loadTS('app/api/parties/sync-checklist/route.ts',{'@/lib/server/sanctumSession':{getSessionAccount:async()=>({id:'B',nickname:'other',role:'길드마스터'}),isPendingAccount:()=>false,getServerSupabase:()=>db,SANCTUM_SESSION_COOKIE:'session'}});
  const result=await POST(new NextRequest('http://fixture.test/api/parties/sync-checklist',{method:'POST',body:JSON.stringify({expectedAccountId:'A',partyId:1,completedNames:[]})}));assert.equal(result.status,403);assert.equal(db.writes.length,0);
});
