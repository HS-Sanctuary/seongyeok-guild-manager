import test from 'node:test';import assert from 'node:assert/strict';import {loadTS} from './load-ts.mjs';
test('currency cache bridge only accepts scope, never arbitrary balances',async()=>{
 const {createDesktopStore}=loadTS('lib/irisDesktopStore.ts');let listener;const calls=[];
 const scope={environment:'development',accountId:'a'},view={schemaVersion:1,...scope,attribution:'unverified',items:[]};
 const store=createDesktopStore({environment:'development',context:()=>({epoch:1,environment:'development'}),channel:{addEventListener:(_,l)=>listener=l,removeEventListener:()=>{},postMessage:message=>{calls.push(message);queueMicrotask(()=>listener({data:{version:1,id:message.id,epoch:1,environment:'development',ok:true,value:view,error:null}}));}}});
 assert.equal(typeof store.loadCurrencyCache,'function');assert.deepEqual(await store.loadCurrencyCache('a'),view);assert.equal(calls[0].method,'store.currencies.load');assert.deepEqual(calls[0].payload,{accountId:'a'});
 assert.equal(typeof store.refreshCurrencyCache,'function');assert.deepEqual(await store.refreshCurrencyCache('a'),view);assert.equal(calls[1].method,'game.currencies.refreshCache');assert.deepEqual(calls[1].payload,{accountId:'a'});
});
