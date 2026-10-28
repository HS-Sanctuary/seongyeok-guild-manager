import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {writeFileSync,mkdirSync} from 'node:fs';
import {startOnlineHttpFixture} from './account-online.http.fixture.mjs';
const fixture=await startOnlineHttpFixture(),{chromium}=createRequire(process.argv[2])('playwright'),browser=await chromium.launch({channel:'chrome',headless:true});
const a=await browser.newContext({viewport:{width:390,height:950}}),b=await browser.newContext({viewport:{width:320,height:950}});
const errors=[];let probes=0;
for(const context of [a,b])await context.route('**/*',route=>new URL(route.request().url()).origin===fixture.origin?route.continue():route.abort());
const cookie=(value)=>({name:'sanctum_session',value,url:fixture.origin,httpOnly:true,sameSite:'Lax'});
await a.addCookies([cookie('fixture-a')]);await b.addCookies([cookie('fixture-b')]);
const pa=await a.newPage(),pb=await b.newPage();for(const page of [pa,pb]){page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);}
const refresh=page=>page.evaluate(()=>window.trial.tick(60001));
async function wait(condition){const start=Date.now();while(!condition()){if(Date.now()-start>5000)throw Error('Owned fixture condition timed out');await new Promise(setImmediate);}}
try{
 await pa.goto(fixture.origin);await pb.goto(fixture.origin);
 assert.equal(await pa.evaluate(()=>document.cookie.includes('sanctum_session')),false);assert.equal(await pb.evaluate(()=>document.cookie.includes('sanctum_session')),false);probes++;
 await pa.evaluate(()=>window.trial.reportAs(0));await pb.evaluate(()=>window.trial.reportAs(1));await wait(()=>fixture.activeIds().size===2);
 await refresh(pa);await refresh(pb);await pa.getByText('🟢 온라인 2명',{exact:true}).waitFor();await pb.getByText('🟢 온라인 2명',{exact:true}).waitFor();probes++;
 await pa.getByRole('button',{name:/세부 검색/}).click();await pa.getByRole('button',{name:'🟢 온라인만',exact:true}).click();assert.equal(await pa.getByText('기록 없음',{exact:true}).count(),0);await pa.getByRole('button',{name:'🟢 온라인만',exact:true}).click();
 await pa.getByText('최근 활동 2시간 전',{exact:true}).waitFor();assert.equal(fixture.metrics.activityPost,0);probes++;
 await a.setOffline(true);await refresh(pa);await pa.getByText('🟢 온라인 확인 불가',{exact:true}).waitFor();await pb.getByText('🟢 온라인 2명',{exact:true}).waitFor();probes++;
 await a.setOffline(false);await refresh(pa);await pa.getByText('🟢 온라인 2명',{exact:true}).waitFor();probes++;
 // A->B uses an independent B session. Old A cannot write via B's cookie.
 await a.addCookies([cookie('fixture-b2')]);await pa.evaluate(()=>{window.trial.reportAs(1);window.trial.change(1);});await wait(()=>fixture.metrics.denied>=1);await refresh(pa);probes++;
 fixture.revoke('fixture-b');await refresh(pb);await pb.getByText('🟢 온라인 확인 불가',{exact:true}).waitFor();await refresh(pa);await pa.getByText('🟢 온라인 2명',{exact:true}).waitFor();probes++;
 // Old A remains only until TTL after the cookie switch; no false immediate logout claim.
 fixture.advance(720001);await refresh(pa);await pa.getByText('🟢 온라인 0명',{exact:true}).waitFor();probes++;
 await pa.evaluate(()=>{window.trial.tick(300001);window.dispatchEvent(new Event('focus'));});await wait(()=>fixture.activeIds().has(fixture.ids[1]));await refresh(pa);await pa.getByText('🟢 온라인 1명',{exact:true}).waitFor();probes++;
 await pa.evaluate(()=>window.trial.showReporter(false));await wait(()=>fixture.activeIds().size===0);await refresh(pa);await pa.getByText('🟢 온라인 0명',{exact:true}).waitFor();probes++;
 for(const page of [pa,pb])assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);assert.equal(fixture.metrics.activityPost,0);
 mkdirSync('.superpowers/astra-online-validation',{recursive:true});writeFileSync('.superpowers/astra-online-validation/two-sessions.json',JSON.stringify({probes,metrics:fixture.metrics,realDatabaseCalls:0,scope:'Actual isolated Chromium contexts + loopback HTTP + production routes, synthetic session/RPC only. Not Windows IRIS/PG verification.'},null,2));
 console.log('PASS actual 2 browser contexts + loopback HTTP: HttpOnly isolation, real offline/restore, cookie switch denial, session revoke, TTL, explicit leave, mobile/filter/count and activity separation; synthetic DB only');
}finally{await browser.close();await fixture.close();}
