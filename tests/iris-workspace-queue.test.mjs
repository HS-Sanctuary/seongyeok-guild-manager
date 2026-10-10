import test from 'node:test';
import assert from 'node:assert/strict';
import {loadTS} from './load-ts.mjs';
const cache=new Map(),{createDesktopQueue}=loadTS('lib/irisDesktopQueue.ts',{},cache);
const A={environment:'development',accountId:'account',characterId:'A'},B={...A,characterId:'B'};
const key={itemKind:'shop',itemId:'1',field:'count',scope:'account',periodKey:'2026-10-04T21:00:00.000Z',catalogKey:'a'.repeat(64)};
function setup(){let time=0,id=0;const queue=createDesktopQueue({environment:'development',now:()=>time,id:()=>`00000000-0000-4000-8000-${String(++id).padStart(12,'0')}`});return {queue,at:v=>time=v};}
test('workspace shared count coalesces across owned characters while bookmark and other account remain independent',()=>{
  const {queue,at}=setup();assert.equal(typeof queue.editWorkspace,'function');
  queue.editWorkspace(A,key,2,3);at(1000);queue.editWorkspace(B,key,3,9999);queue.editWorkspace(B,{...key,field:'bookmark'},0,1);queue.editWorkspace({...A,accountId:'other'},key,0,1);
  const own=queue.snapshot().entries.filter(e=>e.accountId==='account');assert.equal(own.length,2);assert.equal(own[0].baseCompleted,2);assert.equal(own[0].desiredCompleted,9999);assert.equal(own[0].characterId,'B');
  at(15999);assert.equal(queue.due('account').length,0);at(16000);assert.equal(queue.due('account').length,2);
  assert.throws(()=>queue.editWorkspace(A,{...key,field:'bookmark'},0,2));
});
test('workspace durable restore pauses old intent and wrong success cannot clear it',()=>{
  const {queue,at}=setup();assert.equal(typeof queue.editWorkspace,'function');queue.editWorkspace(A,key,2,1);queue.saveNow(B);
  const flight=queue.claim(queue.due('account')[0].requestId);assert.throws(()=>queue.settle(flight.requestId,{kind:'saved',completed:0}));
  const saved=queue.snapshot();queue.restore(saved);at(60000);assert.equal(queue.due('account').length,0);assert.equal(queue.snapshot().entries[0].phase,'unknown');
});
test('controller absolute workspace save verifies baseline then updates the shared visible row',async()=>{
  const {queue}=setup(),{createDesktopController}=loadTS('lib/irisDesktopController.ts',{},cache);let writes=0,value=2;
  const row={id:'1',itemKind:'shop',scope:'account',key,total:9999,completed:2,bookmarked:false};
  const controller=createDesktopController({queue,environment:'development',store:{load:async()=>null,replace:async()=>{}},transport:{session:async()=>({id:'account',nickname:'owner',role:'길드원'}),characters:async()=>[{id:'A',nickname:'가나',job:'힐러'}],details:async()=>({accountId:'account',characterId:'A',details:{tasks:{},classes:[],workspace:[{...row,completed:value}]},writeContext:{periodKeys:{},classes:[]}}),save:async e=>{writes++;value=e.desiredCompleted;return {kind:'saved',completed:value};}}});
  await controller.start();await controller.selectCharacter('A');assert.equal(typeof controller.editWorkspace,'function');await controller.editWorkspace(key,2,1);await controller.saveNow();
  assert.equal(writes,1);assert.equal(queue.snapshot().entries.length,0);assert.equal(controller.state().selected.details.workspace[0].completed,1);
});

test('transient missing workspace preserves unknown intent until an explicit retry can inspect the baseline',async()=>{
  const {queue}=setup(),{createDesktopController}=loadTS('lib/irisDesktopController.ts',{},cache);
  let missing=false,writes=0;
  const row={id:'1',itemKind:'shop',scope:'account',key,total:9,completed:2,bookmarked:false};
  const controller=createDesktopController({queue,environment:'development',store:{load:async()=>null,replace:async()=>{}},transport:{session:async()=>({id:'account',nickname:'owner',role:'길드원'}),characters:async()=>[{id:'A',nickname:'가나',job:'힐러'}],details:async()=>({accountId:'account',characterId:'A',details:{tasks:{},classes:[],...(missing?{}:{workspace:[row]})},writeContext:{periodKeys:{},classes:[]}}),save:async()=>{writes++;return {kind:'unknown'};}}});
  await controller.start();await controller.selectCharacter('A');await controller.editWorkspace(key,2,1);await controller.saveNow();
  const requestId=queue.snapshot().entries[0].requestId;
  missing=true;await controller.recover(requestId,'retry');
  assert.equal(queue.snapshot().entries[0].phase,'unknown');assert.equal(writes,1);
});
