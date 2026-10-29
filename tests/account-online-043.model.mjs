// Explicit, bounded fixture smoke run. No native GUI, operating accounts or PG.
import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {start043Fixture} from './account-online-043.fixture.mjs';
const f=await start043Fixture(),connectionId=randomUUID();
const owner={'X-Astra-Validation-Owner':f.owner};
const request=(path,body,cookie='fixture-a',headers={})=>fetch(f.origin+path,{method:body===undefined?'GET':'POST',headers:{...(cookie?{Cookie:'sanctum_session='+cookie}:{}),...(body===undefined?{}:{Origin:f.origin,'Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
const online=(action,sequence,cookie='fixture-a',extra={})=>request('/api/account/online',{connectionId,kind:'iris',action,sequence,expectedAccountId:null,...extra},cookie);
after(async()=>{writeFileSync(join(f.snapshot.out,'model-result.json'),JSON.stringify({database:'synthetic-lease-model',events:f.events,metrics:f.metrics},null,2));await f.close();});
test('fixture control endpoints require matching synthetic owner',async()=>{
 assert.equal((await request('/__astra_validation',undefined,null)).status,403);
 assert.equal(await(await request('/__astra_validation',undefined,null,owner)).text(),f.owner);
 assert.equal((await request('/__fixture/unknown',undefined,null,owner)).status,404);
});
test('synthetic auth rejects unknown credentials and issues persistent HttpOnly cookie',async()=>{
 assert.equal((await request('/api/auth/login',{nickname:'합성A',code:'wrong'})).status,401);
 const response=await request('/api/auth/login',{nickname:'합성A',code:'synthetic-only',keepLoggedIn:true},null);
 assert.equal(response.status,200);assert.match(response.headers.get('set-cookie'),/HttpOnly; SameSite=Strict; Path=\/; Max-Age=86400/);assert.equal((await response.json()).account.id,f.ids[0]);
});
test('synthetic character writes stay denied and source bundle is actually served',async()=>{
 assert.equal((await request('/api/iris/kronos',{edit:{}})).status,403);
 const response=await request('/fixture.js');const script=await response.text();assert.match(script,/fixtureRelease/);assert.match(script,/0\.4\.3/);assert.doesNotMatch(script,/supabase\.co/);
});
test('actual online API validates owner and records model lease',async()=>{
 assert.equal((await online('touch',1,'fixture-a',{expectedAccountId:f.ids[1]})).status,409);
 assert.equal((await online('touch',1)).status,200);assert.deepEqual([...f.activeIds()],[f.ids[0]]);
});
test('closed connection cannot revive through a delayed older request',async()=>{
 assert.equal((await online('leave',2)).status,200);assert.equal(f.activeIds().size,0);
 assert.equal((await online('touch',1)).status,200);assert.equal(f.activeIds().size,0);
});
test('model expiry and outage controls remain explicitly synthetic',async()=>{
 const fresh={connectionId:randomUUID(),kind:'iris',action:'touch',sequence:1,expectedAccountId:null};
 assert.equal((await request('/api/account/online',fresh)).status,200);assert.equal(f.activeIds().size,1);
 await request('/__fixture/advance',{},null,owner);assert.equal(f.activeIds().size,0);
 await request('/__fixture/offline',{},null,owner);assert.equal((await request('/api/account/online',fresh)).status,503);
 await fetch(f.origin+'/__fixture/offline',{method:'DELETE',headers:owner});
 assert.equal((await request('/api/account/online',{...fresh,sequence:2})).status,200);assert.equal(f.activeIds().size,1);
 await request('/api/account/online',{...fresh,action:'leave',sequence:3});assert.equal(f.activeIds().size,0);
});
test('cross-origin requests and unauthenticated online writes are rejected',async()=>{
 assert.equal((await request('/api/account/online',{},null,{Origin:'https://outside.invalid'})).status,403);
 assert.equal((await online('touch',3,null)).status,401);
});
