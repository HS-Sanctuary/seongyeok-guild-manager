import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startIrisFixture} from './iris-ui.fixture.mjs';
import {entry} from './iris-ergon-guided.fixture.mjs';
const {chromium}=createRequire(process.argv[2]??'C:/Users/sungw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('playwright');
const fixture=await startIrisFixture(entry),browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:390,height:950}});
page.setDefaultTimeout(5000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
const settle=()=>page.evaluate(()=>new Promise(r=>window.requestAnimationFrame(()=>r())));
try{
 await page.clock.install();await page.goto(fixture.origin);await page.getByText('71,041',{exact:true}).waitFor();await settle();
 await page.evaluate(()=>window.trial.reads=[]);await page.clock.runFor(14900);assert.equal(await page.evaluate(()=>window.trial.reads.length),0,'no background overview before 15 seconds');
 await page.clock.runFor(100);await page.waitForFunction(()=>window.trial.reads.includes('currencies'));
 assert.equal(await page.evaluate(()=>window.trial.reads.filter(k=>k==='works').length),1,'one works read per cycle');
 await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));window.trial.reads=[];});await page.clock.runFor(30000);assert.equal(await page.evaluate(()=>window.trial.reads.length),0,'hidden overview pauses');
 await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForFunction(()=>window.trial.reads.includes('currencies'));
 await page.getByRole('button',{name:'품목 찾기',exact:true}).click();await page.getByRole('button',{name:'제작 목록 조회',exact:true}).click();await page.getByRole('button',{name:'작업 선택',exact:true}).click();await page.getByRole('button',{name:'제작 실행 준비',exact:true}).click();await page.getByRole('group',{name:'에르곤 실행 확인'}).waitFor();await settle();
 await page.evaluate(()=>window.trial.reads=[]);await page.clock.runFor(30000);assert.equal(await page.evaluate(()=>window.trial.reads.length),0,'pending confirmation pauses overview but leaves confirm/cancel usable');assert.ok(await page.getByRole('button',{name:'준비 취소',exact:true}).isEnabled());
 await page.getByRole('button',{name:'준비 취소',exact:true}).click();await page.waitForFunction(()=>window.trial.reads.includes('currencies'));
 await page.evaluate(()=>window.trial.running=true);await page.clock.runFor(2100);await settle();await page.evaluate(()=>window.trial.reads=[]);await page.clock.runFor(30000);assert.equal(await page.evaluate(()=>window.trial.reads.length),0,'running action pauses overview');
 await page.evaluate(()=>window.trial.running=false);await page.clock.runFor(2100);await page.waitForFunction(()=>window.trial.reads.includes('currencies'));
 for(const width of [320,390,720,1240])for(const font of [18,20,22]){await page.setViewportSize({width,height:950});await page.evaluate(n=>document.documentElement.style.fontSize=n+'px',font);const boxes=await page.locator('.iris-ergon-metrics p').evaluateAll(items=>items.map(e=>({top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,right:e.getBoundingClientRect().right,width:e.clientWidth,scroll:e.scrollWidth})));assert.equal(new Set(boxes.map(b=>Math.round(b.top))).size,1,'three metrics stay on one row');assert.ok(boxes.every(b=>b.scroll<=b.width+1&&b.right<=width),'large values stay within cards');}
 await page.screenshot({path:'.superpowers/sdd/2026-10-16-ergon-guided-flow/overview.png'});
 await page.evaluate(()=>{window.trial.currencyDelay=true;window.trial.currencyAmount=91;window.trial.epoch++;window.trial.setCharacter('other');});await page.waitForFunction(()=>typeof window.trial.releaseCurrency==='function');assert.equal(await page.getByText('71,041',{exact:true}).count(),0,'previous character currency must not appear as new character value while refreshing');await page.evaluate(()=>{window.trial.currencyDelay=false;window.trial.releaseCurrency();});await page.getByText('91',{exact:true}).waitFor();
 assert.deepEqual(errors,[]);console.log('PASS overview: 15s single polling, hidden/resume, preparation pause, running/settled refresh, three metrics across widths/fonts');
}finally{await browser.close();await new Promise(done=>fixture.server.close(done));}
