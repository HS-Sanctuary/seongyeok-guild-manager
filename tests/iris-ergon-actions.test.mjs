import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {loadTS} from './load-ts.mjs';
const api=existsSync('lib/irisErgonActions.ts')?loadTS('lib/irisErgonActions.ts'):{};
const challenge={schemaVersion:1,nonce:'123e4567-e89b-12d3-a456-426614174000',expiresAt:10000,accountId:'a',characterId:'c',accountLabel:'한설',characterLabel:'한설',action:'crafting',displayName:'목재',expectedWings:5,wings:20,outputPerRun:1,owned:3,facility:null,completed:[]};
test('native action challenge is exact, scoped and finite',()=>{
 assert.equal(typeof api.parseErgonChallenge,'function');
 assert.equal(api.parseErgonChallenge(challenge).displayName,'목재');
 for(const broken of [{...challenge,extra:'stop_action'},{...challenge,action:'stop_action'},{...challenge,expectedWings:0},{...challenge,wings:-1},{...challenge,expiresAt:Infinity},{...challenge,nonce:'bad'}])assert.throws(()=>api.parseErgonChallenge(broken));
});
test('unknown action result stays visibly blocked; registered is not completed',()=>{
 assert.equal(typeof api.parseErgonActionState,'function');
 const current={id:challenge.nonce,accountId:'a',characterId:'c',action:'altering',displayName:'목재',state:'unknown',expectedWings:5,beforeWings:20,afterWings:null,afterOwned:null,message:'life_result_unknown'};
 assert.equal(api.parseErgonActionState({schemaVersion:1,busy:false,blocked:true,state:'unknown',current}).blocked,true);
 assert.equal(api.parseErgonActionState({schemaVersion:1,busy:false,blocked:false,state:'registered',current:{...current,state:'registered'}}).current.state,'registered');
 assert.throws(()=>api.parseErgonActionState({schemaVersion:1,busy:false,blocked:false,state:'unknown',current}));
});
test('native running receipt cannot be mistaken for completed result',()=>{
 assert.equal(typeof api.parseErgonActionReceipt,'function');
 assert.equal(api.parseErgonActionReceipt({schemaVersion:1,id:challenge.nonce,state:'running'}).state,'running');
 assert.throws(()=>api.parseErgonActionReceipt({schemaVersion:1,id:challenge.nonce,state:'completed'}));
});
test('client sends only scoped methods and never retries a rejected native action reply',async()=>{
 const {createDesktopStore}=loadTS('lib/irisDesktopStore.ts');const sent=[],listeners=new Set();
 const store=createDesktopStore({channel:{postMessage:m=>sent.push(m),addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn)},context:()=>({epoch:1,environment:'development'}),environment:'development',timeoutMs:5});
 assert.equal(typeof store.prepareLifeAction,'function');
 await assert.rejects(store.prepareLifeAction({accountId:'a',characterId:'c',action:'stop_action',displayName:'목재'}));assert.equal(sent.length,0);
 const cap=store.lifeActionCapabilities();assert.equal(sent.at(-1).method,'game.life.actions.capabilities');for(const fn of listeners)fn({data:{version:1,id:sent.at(-1).id,epoch:1,ok:true,value:{schemaVersion:1,actions:['gathering','altering','crafting','collect'],gatheringNames:['통나무'],queue:false,collectCostKnown:false}}});await cap;
 const context=store.setLifeContext({accountId:'a',characterId:'c',accountLabel:'한설',characterLabel:'한설'});for(const fn of listeners)fn({data:{version:1,id:sent.at(-1).id,epoch:1,ok:true,value:{schemaVersion:1}}});await context;
 const prepared=store.prepareLifeAction({accountId:'a',characterId:'c',action:'crafting',displayName:'목재'});assert.equal(sent.at(-1).method,'game.life.actions.prepare');assert.deepEqual(sent.at(-1).payload,{accountId:'a',characterId:'c',action:'crafting',displayName:'목재'});
 for(const fn of listeners)fn({data:{version:1,id:sent.at(-1).id,epoch:1,ok:false,error:'life_action_unavailable'}});
 await assert.rejects(prepared);assert.equal(sent.filter(x=>x.method==='game.life.actions.prepare').length,1);
});
