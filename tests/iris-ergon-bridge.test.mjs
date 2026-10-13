import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTS} from './load-ts.mjs';
function setup(){const requests=[],listeners=new Set();let epoch=1;const channel={addEventListener(_,f){listeners.add(f)},removeEventListener(_,f){listeners.delete(f)},postMessage(m){requests.push(m);queueMicrotask(()=>{const value=m.method==='game.life.capabilities'?{schemaVersion:1,readOnly:true,kinds:['activity','inventory','works','materials','gathering','altering','crafting']}:{schemaVersion:1,kind:'gathering',observedAt:1000,source:'official-cli',data:{items:[{name:'통나무',toolOk:true}]}};for(const f of listeners)f({data:{version:1,id:m.id,epoch:m.epoch,ok:true,value}})})}};const store=loadTS('lib/irisDesktopStore.ts').createDesktopStore({channel,environment:'development',context:()=>({epoch,environment:'development'})});return {store,requests,nextEpoch(){epoch++}};}
test('life reads negotiate a separate capability, send only a kind, and recheck a new epoch',async()=>{
  const f=setup();assert.equal(typeof f.store.readLife,'function');
  const snapshot=await f.store.readLife('gathering');assert.deepEqual(snapshot.data.items,[{name:'통나무',toolOk:true}]);
  assert.deepEqual(f.requests.map(m=>m.method),['game.life.capabilities','game.life.read']);assert.deepEqual(f.requests[1].payload,{kind:'gathering'});
  await f.store.readLife('gathering');assert.equal(f.requests.filter(m=>m.method==='game.life.capabilities').length,1);
  f.nextEpoch();await f.store.readLife('gathering');assert.equal(f.requests.filter(m=>m.method==='game.life.capabilities').length,2);
});
test('recreated browser store keeps native request sequence monotonic on the same channel',async()=>{
 const listeners=new Set();let last=0;const channel={addEventListener(_,fn){listeners.add(fn)},removeEventListener(_,fn){listeners.delete(fn)},postMessage(message){const ok=Number(message.id)>last;if(ok)last=Number(message.id);queueMicrotask(()=>{for(const fn of listeners)fn({data:{version:1,id:message.id,epoch:message.epoch,ok,value:null}})});}};
 const create=()=>loadTS('lib/irisDesktopStore.ts').createDesktopStore({channel,environment:'development',context:()=>({epoch:1,environment:'development'})});
 await create().hide();await create().close();assert.equal(last,2);
});
test('unknown or action-like life kinds are blocked before native IO',async()=>{
  const f=setup();assert.equal(typeof f.store.readLife,'function');
  for(const kind of ['execute_gathering','stop_action','../items',null])await assert.rejects(f.store.readLife(kind));assert.equal(f.requests.length,0);
});
