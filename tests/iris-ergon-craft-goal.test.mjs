import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';import {loadTS} from './load-ts.mjs';
const api=existsSync('lib/irisErgonCraftGoal.ts')?loadTS('lib/irisErgonCraftGoal.ts'):{};
const identity={accountId:'a',characterId:'c',displayName:'검',targetQuantity:20,outputPerCraft:1},now=10000;
const create=(change={})=>{assert.equal(typeof api.createErgonCraftGoal,'function');return api.createErgonCraftGoal({...identity,...change},now);};
const challenge=(craftCount=5,outputPerCraft=1)=>({accountId:'a',characterId:'c',action:'crafting',displayName:'검',wings:100,expectedWings:5,crafting:{craftCount,outputPerCraft,expectedOutput:craftCount*outputPerCraft}});
const result=(id='one',changes={})=>({id,accountId:'a',characterId:'c',action:'crafting',displayName:'검',state:'completed',beforeWings:100,afterWings:95,afterOwned:null,crafting:{craftCount:5,outputPerCraft:1,expectedOutput:5},...changes});
test('additional target20 stages only five crafts and exact completed receipt advances to remaining15 once',()=>{
 const fresh=create();assert.deepEqual(api.previewErgonCraftGoal(fresh,now),{remaining:20,craftCount:5,expectedOutput:5,ready:true,reason:''});
 const sent=api.attachErgonCraftReceipt(fresh,'one',challenge());assert.equal(api.previewErgonCraftGoal(sent,now).ready,false);assert.equal(sent.commandBudget,4);assert.equal(sent.wingBudget,20);
 const done=api.observeErgonCraftGoal(sent,result());assert.equal(done.completedOutput,5);assert.equal(api.previewErgonCraftGoal(done,now).remaining,15);assert.equal(api.previewErgonCraftGoal(done,now).craftCount,5);assert.deepEqual(api.observeErgonCraftGoal(done,result()),done);
});
test('output unit rounding is counted as confirmed production and completed target cannot prepare again',()=>{
 const g=create({targetQuantity:7,outputPerCraft:3});assert.equal(api.previewErgonCraftGoal(g,now).craftCount,3);
 const done=api.observeErgonCraftGoal(api.attachErgonCraftReceipt(g,'one',challenge(3,3)),result('one',{crafting:{craftCount:3,outputPerCraft:3,expectedOutput:9}}));assert.equal(done.completedOutput,9);assert.equal(api.previewErgonCraftGoal(done,now).remaining,0);assert.equal(api.previewErgonCraftGoal(done,now).ready,false);
});
test('unknown, wrong debit, wrong metadata or wrong character never increase confirmed output',()=>{
 for(const change of [{state:'unknown'},{state:'rejected'},{afterWings:96},{beforeWings:101},{characterId:'other'},{crafting:{craftCount:1,outputPerCraft:1,expectedOutput:1}},{afterWings:null}]){
  const observed=api.observeErgonCraftGoal(api.attachErgonCraftReceipt(create(),'one',challenge()),result('one',change));assert.equal(observed.completedOutput,0);assert.equal(observed.blocked,true);assert.equal(api.previewErgonCraftGoal(observed,now).ready,false);
 }
 const g=api.attachErgonCraftReceipt(create(),'one',challenge());assert.equal(api.observeErgonCraftGoal(g,result('another')).completedOutput,0);assert.deepEqual(api.observeErgonCraftGoal(g,result('one',{state:'running'})),g);
});
test('five-command wing25 budget, deadline and stopped next command never discard in-flight observation',()=>{
 let g=create({targetQuantity:100});for(let i=0;i<5;i++)g=api.observeErgonCraftGoal(api.attachErgonCraftReceipt(g,'id'+i,challenge()),result('id'+i));
 assert.equal(g.completedOutput,25);assert.equal(g.commandBudget,0);assert.equal(g.wingBudget,0);assert.equal(api.previewErgonCraftGoal(g,now).ready,false);
 const renewed=api.renewErgonCraftBudget(g,now+400000);assert.equal(renewed.completedOutput,25);assert.equal(renewed.commandBudget,5);assert.equal(renewed.wingBudget,25);assert.equal(api.previewErgonCraftGoal(renewed,now+400000).ready,true);
 assert.equal(api.previewErgonCraftGoal(create(),now+300000).ready,false);
 const stopped=api.stopErgonCraftGoal(api.attachErgonCraftReceipt(create(),'one',challenge()));assert.equal(api.previewErgonCraftGoal(stopped,now).ready,false);const final=api.observeErgonCraftGoal(stopped,result());assert.equal(final.completedOutput,5);assert.equal(final.stopped,true);
});
test('invalid target, forged preparation and duplicate request IDs fail closed',()=>{
 assert.throws(()=>create({targetQuantity:0}));assert.throws(()=>create({outputPerCraft:null}));
 const invalid=api.attachErgonCraftReceipt(create(),'one',challenge(4));assert.equal(invalid.blocked,true);assert.equal(invalid.pending,null);
 const done=api.observeErgonCraftGoal(api.attachErgonCraftReceipt(create(),'one',challenge()),result());assert.equal(api.attachErgonCraftReceipt(done,'one',challenge()).blocked,true);
});
