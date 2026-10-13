import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startIrisFixture} from './iris-ui.fixture.mjs';
const {chromium}=createRequire(process.argv[2]??'C:/Users/sungw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json')('playwright');
const entry=`const React=require('react'),{createRoot}=require('react-dom/client'),{DesktopErgonExecution}=require('@/components/iris/DesktopErgonExecution'),{DesktopErgon}=require('@/components/iris/DesktopErgon');
if(new URL(location.href).searchParams.has('parent'))localStorage.setItem('iris_ergon_plans:v1:development:a',JSON.stringify({schemaVersion:1,items:[{id:'fixture-plan',kind:'crafting',displayName:'목재',targetQuantity:20}]}));
window.trial={calls:[],blocked:false,state:'idle'};let nonce='123e4567-e89b-12d3-a456-426614174000',sequence=0;
const api={lifeActionCapabilities:async()=>{window.trial.calls.push('cap');},setLifeContext:async()=>{window.trial.calls.push('context');},prepareLifeAction:async()=>{window.trial.calls.push('prepare');nonce='123e4567-e89b-12d3-a456-'+String(++sequence).padStart(12,'0');const value={schemaVersion:1,nonce,expiresAt:Date.now()+120000,accountId:'a',characterId:'c',accountLabel:'한설',characterLabel:'한설',action:'crafting',displayName:'목재',expectedWings:5,wings:window.trial.wings??20,outputPerRun:3,owned:window.trial.owned??3,facility:null,completed:[]};if(window.trial.deferPrepare)return await new Promise(resolve=>window.trial.resolvePrepare=()=>resolve(value));return value;},confirmLifeAction:async()=>{window.trial.calls.push('confirm');window.trial.state='running';window.trial.beforeWings=window.trial.wings??20;return {schemaVersion:1,id:nonce,state:'running'};},cancelLifeAction:async()=>{window.trial.calls.push('cancel');},lifeActionState:async()=>{window.trial.calls.push('state');const state=window.trial.blocked?'unknown':window.trial.state;return {schemaVersion:1,busy:state==='running',blocked:state==='running'||state==='unknown',state,current:state==='idle'?null:{id:nonce,accountId:'a',characterId:'c',action:'crafting',displayName:'목재',state,expectedWings:5,beforeWings:window.trial.beforeWings??20,afterWings:state==='completed'?(window.trial.wings??15):null,afterOwned:state==='completed'?(window.trial.owned??6):null,message:state==='unknown'?'life_result_unknown':null}};},lifeActionHistory:async()=>({schemaVersion:1,blocked:window.trial.blocked,records:[]})};
function App(){const [active,setActive]=React.useState(true),[locked,setLocked]=React.useState(false),[planName,setPlanName]=React.useState('목재');window.trial.setPlanName=setPlanName;window.trial.setActive=setActive;return React.createElement('main',{className:'iris-desktop','data-active':String(active),'data-plan':planName},new URL(location.href).searchParams.has('parent')?React.createElement(DesktopErgon,{environment:'development',accountId:'a',characterId:'c',accountLabel:'한설',characterLabel:'한설',active,locked,actions:api,onActionBusyChange:setLocked,getContextVersion:()=>0,read:async()=>{throw Error('no catalog reads expected');}}):React.createElement(DesktopErgonExecution,{api,plan:{kind:'crafting',displayName:planName,targetQuantity:20},accountId:'a',characterId:'c',accountLabel:'한설',characterLabel:'한설',active,locked,onBusyChange:setLocked}));}createRoot(document.getElementById('app')).render(React.createElement(App));`;
const fixture=await startIrisFixture(entry),browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:390,height:750}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(5000);
try{
 await page.goto(fixture.origin);await page.getByRole('button',{name:'1회 실행 준비'}).waitFor();assert.equal(await page.evaluate(()=>window.trial.calls.includes('prepare')),false);
 await page.getByRole('button',{name:'1회 실행 준비'}).click();await page.getByText('예상 날개 5개',{exact:false}).waitFor();await page.getByText('이번 묶음 계획: 최대 4회',{exact:false}).waitFor();assert.equal(await page.evaluate(()=>window.trial.calls.includes('confirm')),false);
 await page.getByRole('button',{name:'준비 취소'}).click();assert.equal(await page.evaluate(()=>window.trial.calls.includes('cancel')),true);assert.equal(await page.evaluate(()=>window.trial.calls.includes('confirm')),false);
 await page.getByRole('button',{name:'1회 실행 준비'}).click();await page.getByRole('button',{name:'게임 화면 확인 후 1회 실행'}).click();assert.equal(await page.evaluate(()=>window.trial.calls.filter(x=>x==='confirm').length),1);
 await page.evaluate(()=>window.trial.state='completed');await page.getByText('남은 묶음: 최대 3회',{exact:false}).waitFor();assert.equal(await page.evaluate(()=>window.trial.calls.filter(x=>x==='prepare').length),2,'completion must not auto-dispatch next action');
 await page.reload();await page.getByRole('button',{name:'1회 실행 준비'}).waitFor();await page.evaluate(()=>{window.trial.wings=100;window.trial.owned=3;});
 for(let i=1;i<=5;i++){
  await page.getByRole('button',{name:'1회 실행 준비'}).click();await page.getByRole('button',{name:'게임 화면 확인 후 1회 실행'}).click();
  await page.getByText('최근 작업: 목재 · 결과 확인 중',{exact:true}).waitFor();
  await page.evaluate(i=>{window.trial.state='completed';window.trial.wings=100-i*5;window.trial.owned=3+i*3;},i);
  await page.getByText('최근 작업: 목재 · 완료 확인',{exact:true}).waitFor();
 }
 assert.equal(await page.getByRole('button',{name:'1회 실행 준비'}).isDisabled(),true,'spent five-command budget must not silently reset');
 assert.equal(await page.evaluate(()=>window.trial.calls.filter(x=>x==='prepare').length),5);
 await page.getByRole('button',{name:'새 묶음 준비'}).click();assert.equal(await page.evaluate(()=>window.trial.calls.filter(x=>x==='prepare').length),5,'resetting requires another explicit prepare');
 await page.getByRole('button',{name:'1회 실행 준비'}).click();await page.getByRole('button',{name:'다음 작업 중지'}).click();
 assert.equal(await page.getByRole('button',{name:'게임 화면 확인 후 1회 실행'}).count(),0);
 assert.equal(await page.getByRole('button',{name:'1회 실행 준비'}).isDisabled(),true);
 assert.equal(await page.evaluate(()=>window.trial.calls.filter(x=>x==='confirm').length),5,'stop while prepared must send no command');
 await page.getByRole('button',{name:'새 묶음 준비'}).click();await page.getByRole('button',{name:'1회 실행 준비'}).click();
 await page.getByRole('button',{name:'게임 화면 확인 후 1회 실행'}).click();await page.getByText('최근 작업: 목재 · 결과 확인 중',{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'다음 작업 중지'}).isEnabled(),true,'stopping next actions must remain available under the parent busy lock');
 await page.getByRole('button',{name:'다음 작업 중지'}).click();
 await page.evaluate(()=>{window.trial.state='completed';window.trial.wings=70;window.trial.owned=21;});
 await page.getByText('최근 작업: 목재 · 완료 확인',{exact:true}).waitFor();
 assert.equal(await page.getByRole('button',{name:'1회 실행 준비'}).isDisabled(),true,'stop keeps observed result but never resumes');
 await page.getByRole('button',{name:'새 묶음 준비'}).click();await page.evaluate(()=>{window.trial.owned=0;window.trial.wings=100;});
 await page.clock.install();await page.getByRole('button',{name:'1회 실행 준비'}).click();await page.clock.fastForward(300001);
 await page.waitForFunction(()=>!Array.from(document.querySelectorAll('button')).some(e=>e.textContent==='게임 화면 확인 후 1회 실행'));
 assert.equal(await page.getByRole('button',{name:'1회 실행 준비'}).isDisabled(),true,'expired next-start window sends no command');
 assert.equal(await page.evaluate(()=>window.trial.calls.filter(x=>x==='confirm').length),6);
 const lifecycle=await browser.newPage({viewport:{width:390,height:850}});lifecycle.setDefaultTimeout(5000);
 try{
  await lifecycle.goto(fixture.origin+'/?parent=1');await lifecycle.getByRole('button',{name:'자동 실행',exact:true}).click();
  await lifecycle.getByRole('button',{name:'1회 실행 준비'}).click();await lifecycle.getByRole('button',{name:'다음 작업 중지'}).click();
  await lifecycle.getByRole('button',{name:'재료 확보',exact:true}).click();await lifecycle.getByRole('button',{name:'자동 실행',exact:true}).click();
  await lifecycle.getByRole('button',{name:'1회 실행 준비'}).waitFor();
  assert.equal(await lifecycle.getByRole('button',{name:'1회 실행 준비'}).isDisabled(),true,'actual parent menu round trip must preserve the stopped budget');
  assert.equal(await lifecycle.evaluate(()=>window.trial.calls.filter(x=>x==='prepare').length),1);
  for(const kind of ['visibility','plan']){
   await lifecycle.goto(fixture.origin);await lifecycle.getByRole('button',{name:'1회 실행 준비'}).waitFor();
   await lifecycle.evaluate(()=>window.trial.deferPrepare=true);await lifecycle.getByRole('button',{name:'1회 실행 준비'}).click();
   await lifecycle.waitForFunction(()=>typeof window.trial.resolvePrepare==='function');
   if(kind==='visibility'){
    await lifecycle.evaluate(()=>window.trial.setActive(false));await lifecycle.waitForFunction(()=>document.querySelector('main').dataset.active==='false');
    await lifecycle.evaluate(()=>window.trial.setActive(true));await lifecycle.waitForFunction(()=>document.querySelector('main').dataset.active==='true');
   }else{
    await lifecycle.evaluate(()=>window.trial.setPlanName('석재'));await lifecycle.waitForFunction(()=>document.querySelector('main').dataset.plan==='석재');
    await lifecycle.evaluate(()=>window.trial.setPlanName('목재'));await lifecycle.waitForFunction(()=>document.querySelector('main').dataset.plan==='목재');
   }
   await lifecycle.evaluate(()=>window.trial.resolvePrepare());
   await lifecycle.waitForFunction(()=>window.trial.calls.includes('cancel'));
   assert.equal(await lifecycle.getByRole('button',{name:'게임 화면 확인 후 1회 실행'}).count(),0,'late prepare after '+kind+' ABA must be discarded');
   assert.equal(await lifecycle.evaluate(()=>window.trial.calls.filter(x=>x==='confirm').length),0);
  }
 }finally{await lifecycle.close();}

 await page.addStyleTag({content:'*{animation:none!important;transition:none!important}'});
 for(const theme of ['aureum','elysium','nemeton','atelier','lumen','nocturne'])for(const width of [320,390,600,720])for(const pt of [6,13.5,22]){
  await page.setViewportSize({width,height:800});await page.evaluate(({theme,pt})=>{document.documentElement.dataset.theme=theme;document.documentElement.style.fontSize=(pt*96/72)+'px';},{theme,pt});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'queue controls must stay inside '+theme+'/'+width+'/'+pt);
  assert.deepEqual(await page.getByRole('button').evaluateAll(buttons=>buttons.filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>e.textContent)),[]);
 }
 await page.setViewportSize({width:390,height:850});await page.evaluate(()=>{document.documentElement.dataset.theme='aureum';document.documentElement.style.fontSize='18px';});
 await page.screenshot({path:'.superpowers/ergon-action-review.png'});assert.deepEqual(errors,[]);console.log('PASS ERGON explicit actions, exhausted budget, stop-before/after-send, deadline and 6 themes/12 width-font combinations; synthetic IO only');
}finally{await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
