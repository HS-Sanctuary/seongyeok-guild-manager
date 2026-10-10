import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {loadTS} from './load-ts.mjs';
const A={environment:'development',accountId:'account',characterId:'A'},B={...A,characterId:'B'};
const key={tradeId:'1',scope:'account',periodKey:'2026-10-04T21:00:00.000Z',catalogKey:'a'.repeat(64),baseRecords:[{characterId:'A',recordKey:'b'.repeat(64)},{characterId:'B',recordKey:'b'.repeat(64)}]};
const row={id:'1',map:'티르코네일',npc:'데이안',reward:'우유',rewardCount:2,cost:'양털',costCount:5,total:3,resetType:'주간',scope:'account',completed:3,completedBy:'가나',periodKey:key.periodKey,consistent:true};
const detail=id=>({accountId:'account',characterId:id,observedAt:'2026-10-08T22:00:00.000Z',details:{schemaVersion:1,tasks:{daily:[],weekly:[],abyss:[],raid:[]},classes:[],barter:[structuredClone(row)]},writeContext:{periodKeys:{daily:key.periodKey,weekly:key.periodKey,abyss:key.periodKey,raid:key.periodKey},classes:[],barter:[structuredClone(key)]}});
function queueSetup(){let clock=0,seq=0;const queue=loadTS('lib/irisDesktopQueue.ts').createDesktopQueue({environment:'development',now:()=>clock,id:()=>`00000000-0000-4000-8000-${String(++seq).padStart(12,'0')}`});return {queue,at:value=>clock=value};}
test('barter coalesces shared account intent across characters and retains first digest baseline',()=>{
  const {queue,at}=queueSetup();assert.equal(typeof queue.editBarter,'function','Missing protected barter queue');
  queue.editBarter(A,key,3,2);at(1000);queue.editBarter(B,key,2,1);
  const entries=queue.snapshot().entries;assert.equal(queue.snapshot().schemaVersion,3);assert.equal(entries.length,1);assert.equal(entries[0].characterId,'B');assert.equal(entries[0].baseCompleted,3);assert.equal(entries[0].desiredCompleted,1);
  assert.equal(queue.due('other').length,0);at(15999);assert.equal(queue.due('account').length,0);at(16000);assert.equal(queue.due('account').length,1);
  queue.editBarter(A,key,1,3);assert.equal(queue.snapshot().entries.length,0);
});
test('barter inflight successor takes acknowledged digests and unknown retry preserves original intent',()=>{
  const {queue}=queueSetup();assert.equal(typeof queue.editBarter,'function');queue.editBarter(A,key,3,2);queue.saveNow(A);
  const sent=queue.claim(queue.due('account')[0].requestId);queue.editBarter(B,key,2,1);
  const records=key.baseRecords.map(r=>({...r,recordKey:'c'.repeat(64)}));queue.settle(sent.requestId,{kind:'saved',completed:2,baseRecords:records});
  assert.equal(queue.snapshot().entries[0].baseCompleted,2);assert.deepEqual(queue.snapshot().entries[0].baseRecords,records);
  queue.saveNow(B);const second=queue.claim(queue.due('account')[0].requestId);queue.settle(second.requestId,{kind:'unknown'});
  assert.equal(queue.due('account').length,0);queue.recover(second.requestId,'retry');assert.equal(queue.due('account')[0].desiredCompleted,1);
});
test('barter snapshot digest fields reject corruption and legacy task/class queues migrate without replay',()=>{
  const {queue}=queueSetup();assert.equal(typeof queue.editBarter,'function');queue.editBarter(A,key,3,2);const old=queue.snapshot();
  for(const mutate of [e=>e.catalogKey='bad',e=>e.baseRecords.push({...e.baseRecords[0]}),e=>e.scope='other',e=>e.scope='character',e=>e.characterId='C',e=>e.cookie='bad']){
    const bad=structuredClone(old);mutate(bad.entries[0]);assert.throws(()=>queue.restore(bad));assert.deepEqual(queue.snapshot(),old);
  }
  const legacy={schemaVersion:2,entries:[{...A,kind:'class',classId:'1',baseLevel:null,desiredLevel:65,requestId:'00000000-0000-4000-8000-000000000009',revision:1,deadlineAt:0,phase:'pending'}]};
  queue.restore(legacy);assert.equal(queue.snapshot().schemaVersion,3);assert.equal(queue.snapshot().entries[0].desiredLevel,65);assert.equal(queue.snapshot().entries[0].phase,'unknown');assert.equal(queue.due('account').length,0);
});
test('controller does not acknowledge a mixed shared copy and retries only on explicit recovery',async()=>{
  const {queue,at}=queueSetup();let writes=0,current=detail('A');const snapshots=[];
  const transport={session:async()=>({id:'account',nickname:'owner',role:'길드원'}),characters:async()=>[{id:'A',nickname:'가나',job:'전사',alias:null},{id:'B',nickname:'다라',job:'전사',alias:null}],details:async(_,id)=>({...structuredClone(current),characterId:id}),save:async()=>{writes++;return {kind:'unknown'};}};
  const c=loadTS('lib/irisDesktopController.ts').createDesktopController({queue,transport,environment:'development',store:{load:async()=>null,replace:async s=>snapshots.push(s)}});
  await c.start();await c.selectCharacter('A');assert.equal(typeof c.editBarter,'function','Missing authenticated barter controller');await c.editBarter(key,3,2);at(15000);await c.tick();assert.equal(writes,1);
  current.details.barter[0].completed=2;current.details.barter[0].consistent=false;
  current.writeContext.barter[0].baseRecords[0].recordKey='c'.repeat(64);
  await c.refresh();at(30000);await c.tick();assert.equal(writes,1);assert.equal(c.state().queue.entries[0].phase,'unknown');
  await c.recover(c.state().queue.entries[0].requestId,'retry');assert.equal(writes,2);assert.equal(c.state().queue.entries[0].phase,'unknown');assert.ok(snapshots.some(s=>s.entries.some(e=>e.phase==='inflight')));
});
test('barter transport validates every baseline and sends only the approved dedicated edit',async()=>{
  const {createDesktopTransport:create}=loadTS('lib/irisDesktopTransport.ts');let sent;
  const e={...A,...key,kind:'barter',baseCompleted:3,desiredCompleted:2,requestId:'00000000-0000-4000-8000-000000000001',revision:1,deadlineAt:0,phase:'inflight'};
  const transport=create({fetch:async(path,init)=>{sent={path,body:JSON.parse(init.body)};return {ok:true,json:async()=>({result:{requestId:e.requestId,status:'saved',completed:2,completedBy:'가나',baseRecords:key.baseRecords}})};}});
  assert.deepEqual(await transport.save(e),{kind:'saved',completed:2,completedBy:'가나',baseRecords:key.baseRecords});assert.equal(sent.path,'/api/iris/barter');assert.equal(sent.body.edit.kind,undefined);assert.equal(sent.body.edit.accountId,'account');
  const bad=create({fetch:async()=>({ok:true,json:async()=>({result:{requestId:e.requestId,status:'saved',completed:2,baseRecords:[]}})})});assert.equal((await bad.save(e)).kind,'unknown');
});
test('barter transport safely supports missing older details and rejects duplicate copy fingerprints',async()=>{
  const {createDesktopTransport:create}=loadTS('lib/irisDesktopTransport.ts');const v=detail('A');
  const fetch=async()=>({ok:true,json:async()=>v});const received=await create({fetch}).details('account','A');assert.ok(Array.isArray(received.details.barter),'Barter details were lost by transport');assert.equal(received.details.barter[0].completed,3);
  v.writeContext.barter[0].baseRecords.push({...v.writeContext.barter[0].baseRecords[0]});await assert.rejects(()=>create({fetch}).details('account','A'));
  delete v.details.barter;delete v.writeContext.barter;assert.equal((await create({fetch}).details('account','A')).details.barter,undefined);
});
test('old native capability response stops load before touching an active v2 disk',async()=>{
  const {createDesktopStore:create}=loadTS('lib/irisDesktopStore.ts');const listeners=new Set(),sent=[];
  const store=create({environment:'development',context:()=>({epoch:1,environment:'development'}),channel:{postMessage:m=>{sent.push(m);queueMicrotask(()=>{for(const l of listeners)l({data:{version:1,id:m.id,epoch:1,ok:false,error:'protected_store_unavailable'}});});},addEventListener:(_,l)=>listeners.add(l),removeEventListener:(_,l)=>listeners.delete(l)}});
  await assert.rejects(()=>store.load(),/최신 앱/);assert.deepEqual(sent.map(m=>m.method),['store.capabilities']);
});
test('barter UI shows account pending values across characters and preserves task type guards',()=>{
  assert.ok(existsSync('components/iris/DesktopBarter.tsx'),'Missing compact barter list');
  const {DesktopBarter,desktopBarterRows}=loadTS('components/iris/DesktopBarter.tsx');const e={...A,...key,kind:'barter',baseCompleted:3,desiredCompleted:1,requestId:'id',revision:1,phase:'pending'};
  assert.equal(desktopBarterRows(detail('B'),[e])[0].completed,1);
  const markup=renderToStaticMarkup(React.createElement(DesktopBarter,{selected:detail('B'),pending:[e],locked:false,onEdit:()=>{}}));assert.ok(markup.includes('1/3'));assert.ok(markup.includes('계정당'));assert.ok(markup.includes('물물교환 검색'));
  const {desktopRows}=loadTS('components/iris/DesktopCheckboard.tsx');const task=detail('A');task.details.tasks.weekly=[{id:'1',name:'숙제',completed:0,total:1}];assert.equal(desktopRows(task,[e],'weekly')[0].completed,0);
});
