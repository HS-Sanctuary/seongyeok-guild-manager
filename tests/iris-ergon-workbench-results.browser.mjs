import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startIrisFixture} from './iris-ui.fixture.mjs';
import {entry as source} from './iris-ergon-progress-ui.fixture.mjs';
const entry=source.slice(0,source.indexOf('function App()'))+`
const {DesktopErgon}=require('@/components/iris/DesktopErgon');
localStorage.setItem('iris_ergon_plans:v1:development:a',JSON.stringify({schemaVersion:1,items:[{id:'p',kind:'crafting',displayName:doc.goals[0].displayName,targetQuantity:4}]}));
const running=()=>({busy:!!window.trial.running,blocked:false,current:window.trial.running?{id:rid,accountId:'a',characterId:'c',action:'gathering',displayName:'합성 채집',state:'running',beforeWings:100,afterWings:null,gathering:{beforeOwned:0,currentOwned:0,additionalQuantity:10,stopState:'idle'}}:null});
const actions={...api,lifeActionCapabilities:async()=>({quantityGathering:true,currentStop:true}),setLifeContext:async()=>{},lifeActionState:async()=>running(),lifeActionHistory:async()=>({records:[]}),stopLifeAction:async()=>{window.trial.running=false;window.trial.stops=(window.trial.stops??0)+1;return running();}};
const originalLoad=actions.loadErgonProgress;actions.loadErgonProgress=async s=>{if(window.trial.loadFail)throw Error('offline');return originalLoad(s);};
window.trial.mismatch=()=>doc.goals[0].sourcePlanId='other';
function App(){const [active,setActive]=React.useState(true),[epoch,setEpoch]=React.useState(0);window.trial.active=setActive;window.trial.remount=()=>setEpoch(n=>n+1);return React.createElement('main',{className:'iris-desktop'},React.createElement(DesktopErgon,{key:epoch,environment:'development',accountId:'a',characterId:'c',active,locked:false,read:async()=>{throw Error('offline');},getContextVersion:()=>0,actions,onProgressDirtyChange:d=>window.trial.dirty=d}));}
createRoot(document.getElementById('app')).render(React.createElement(App));`;
const {chromium}=createRequire(process.argv[2])('playwright'),fixture=await startIrisFixture(entry),browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage();page.setDefaultTimeout(5000);
try{
 await page.goto(fixture.origin);const panel=page.getByRole('region',{name:'ERGON · 제작 결과 확인',exact:true});await panel.waitFor();
 const prepare=page.getByRole('button',{name:'1회 실행 준비',exact:true});await prepare.waitFor();assert.equal(await prepare.isDisabled(),true,'result-only native capability cannot enable a new consumption request');
 const input=panel.getByLabel('실제로 확인한 추가 확보 수량',{exact:true});await input.fill('3');await page.waitForFunction(()=>window.trial.dirty);
 assert.equal(await page.getByRole('navigation',{name:'에르곤 기능'}).getByRole('button',{name:'작업 계획',exact:true}).isDisabled(),true,'result draft must protect plan mutation');
 await page.evaluate(()=>window.trial.running=true);const stop=page.getByRole('button',{name:'지금 중지',exact:true});await stop.waitFor();assert.equal(await stop.isEnabled(),true,'late running state must not trap stop behind result draft');await stop.click();await page.waitForFunction(()=>window.trial.stops===1);await page.waitForFunction(()=>!Array.from(document.querySelectorAll('button')).find(b=>b.textContent==='확인 수량 저장').disabled);
 await page.evaluate(()=>window.trial.active(false));await page.evaluate(()=>window.trial.active(true));assert.equal(await input.inputValue(),'3');
 await panel.getByRole('button',{name:'확인 수량 저장',exact:true}).click();await panel.getByText('목표 4개 · 확인 3개 · 남은 1개',{exact:true}).waitFor();await page.getByText('확인된 추가 생산 3개 · 남은 1개',{exact:true}).waitFor();
 await page.evaluate(()=>window.trial.loadFail=true);await panel.getByRole('button',{name:'진행 기록 새로고침',exact:true}).click();await page.getByText('확인 수량 조회 필요 · 진척 계산 보류',{exact:true}).waitFor();assert.equal(await page.getByText('확인된 추가 생산 3개 · 남은 1개',{exact:true}).count(),0);await page.evaluate(()=>window.trial.loadFail=false);await panel.getByRole('button',{name:'진행 기록 새로고침',exact:true}).click();await page.getByText('확인된 추가 생산 3개 · 남은 1개',{exact:true}).waitFor();
 await panel.getByRole('button',{name:'확인량 정정',exact:true}).click();await input.fill('2');await panel.getByLabel('정정 사유',{exact:true}).fill('합성 재확인');await panel.getByRole('button',{name:'확인 수량 저장',exact:true}).click();await panel.getByText('목표 4개 · 확인 2개 · 남은 2개',{exact:true}).waitFor();
 await panel.getByRole('button',{name:'보류하기',exact:true}).click();await panel.getByText('보류 중',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.trial.calls.length),2);
 await page.evaluate(()=>window.trial.remount());await panel.getByText('보류 중',{exact:true}).waitFor();await panel.getByText('목표 4개 · 확인 2개 · 남은 2개',{exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.trial.calls.length),2);
 await page.evaluate(()=>window.trial.mismatch());await panel.getByRole('button',{name:'진행 기록 새로고침',exact:true}).click();await panel.getByText(/현재 계획과 다른 보존 기록/).waitFor();assert.equal(await panel.getByRole('button',{name:'확인량 정정',exact:true}).isDisabled(),true);
 for(const width of [320,390,768,1280])for(const font of [18,20,22]){await page.setViewportSize({width,height:950});await page.evaluate(f=>document.documentElement.style.fontSize=f+'px',font);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+'/'+font);}
 await page.screenshot({path:'.superpowers/ergon-workbench-results.png',fullPage:true});
 console.log('PASS real workbench mounts durable results; 4/3/1, correction, pause and hidden/active draft preservation');
}finally{await browser.close();await new Promise(r=>fixture.server.close(r));}
