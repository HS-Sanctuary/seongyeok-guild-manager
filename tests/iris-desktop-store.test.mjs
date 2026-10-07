import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {loadTS} from './load-ts.mjs';
const create=existsSync('lib/irisDesktopStore.ts')?loadTS('lib/irisDesktopStore.ts').createDesktopStore:undefined;
function setup(timeoutMs=100){
  assert.equal(typeof create,'function','Missing protected queue client');let context={epoch:2,environment:'development'};const listeners=new Set(),sent=[];
  const channel={postMessage:v=>sent.push(structuredClone(v)),addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn)};
  const store=create({channel,context:()=>context,environment:'development',timeoutMs});
  return {store,sent,reply:data=>{for(const fn of [...listeners])fn({data});},change:v=>context=v,listeners};
}
test('protected store sends only schema queue data and correlates native replies',async()=>{
  const s=setup();const pending=s.store.replace({schemaVersion:2,entries:[]});
  assert.deepEqual(s.sent,[{version:1,id:'1',epoch:2,method:'store.replace',payload:{schemaVersion:2,entries:[]}}]);
  s.reply({version:1,id:'other',epoch:2,ok:true,value:null});assert.equal(s.listeners.size,1);
  s.reply({version:1,id:'1',epoch:2,ok:true,value:null});await pending;assert.equal(s.listeners.size,0);
});
test('native v1 response is never accepted as the active queue format',async()=>{
  const s=setup();const pending=s.store.load();s.reply({version:1,id:'1',epoch:2,ok:true,value:{schemaVersion:1,entries:[]}});
  await assert.rejects(pending);
  const next=s.store.load();s.reply({version:1,id:'2',epoch:2,ok:true,value:{schemaVersion:2,entries:[]}});
  assert.deepEqual(await next,{schemaVersion:2,entries:[]});
});
test('native failures never become a successful empty restored queue',async()=>{
  const s=setup();const pending=s.store.load();s.reply({version:1,id:'1',epoch:2,ok:false,error:'protected_store_unavailable'});
  await assert.rejects(pending);assert.equal(s.listeners.size,0);
});
test('navigation epoch change rejects late native response and environment mismatch sends nothing',async()=>{
  const s=setup();const pending=s.store.load();s.change({epoch:3,environment:'development'});
  s.reply({version:1,id:'1',epoch:2,ok:true,value:{schemaVersion:1,entries:[]}});await assert.rejects(pending);
  s.change({epoch:3,environment:'production'});await assert.rejects(s.store.load());assert.equal(s.sent.length,1);
});
test('missing native response times out without fallback persistence',async()=>{
  const s=setup(5);await assert.rejects(s.store.load());assert.equal(s.sent.length,1);assert.equal(s.listeners.size,0);
});
test('overlay client uses bounded correlated requests and rejects malformed state',async()=>{
  const s=setup();assert.equal(typeof s.store.overlayState,'function','Missing overlay control client');
  const p=s.store.setClickThrough(true);assert.equal(s.sent[0].method,'overlay.input');assert.deepEqual(s.sent[0].payload,{clickThrough:true});
  s.reply({version:1,id:'1',epoch:2,ok:true,value:{clickThrough:true,shortcutsAvailable:true,opacityPercent:100}});
  assert.equal((await p).clickThrough,true);
  await assert.rejects(s.store.setOpacityPercent(49));assert.equal(s.sent.length,1);
  const state=s.store.overlayState();s.reply({version:1,id:'2',epoch:2,ok:true,value:{clickThrough:true,shortcutsAvailable:false,opacityPercent:100}});
  await assert.rejects(state);
});
