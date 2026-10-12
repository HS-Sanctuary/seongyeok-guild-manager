import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTS} from './load-ts.mjs';
const {createDesktopStore}=loadTS('lib/irisDesktopStore.ts');
function setup(){let context={epoch:2,environment:'development'};const listeners=new Set(),sent=[];
 const store=createDesktopStore({channel:{postMessage:m=>sent.push(m),addEventListener:(_,f)=>listeners.add(f),removeEventListener:(_,f)=>listeners.delete(f)},context:()=>context,environment:'development',timeoutMs:100});
 return {store,sent,change:()=>context={epoch:3,environment:'development'},reply:value=>{for(const f of [...listeners])f({data:{version:1,id:sent.at(-1).id,epoch:2,ok:true,value}});}};
}
test('installed font methods read fixed name lists without file arguments',async()=>{
 const s=setup();assert.equal(typeof s.store.fonts,'function','installed font lookup is unavailable');
 const p=s.store.fonts();assert.deepEqual(s.sent[0],{version:1,id:'1',epoch:2,method:'window.fonts.list',payload:null});s.reply({fonts:['Segoe UI','맑은 고딕']});assert.deepEqual(await p,['Segoe UI','맑은 고딕']);
 const r=s.store.refreshFonts();assert.equal(s.sent[1].method,'window.fonts.refresh');s.reply({fonts:[]});assert.deepEqual(await r,[]);
});
test('installed font lists reject unsafe, oversized, duplicated and stale replies',async()=>{
 for(const value of [{fonts:['x'],path:'C:/fonts'},{fonts:['https://evil']},{fonts:['x\n']},{fonts:['x'.repeat(81)]},{fonts:['x','x']},{fonts:Array.from({length:2049},(_,i)=>`Font ${i}`)},null]){
  const s=setup();assert.equal(typeof s.store.fonts,'function');const p=s.store.fonts();s.reply(value);await assert.rejects(p);
 }
 const s=setup();const p=s.store.fonts();s.change();s.reply({fonts:['Segoe UI']});await assert.rejects(p);
});
