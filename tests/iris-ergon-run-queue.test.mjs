import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';import {loadTS} from './load-ts.mjs';
const api=existsSync('lib/irisErgonRunQueue.ts')?loadTS('lib/irisErgonRunQueue.ts'):{};
const base={action:'crafting',displayName:'목재',targetQuantity:20,owned:3,producedPerRun:3,wings:100,blocked:false};
test('bounded craft plan tracks shortage and never promises over 5 commands or 25 wings',()=>{
 assert.equal(typeof api.planErgonQueue,'function');const result=api.planErgonQueue(base);
 assert.equal(result.remainingUnits,17);assert.equal(result.requiredRuns,6);assert.equal(result.stagedRuns,5);assert.equal(result.maximumWings,25);assert.equal(result.ready,true);
 const low=api.planErgonQueue({...base,wings:20});assert.equal(low.stagedRuns,4);assert.equal(low.maximumWings,20);
});
test('unknown stock, unresolved action, cost and facility uncertainty block claimed automation',()=>{
 for(const change of [{owned:null},{producedPerRun:null},{blocked:true},{action:'collect'},{action:'gathering'},{action:'altering'},{wings:4}]){
  const result=api.planErgonQueue({...base,...change});assert.equal(result.ready,false);assert.equal(result.stagedRuns,0);
 }
});
test('only a confirmed completed craft receipt with fresh stock can advance the staged queue',()=>{
 assert.equal(typeof api.advanceErgonQueue,'function');const current=api.planErgonQueue(base);
 assert.equal(api.advanceErgonQueue(current,{id:'a',state:'unknown',owned:6,wings:95}).ready,false);
 assert.equal(api.advanceErgonQueue(current,{id:'a',state:'registered',owned:6,wings:95}).ready,false);
 const next=api.advanceErgonQueue(current,{id:'a',state:'completed',owned:6,wings:95});assert.equal(next.remainingUnits,14);assert.equal(next.stagedRuns,4);assert.equal(next.maximumWings,20);
 assert.equal(api.advanceErgonQueue(current,{id:'a',state:'completed',owned:null,wings:95}).ready,false);
 assert.equal(api.advanceErgonQueue(next,{id:'a',state:'completed',owned:9,wings:90}).ready,false,'same receipt must not advance twice');
});

test('completed receipt without a stock gain cannot spend or advance the bounded queue',()=>{
 const current=api.planErgonQueue(base);
 for(const owned of [3,2,null,Infinity,NaN]){
  const next=api.advanceErgonQueue(current,{id:'a',state:'completed',owned,wings:95});
  assert.equal(next.blocked,true);assert.equal(next.ready,false);assert.deepEqual(next.confirmedIds,[]);
 }
});

test('new observation never replenishes a spent five-command budget',()=>{
 assert.equal(typeof api.refreshErgonQueue,'function');let queue=api.planErgonQueue({...base,targetQuantity:100});
 for(let i=1;i<=5;i++)queue=api.advanceErgonQueue(queue,{id:'receipt-'+i,state:'completed',owned:3+i*3,wings:100-i*5});
 assert.equal(queue.commandBudget,0);assert.equal(queue.wingBudget,0);
 const observed=api.refreshErgonQueue(queue,{owned:18,wings:75,producedPerRun:3});
 assert.equal(observed.ready,false);assert.equal(observed.commandBudget,0);assert.equal(observed.wingBudget,0);
});

test('stopping next actions still accounts for the already running confirmed receipt',()=>{
 assert.equal(typeof api.stopErgonQueue,'function');const stopped=api.stopErgonQueue(api.planErgonQueue(base));
 assert.equal(stopped.ready,false);assert.equal(stopped.stopped,true);
 const completed=api.advanceErgonQueue(stopped,{id:'running-receipt',state:'completed',owned:6,wings:95});
 assert.equal(completed.blocked,false);assert.equal(completed.commandBudget,4);assert.equal(completed.wingBudget,20);assert.equal(completed.stopped,true);assert.equal(completed.ready,false);
 assert.equal(api.refreshErgonQueue(completed,{owned:6,wings:95,producedPerRun:3}).ready,false);
});

test('next-start deadline expires at the boundary but never fabricates a running result',()=>{
 const before=api.planErgonQueue({...base,deadlineAt:10000},undefined,9999);assert.equal(before.ready,true);assert.equal(before.expired,false);
 const expired=api.planErgonQueue({...base,deadlineAt:10000},undefined,10000);assert.equal(expired.ready,false);assert.equal(expired.expired,true);
 for(const deadlineAt of [0,-1,NaN,Infinity])assert.equal(api.planErgonQueue({...base,deadlineAt},undefined,100).ready,false);
 assert.equal(typeof api.refreshErgonQueue,'function');const after=api.refreshErgonQueue(before,{owned:3,wings:100,producedPerRun:3},10000);
 assert.equal(after.ready,false);assert.deepEqual(after.confirmedIds,[]);assert.equal(after.commandBudget,5);
});
