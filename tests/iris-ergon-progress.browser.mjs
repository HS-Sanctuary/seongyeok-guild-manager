import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startIrisFixture} from './iris-ui.fixture.mjs';
import {entry} from './iris-ergon-progress-ui.fixture.mjs';
const {chromium}=createRequire(process.argv[2])('playwright');
const fixture=await startIrisFixture(entry),browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:390,height:950}});page.setDefaultTimeout(5000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(fixture.origin);const quantity=page.getByLabel('실제로 확인한 추가 확보 수량',{exact:true}),save=page.getByRole('button',{name:'확인 수량 저장',exact:true});await quantity.waitFor();assert.equal(await quantity.inputValue(),'');assert.ok(await save.isDisabled());
 await quantity.fill('0');await save.click();await page.locator('p').filter({hasText:/^사용자 확인 0개$/}).waitFor();assert.equal(await page.evaluate(()=>window.trial.calls[0].quantity),0);
 await page.getByRole('button',{name:'확인량 정정',exact:true}).click();await quantity.fill('3');await page.getByLabel('정정 사유',{exact:true}).fill('다시 세었어요');await save.click();await page.getByText('현재 3개 확보 · 목표 4개 · 1개 부족',{exact:true}).waitFor();
 await page.getByRole('button',{name:'확인량 정정',exact:true}).click();await quantity.fill('2');await page.getByLabel('정정 사유',{exact:true}).fill('재확인');await page.evaluate(()=>window.trial.fail=true);await save.click();await page.getByRole('alert').waitFor();assert.equal(await quantity.inputValue(),'2');await page.evaluate(()=>window.trial.fail=false);await save.click();await page.getByText('현재 2개 확보 · 목표 4개 · 2개 부족',{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'계속하기',exact:true}).count(),0);
 for(const width of [320,390,768,1280])for(const font of [18,20,22]){await page.setViewportSize({width,height:950});await page.evaluate(f=>document.documentElement.style.fontSize=f+'px',font);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+'/'+font);}
 await page.screenshot({path:'.superpowers/ergon-progress-ui.png',fullPage:true});assert.deepEqual(errors,[]);console.log('PASS result empty/zero, correction3->2, failure draft, 12 responsive cases, no continue/consumption');
}finally{await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
