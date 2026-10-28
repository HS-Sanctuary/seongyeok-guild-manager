import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {startPgOnlineFixture} from './account-online.pg-http.fixture.mjs';
const fixture=await startPgOnlineFixture(),{chromium}=createRequire(process.argv[2])('playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),contexts=[];
let probes=0;
try{
 for(let i=0;i<2;i++){
  const c=await browser.newContext({viewport:{width:i?320:390,height:900}});contexts.push(c);await c.route('**/*',r=>new URL(r.request().url()).origin===fixture.origin?r.continue():r.abort());
  await c.addCookies([{name:'sanctum_session',value:fixture.tokens[i],url:fixture.origin,httpOnly:true,sameSite:'Lax'}]);
 }
 const pages=await Promise.all(contexts.map(c=>c.newPage()));await Promise.all(pages.map(p=>p.goto(fixture.origin+'/iris/desktop')));
 const send=(p,command)=>p.evaluate(async body=>{const r=await fetch('/api/account/online',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};},command);
 const cmd=(i,id=randomUUID(),seq=1,action='touch')=>({connectionId:id,sequence:seq,kind:'web',action,expectedAccountId:fixture.ids[i]});
 assert.equal((await fetch(fixture.origin+'/__astra_validation')).status,403);assert.equal((await fetch(fixture.origin+'/__astra_validation',{headers:{'X-Astra-Validation-Owner':fixture.pg.owner}})).status,200);probes++;
 assert.equal((await fetch(fixture.origin+'/api/account/online',{headers:{Origin:'https://outside.invalid'}})).status,403);assert.equal((await fetch(fixture.origin+'/api/other')).status,404);probes++;
 const a=cmd(0),b=cmd(1);assert.equal((await send(pages[0],a)).status,200);assert.equal((await send(pages[1],b)).status,200);assert.equal(fixture.state().accounts.length,2);probes++;
 assert.equal((await send(pages[1],{...cmd(0)})).status,409);assert.equal(fixture.state().accounts.length,2);probes++;
 assert.equal(await pages[0].evaluate(()=>document.cookie.includes('sanctum_session')),false);probes++;
 const another=cmd(0);assert.equal((await send(pages[0],another)).status,200);assert.equal(fixture.state().accounts.length,2);probes++;
 await send(pages[0],{...a,sequence:2,action:'leave'});assert.equal(fixture.state().accounts.length,2);probes++;
 await send(pages[0],{...a,sequence:99});assert.equal(fixture.state().accounts.length,2);probes++;
 await send(pages[0],{...another,sequence:2,action:'leave'});assert.equal(fixture.state().accounts.length,1);probes++;
 await contexts[1].setOffline(true);await assert.rejects(pages[1].evaluate(()=>fetch('/api/account/online')));await contexts[1].setOffline(false);assert.equal((await pages[1].request.get(fixture.origin+'/api/account/online')).status(),200);probes++;
 fixture.offline(true);assert.equal((await pages[0].request.get(fixture.origin+'/api/account/online')).status(),503);fixture.offline(false);probes++;
 await send(pages[1],{...b,sequence:2,action:'leave'});assert.equal(fixture.state().accounts.length,0);assert.equal(fixture.metrics.activity,0);assert.equal(fixture.pg.sql('select count(*) from public.sanctum_account_activity;'),'0');probes++;
 const report={status:'PASS',probes,metrics:fixture.metrics,realPostgreSQL:true,physicalDevices:1,nativeGui:false,scope:'two independent Chromium sessions + actual HTTP route + isolated PostgreSQL17',baselineWebOverrides:'ca69770 served by fixture bundler'};
 writeFileSync('.superpowers/astra-online-night/pg-http-result.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();await fixture.close();}
