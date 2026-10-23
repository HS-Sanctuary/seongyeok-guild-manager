import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {startIrisFixture} from './iris-ui.fixture.mjs';import {entry} from './iris-ergon-progress-ui.fixture.mjs';
const {chromium}=createRequire(process.argv[2])('playwright'),fixture=await startIrisFixture(entry),browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage();page.setDefaultTimeout(4000);const failures=[];
try{
 for(const issue of ['draft-disconnect','refusal-reconcile']){try{
  await page.goto(fixture.origin);const q=page.getByLabel('실제로 확인한 추가 확보 수량',{exact:true});await q.fill('3');
  if(issue==='draft-disconnect'){await page.evaluate(()=>window.trial.available(false));await page.getByText('이 앱은 진행 기록 확인 기능을 지원하지 않아요.',{exact:true}).waitFor();assert.equal(await q.inputValue(),'3');assert.equal(await page.evaluate(()=>window.trial.dirty),true);await page.evaluate(()=>window.trial.available(true));await page.waitForFunction(()=>!Array.from(document.querySelectorAll('input')).some(x=>x.disabled));assert.equal(await q.inputValue(),'3');}
  else{await page.evaluate(()=>window.trial.fail=true);await page.getByRole('button',{name:'확인 수량 저장',exact:true}).click();await page.getByRole('alert').waitFor();await page.evaluate(()=>window.trial.fail=false);await page.getByRole('button',{name:'저장 상태 확인',exact:true}).click();await page.waitForFunction(()=>!Array.from(document.querySelectorAll('input')).some(x=>x.disabled));await q.fill('2');assert.equal(await q.inputValue(),'2');await page.getByRole('button',{name:'초안만 버리기',exact:true}).click();assert.equal(await q.inputValue(),'');}
  console.log('PASS review '+issue);
 }catch(e){failures.push(issue+': '+e.message);console.log('FAIL review '+issue+': '+e.message);}}
 assert.deepEqual(failures,[]);
}finally{await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
