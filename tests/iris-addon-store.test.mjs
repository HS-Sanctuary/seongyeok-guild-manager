import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTS} from './load-ts.mjs';
const module=loadTS('lib/irisDesktopStore.ts');
const state={dockSide:'right',sameLayer:true,tracked:false,actualSide:'off',status:'searching',persistent:true};
function setup(){let context={epoch:2,environment:'development'};const listeners=new Set(),sent=[];
 const channel={postMessage:m=>sent.push(m),addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn)};
 return {store:module.createDesktopStore({channel,context:()=>context,environment:'development',timeoutMs:100}),sent,
 reply:value=>{for(const fn of [...listeners])fn({data:{version:1,id:String(sent.length),epoch:2,ok:true,value}});},change:c=>context=c};
}
test('addon requests contain only fixed methods and bounded preferences',async()=>{
 const s=setup();assert.equal(typeof s.store.addonState,'function');
 const p=s.store.addonState();assert.equal(s.sent[0].method,'window.addon.state');assert.equal(s.sent[0].payload,null);s.reply(state);assert.deepEqual(await p,state);
 const update=s.store.setAddonPreferences({dockSide:'left',sameLayer:false});assert.deepEqual(s.sent[1].payload,{dockSide:'left',sameLayer:false});s.reply({...state,dockSide:'left',sameLayer:false});await update;
 for(const bad of [{dockSide:'anything',sameLayer:true},{dockSide:'off',sameLayer:'true'},{dockSide:'right',sameLayer:true,handle:1}])await assert.rejects(s.store.setAddonPreferences(bad));assert.equal(s.sent.length,2);
 for(const [name,method,payload]of [['drag','window.drag',null],['minimize','window.minimize',null],['setCloseDecision','window.decision',{open:true}]]){const result=name==='setCloseDecision'?s.store[name](true):s.store[name]();assert.equal(s.sent.at(-1).method,method);assert.deepEqual(s.sent.at(-1).payload,payload);s.reply(null);await result;}
});
test('malformed addon state and stale reply are refused',async()=>{
 for(const invalid of [{...state,handle:42},{...state,status:'command'},{...state,sameLayer:1},{...state,actualSide:'right',status:'attached',tracked:false}]){const s=setup();const p=s.store.addonState();s.reply(invalid);await assert.rejects(p);}
 const s=setup();const p=s.store.addonState();s.change({epoch:3,environment:'development'});s.reply(state);await assert.rejects(p);
});
test('native addon and close events require current epoch and environment with exact fields',()=>{
 assert.equal(typeof module.parseDesktopWindowEvent,'function');
 const context={epoch:2,environment:'development'},close={version:1,kind:'window.close.request',epoch:2,environment:'development',reason:'game-exit'};
 assert.deepEqual(module.parseDesktopWindowEvent(close,context),{kind:'window.close.request',reason:'game-exit'});
 for(const bad of [{...close,epoch:1},{...close,environment:'production'},{...close,reason:'unknown'},{...close,hwnd:1}])assert.equal(module.parseDesktopWindowEvent(bad,context),null);
 assert.deepEqual(module.parseDesktopWindowEvent({...close,kind:'window.addon.changed',reason:undefined,state},context),null);
 assert.deepEqual(module.parseDesktopWindowEvent({version:1,kind:'window.addon.changed',epoch:2,environment:'development',state},context),{kind:'window.addon.changed',state});
});
