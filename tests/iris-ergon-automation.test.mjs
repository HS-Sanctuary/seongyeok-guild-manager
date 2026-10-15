import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';import {loadTS} from './load-ts.mjs';
const automation=existsSync('lib/irisErgonAutomation.ts')?loadTS('lib/irisErgonAutomation.ts'):{};
const id='123e4567-e89b-12d3-a456-426614174000',policy={schemaVersion:1,policyVersion:1,granted:true,separatedRequestIds:[id]};
test('policy is exact and bounded; original unknown remains separate from successful production',()=>{
 assert.equal(typeof automation.parseErgonCollectionPolicy,'function');assert.deepEqual(automation.parseErgonCollectionPolicy(policy),policy);
 for(const value of [{...policy,granted:'yes'},{...policy,policyVersion:2},{...policy,extra:true},{...policy,separatedRequestIds:[id,id.toUpperCase()]},{...policy,separatedRequestIds:['bad']},{...policy,separatedRequestIds:Array(301).fill(id)}])assert.throws(()=>automation.parseErgonCollectionPolicy(value));
});
function trial(){const sent=[],listeners=new Set();let epoch=1;const {createDesktopStore}=loadTS('lib/irisDesktopStore.ts');const store=createDesktopStore({channel:{postMessage:value=>sent.push(value),addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn)},context:()=>({epoch,environment:'development'}),environment:'development',timeoutMs:5});return {store,sent,listeners,change:()=>epoch++,reply(value,ok=true){for(const fn of [...listeners])fn({data:{version:1,id:sent.at(-1).id,epoch:1,ok,value}});}};}
const payload=()=>({requestId:id,requestedAt:Date.now(),accountId:'a',characterId:'c',facility:'mill',displayName:'wood'});
test('store exposes only exact scoped collect and policy endpoints and rejects foreign receipt/epoch',async()=>{
 const t=trial();assert.equal(typeof t.store.collectLifeAction,'function');const click=payload();let p=t.store.collectLifeAction(click);assert.equal(t.sent[0].method,'game.life.actions.collect');assert.deepEqual(t.sent[0].payload,click);t.reply({schemaVersion:1,id,state:'running'});assert.equal((await p).state,'running');
 for(const value of [{...click,action:'crafting'},{...click,requestId:'00000000-0000-0000-0000-000000000000'},{...click,facility:'bad\nname'},{...click,requestedAt:Infinity}])await assert.rejects(t.store.collectLifeAction(value));assert.equal(t.sent.length,1);
 p=t.store.collectLifeAction(click);t.reply({schemaVersion:1,id:'123e4567-e89b-12d3-a456-426614174001',state:'running'});await assert.rejects(p);assert.equal(t.sent.length,2);
 p=t.store.collectLifeAction(click);t.change();t.reply({schemaVersion:1,id,state:'running'});await assert.rejects(p);assert.equal(t.listeners.size,0);
});
test('revocation cannot grant permission and never accepts a browser granted field',async()=>{
 const t=trial();assert.equal(typeof t.store.collectionPolicy,'function');let p=t.store.collectionPolicy('a');assert.deepEqual(t.sent[0].payload,{accountId:'a'});t.reply(policy);assert.equal((await p).granted,true);
 p=t.store.revokeCollection('a');assert.equal(t.sent.at(-1).method,'game.life.actions.revokeCollection');assert.deepEqual(t.sent.at(-1).payload,{accountId:'a'});t.reply(policy);await assert.rejects(p);assert.equal(t.sent.length,2);
 p=t.store.revokeCollection('a');t.reply({...policy,granted:false});assert.equal((await p).granted,false);
});
test('capability4 explicitly advertises automation, capability3 does not',async()=>{
 const t=trial(),base={actions:['gathering','altering','crafting','collect'],gatheringNames:['통나무'],queue:false,collectCostKnown:false,quantityGathering:true,currentStop:true,quantityCrafting:true,maxCraftCount:5};let p=t.store.lifeActionCapabilities();t.reply({...base,schemaVersion:4,oneClickCollection:true,automaticReconciliation:true,collectionPolicyVersion:1});assert.equal((await p).oneClickCollection,true);
 p=t.store.lifeActionCapabilities();t.reply({...base,schemaVersion:3});assert.equal((await p).oneClickCollection,false);
});
test('collect timeout permits native prompt plus bounded preparation, but never retries',async()=>{
 const t=trial();assert.equal(typeof t.store.collectLifeAction,'function');const real=globalThis.setTimeout;let duration;globalThis.setTimeout=(fn,ms)=>{duration=ms;return real(fn,1);};try{await assert.rejects(t.store.collectLifeAction(payload()));assert.equal(duration,150000);assert.equal(t.sent.length,1);assert.equal(t.listeners.size,0);}finally{globalThis.setTimeout=real;}
});
