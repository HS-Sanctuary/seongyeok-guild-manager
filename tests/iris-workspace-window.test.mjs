import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTS} from './load-ts.mjs';
const {createDesktopStore}=loadTS('lib/irisDesktopStore.ts');
test('workspace window sends only explicit boolean mode and rejects malformed or stale responses',async()=>{
 const sent=[],listeners=new Set();let epoch=2;
 const store=createDesktopStore({environment:'development',context:()=>({epoch,environment:'development'}),channel:{postMessage:v=>sent.push(v),addEventListener:(_,f)=>listeners.add(f),removeEventListener:(_,f)=>listeners.delete(f)},timeoutMs:100});
 const reply=value=>{for(const f of [...listeners])f({data:{version:1,id:sent.at(-1).id,epoch:2,ok:true,value}});};
 const pending=store.setWorkspace(true);assert.deepEqual(sent.at(-1).payload,{expanded:true});assert.equal(sent.at(-1).method,'window.workspace');reply({expanded:true});assert.deepEqual(await pending,{expanded:true});
 await assert.rejects(store.setWorkspace(1240));assert.equal(sent.length,1,'arbitrary sizes must never reach native');
 const bad=store.setWorkspace(false);reply({expanded:false,width:1240});await assert.rejects(bad);
 const stale=store.setWorkspace(true);epoch=3;reply({expanded:true});await assert.rejects(stale);
});
