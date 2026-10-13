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
