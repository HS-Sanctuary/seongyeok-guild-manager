import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startIrisFixture} from './iris-ui.fixture.mjs';
import {entry} from './iris-ergon-progress-ui.fixture.mjs';
const injected=entry.replace('doc.goals[0].lifecycle=p.lifecycle;doc.revision++;return ',"window.trial.lifecycleCalls??=[];window.trial.lifecycleCalls.push(p.operationId);if(window.trial.lifecycleFail)throw Error('unavailable');const lifecycleStatus=done.has(p.operationId)?'already-applied':'committed';if(!done.has(p.operationId)){doc.goals[0].lifecycle=p.lifecycle;doc.revision++;done.set(p.operationId,true);}if(window.trial.lifecycleLose){window.trial.lifecycleLose=false;throw Error('lost ACK');}return ").replace("status:'committed',operationId:p.operationId,revision:doc.revision,view:copy(doc),error:null};}}", "status:lifecycleStatus,operationId:p.operationId,revision:doc.revision,view:copy(doc),error:null};}}");
assert.notEqual(injected,entry);
const {chromium}=createRequire(process.argv[2])('playwright');const fixture=await startIrisFixture(injected),browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage();page.setDefaultTimeout(4000);
try{
 for(const failure of ['lost','unavailable']){
  await page.goto(fixture.origin);await page.getByLabel('실제로 확인한 추가 확보 수량',{exact:true}).waitFor();
  await page.evaluate(mode=>{window.trial.lifecycleLose=mode==='lost';window.trial.lifecycleFail=mode==='unavailable';},failure);
  await page.getByRole('button',{name:'나중에 확인 · 보류하기',exact:true}).click();await page.getByRole('alert').waitFor();
  assert.equal(await page.evaluate(()=>window.trial.dirty),true,'unresolved lifecycle must guard exit/context change');
  assert.equal(await page.evaluate(()=>{const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented;}),true);
  await page.getByRole('button',{name:'진행 기록 새로고침',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.trial.dirty),true,'state alone is not operation evidence');
  if(failure==='unavailable'){
   await page.getByRole('button',{name:'보류·취소 저장 상태 확인',exact:true}).click();await page.getByRole('alert').waitFor();
   assert.equal(await page.evaluate(()=>window.trial.dirty),true,'failed verification must preserve pending');
  }
  await page.evaluate(()=>window.trial.busy(true));
  await page.waitForFunction(()=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='보류·취소 저장 상태 확인').disabled);
  assert.equal(await page.evaluate(()=>window.trial.dirty),true,'locked transition must retain pending guard');
  await page.evaluate(()=>window.trial.busy(false));
  await page.waitForFunction(()=>!Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='보류·취소 저장 상태 확인').disabled);
  await page.evaluate(()=>window.trial.lifecycleFail=false);
  await page.getByRole('button',{name:'보류·취소 저장 상태 확인',exact:true}).click();
  await page.waitForFunction(()=>!window.trial.dirty);await page.getByText('보류 중',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'그만하기',exact:true}).isEnabled(),true);
  assert.equal(await page.evaluate(()=>window.trial.lifecycleCalls[0]===window.trial.lifecycleCalls.at(-1)),true);
 }
 console.log('PASS lifecycle lost ACK/unavailable preserve pending and exit guard; same operation authoritative ACK clears without remount');
}finally{await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
