import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startIrisFixture} from './iris-ui.fixture.mjs';
const {chromium}=createRequire(process.argv[2]??'C:/Users/sungw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json')('playwright');
const entry=`const React=require('react'),{createRoot}=require('react-dom/client'),{DesktopErgon}=require('@/components/iris/DesktopErgon');
window.trial={calls:[],blocked:false,pending:[],delay:false};
function App(){const [active,setActive]=React.useState(true);window.trial.setActive=setActive;
const read=async(kind,allowed)=>{window.trial.calls.push(kind);if(window.trial.delay)await new Promise(resolve=>window.trial.pending.push(resolve));const data=kind==='activity'?{autoPlaying:false,autoTraveling:false,dead:false,reviving:false,inCombat:window.trial.blocked,dialoguePlaying:false,waitingForSelection:false,inBattlefield:false,tutorialPlaying:false,inScenario:false,sequencePlaying:false,performancePlaying:false,minigame:false,housingEdit:false,dungeonState:'NotInDungeon'}:kind==='inventory'?{weight:10,maxWeight:100}:{unlocked:true,items:[{name:'상급 목재',available:true,producedPerUnit:3,reason:null,missing:null}]};return {schemaVersion:1,kind,observedAt:Date.now(),source:'official-cli',data};};
const readCurrencies=async()=>{window.trial.calls.push('currencies');return {observedAt:new Date().toISOString(),items:[{name:'정령의 날개',amount:30}]};};
return React.createElement('main',{className:'iris-desktop'},React.createElement(DesktopErgon,{environment:'development',accountId:'a',characterId:'c',active,locked:false,read,readCurrencies,getContextVersion:()=>1}));}
createRoot(document.getElementById('app')).render(React.createElement(React.StrictMode,null,React.createElement(App)));`;
const fixture=await startIrisFixture(entry),browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:390,height:850}}),errors=[];page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(5000);
try{
 await page.goto(fixture.origin);await page.getByRole('button',{name:'가공 목록 조회',exact:true}).click();await page.getByRole('button',{name:'계획에 추가',exact:true}).click();await page.getByRole('button',{name:'자동 실행',exact:true}).click();await page.getByRole('button',{name:'시작 전 점검',exact:true}).click();
 await page.getByText('정령의 날개 보유 30개',{exact:false}).waitFor();assert.deepEqual(await page.evaluate(()=>window.trial.calls),['altering','activity','inventory','altering','currencies']);
 assert.ok(await page.getByText('이 점검은 게임 행동을 시작하지 않아요.',{exact:false}).isVisible());assert.equal(await page.getByRole('button',{name:'작업 시작',exact:true}).count(),0);
 await page.evaluate(()=>window.trial.blocked=true);await page.getByRole('button',{name:'시작 전 점검',exact:true}).click();await page.getByText('게임 상태가 작업 가능 상태인지 확인하지 못했어요.',{exact:false}).waitFor();
 await page.evaluate(()=>{window.trial.blocked=false;window.trial.delay=true;window.trial.calls=[]});await page.getByRole('button',{name:'시작 전 점검',exact:true}).click();await page.waitForTimeout(50);await page.evaluate(()=>window.trial.setActive(false));await page.waitForTimeout(30);await page.evaluate(()=>window.trial.setActive(true));await page.evaluate(()=>{window.trial.delay=false;window.trial.pending.splice(0).forEach(resolve=>resolve())});await page.waitForTimeout(150);assert.deepEqual(await page.evaluate(()=>window.trial.calls),['activity'],'suspended inspection never continues later steps');
 assert.deepEqual(errors,[]);console.log('PASS actual start dry-run wings/status/read-only, unsafe game block, suspension cancels sequence, no execute button');
}finally{await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
