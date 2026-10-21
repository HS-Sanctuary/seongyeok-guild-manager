import test from 'node:test';import assert from 'node:assert/strict';import {loadTS} from './load-ts.mjs';
const api=loadTS('lib/irisErgonCraftGoal.ts');
const identity={accountId:'a',characterId:'c',displayName:'검',targetQuantity:20,outputPerCraft:1},now=10000;
const create=(change={})=>api.createErgonCraftGoal({...identity,...change},now);
const challenge=(craftCount=5,outputPerCraft=1)=>({accountId:'a',characterId:'c',action:'crafting',displayName:'검',wings:100,expectedWings:5,crafting:{craftCount,outputPerCraft,expectedOutput:craftCount*outputPerCraft}});
const result=(id='one',changes={})=>({id,accountId:'a',characterId:'c',action:'crafting',displayName:'검',state:'completed',beforeWings:100,afterWings:95,afterOwned:null,crafting:{craftCount:5,outputPerCraft:1,expectedOutput:5},...changes});
const observe=(goal=create(),changes={},meta=challenge())=>api.observeErgonCraftGoal(api.attachErgonCraftReceipt(goal,'one',meta),result('one',changes));

test('four completed crafts with expected four are not four acquired items or goal completion',()=>{
 const done=observe(create({targetQuantity:4}),{crafting:{craftCount:4,outputPerCraft:1,expectedOutput:4}},challenge(4));
 assert.equal(done.confirmedOutput,0);assert.equal(done.quantityUnconfirmed,true);assert.equal(done.blocked,false,'command completion is not native unknown');
 const preview=api.previewErgonCraftGoal(done,now);assert.equal(preview.remaining,4);assert.equal(preview.ready,false);assert.match(preview.reason,/수량 확인 필요/);
 assert.equal(done.lastExpectedOutput,4);assert.deepEqual(api.renewErgonCraftBudget(done,now+400000),done);
});
test('previously confirmed three remain three when a new command has no quantity evidence',()=>{
 // Seed a confirmed-state contract, not a rewards adapter or a user-confirmation API.
 const done=observe({...create({targetQuantity:7}),confirmedOutput:3},{crafting:{craftCount:4,outputPerCraft:1,expectedOutput:4}},challenge(4));
 assert.equal(done.confirmedOutput,3);assert.equal(api.previewErgonCraftGoal(done,now).remaining,4);assert.equal(done.quantityUnconfirmed,true);
});
test('nominal output rounding and an absolute afterOwned value are not verified additional production',()=>{
 const done=observe(create({targetQuantity:7,outputPerCraft:3}),{afterOwned:200,crafting:{craftCount:3,outputPerCraft:3,expectedOutput:9}},challenge(3,3));
 assert.equal(done.confirmedOutput,0);assert.equal(done.lastExpectedOutput,9);assert.equal(api.previewErgonCraftGoal(done,now).ready,false);
});
test('duplicate terminal responses cannot increase progress or reopen a quantity-unconfirmed goal',()=>{
 const done=observe();assert.deepEqual(api.observeErgonCraftGoal(done,result()),done);assert.equal(done.observedIds.length,1);
 assert.equal(api.attachErgonCraftReceipt(done,'two',challenge()).pending,null);assert.equal(done.confirmedOutput,0);
});
test('native unknown, rejection and mismatched account/character/metadata remain protected without progress',()=>{
 for(const change of [{state:'unknown'},{state:'rejected'},{afterWings:96},{beforeWings:101},{accountId:'other'},{characterId:'other'},{displayName:'다른 검'},{crafting:{craftCount:1,outputPerCraft:1,expectedOutput:1}},{afterWings:null}]){
  const row=result('one',change),before=structuredClone(row),goal=api.attachErgonCraftReceipt(create(),'one',challenge()),observed=api.observeErgonCraftGoal(goal,row);
  assert.equal(observed.confirmedOutput,0);assert.equal(observed.blocked,true);assert.equal(api.previewErgonCraftGoal(observed,now).ready,false);assert.deepEqual(row,before);
  assert.deepEqual(api.renewErgonCraftBudget(observed,now+400000),observed);
 }
 const pending=api.attachErgonCraftReceipt(create(),'one',challenge());assert.equal(api.observeErgonCraftGoal(pending,result('another')),pending);assert.equal(api.observeErgonCraftGoal(pending,result('one',{state:'running'})),pending);
});
test('old estimated completedOutput is never upgraded to confirmed quantity or reservable output',()=>{
 const legacy={...create(),completedOutput:20};delete legacy.confirmedOutput;delete legacy.quantityUnconfirmed;
 const before=structuredClone(legacy);assert.equal(api.confirmedErgonCraftOutput(legacy),0);assert.equal(api.needsErgonCraftQuantityConfirmation(legacy),true);
 assert.equal(api.previewErgonCraftGoal(legacy,now).remaining,20);assert.equal(api.previewErgonCraftGoal(legacy,now).ready,false);assert.deepEqual(legacy,before);
});
test('confirmed-only terminal target stays complete without treating unknown quantity as zero failure',()=>{
 const done={...create({targetQuantity:4}),confirmedOutput:4};assert.equal(api.previewErgonCraftGoal(done,now).remaining,0);assert.equal(api.previewErgonCraftGoal(done,now).ready,false);
 const unresolved={...done,quantityUnconfirmed:true};assert.match(api.previewErgonCraftGoal(unresolved,now).reason,/수량 확인 필요/);
});
test('budgets, stopped observation and invalid or duplicate challenges remain fail closed',()=>{
 for(const field of ['commandBudget','wingBudget'])assert.equal(api.previewErgonCraftGoal({...create(),[field]:0},now).ready,false);
 assert.equal(api.previewErgonCraftGoal(create(),now+300000).ready,false);
 const stopped=api.stopErgonCraftGoal(api.attachErgonCraftReceipt(create(),'one',challenge()));const final=api.observeErgonCraftGoal(stopped,result());assert.equal(final.confirmedOutput,0);assert.equal(final.quantityUnconfirmed,true);assert.equal(final.stopped,true);
 assert.throws(()=>create({targetQuantity:0}));assert.throws(()=>create({outputPerCraft:null}));assert.equal(api.attachErgonCraftReceipt(create(),'one',challenge(4)).blocked,true);
 const fresh=create(),renewed=api.renewErgonCraftBudget({...fresh,confirmedOutput:3,stopped:true},now+400000);assert.equal(renewed.confirmedOutput,3);assert.equal(renewed.commandBudget,5);assert.equal(renewed.wingBudget,25);
});
