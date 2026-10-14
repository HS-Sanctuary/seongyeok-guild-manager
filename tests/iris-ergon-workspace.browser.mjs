// Real ERGON UI; only native/game IO is synthetic. No actual game commands.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startIrisFixture} from './iris-ui.fixture.mjs';
const {chromium}=createRequire(process.argv[2]??'C:/Users/Moon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json')('playwright');
const entry=`const React=require('react'),{createRoot}=require('react-dom/client'),{DesktopErgon}=require('@/components/iris/DesktopErgon');
window.trial={commands:[],windows:[],blocked:false};const id='123e4567-e89b-12d3-a456-426614174000';
const api={setWorkspace:async expanded=>{window.trial.windows.push(expanded);return {expanded};},lifeActionCapabilities:async()=>({quantityGathering:true,currentStop:true,quantityCrafting:true,maxCraftCount:5}),readLifeReference:async(kind,displayName)=>({schemaVersion:1,kind,displayName,source:'installed-reference',modifiedAt:10000,outputPerUnit:1,complete:false,ingredients:[{name:'상급 목재',required:3}]}),setLifeContext:async()=>{},prepareLifeAction:async v=>{window.trial.commands.push(v);return {schemaVersion:3,nonce:id,expiresAt:Date.now()+120000,accountId:'a',characterId:'c',accountLabel:'한설',characterLabel:'영겁',action:'crafting',displayName:v.displayName,expectedWings:5,wings:71041,outputPerRun:1,owned:null,facility:null,completed:[],crafting:{craftCount:v.craftCount,outputPerCraft:1,expectedOutput:v.craftCount}};},confirmLifeAction:async()=>{throw Error('not approved');},cancelLifeAction:async()=>{},lifeActionState:async()=>({schemaVersion:1,busy:false,blocked:window.trial.blocked,state:'idle',current:null}),lifeActionHistory:async()=>({schemaVersion:1,blocked:window.trial.blocked,records:[{requestId:id,accountId:'a',characterId:'c',action:'crafting',displayName:'과거 제작품',expectedWings:5,startedAt:1700000000000,state:'unknown'}]}),stopLifeAction:async()=>{throw Error('not approved');}};
const windowApi=api.setWorkspace;api.setWorkspace=async expanded=>{const value=await windowApi(expanded);if(expanded&&window.trial.deferWindow)await new Promise(resolve=>window.trial.resolveWindow=resolve);return value;};
const read=async kind=>({schemaVersion:1,kind,observedAt:Date.now(),source:'official-cli',data:kind==='inventory'?{weight:726,maxWeight:930}:kind==='works'?{completedCount:7,items:[{name:'강철괴',facility:'금속 가공 시설',state:'Completed',completed:true,remainingSeconds:0}]}:kind==='materials'?{items:[{name:'상급 목재',category:'Ingredient',categoryName:null,location:'inventory',count:3,locked:false}]}:kind==='gathering'?{items:[{name:'통나무',toolOk:true}]}:{unlocked:true,items:[{name:kind==='crafting'?'라이트 크로스보우S':'상급 목재',available:false,producedPerUnit:1,reason:'not_enough_ingredient',missing:[{name:'상급 목재',required:3,owned:0}]}]}});
function App(){const [active,setActive]=React.useState(true),[locked,setLocked]=React.useState(false);window.trial.setActive=setActive;return React.createElement('main',{className:'iris-desktop'},React.createElement(DesktopErgon,{environment:'development',accountId:'a',characterId:'c',accountLabel:'한설',characterLabel:'영겁',active,locked,read,readCurrencies:async()=>({observedAt:new Date().toISOString(),items:[{name:'정령의 날개',amount:71041}]}),getContextVersion:()=>1,actions:api,onActionBusyChange:setLocked}));}createRoot(document.getElementById('app')).render(React.createElement(App));`;
const fixture=await startIrisFixture(entry),browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1240,height:950}});
page.setDefaultTimeout(5000);const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(fixture.origin);
 await page.getByRole('region',{name:'현재 캐릭터 생활 현황'}).getByText('71,041',{exact:true}).waitFor();
 await page.getByRole('button',{name:'제작 목록 조회',exact:true}).click();
 await page.getByLabel('목표 수량',{exact:true}).fill('3');await page.getByRole('button',{name:'계획에 추가',exact:true}).click();
 const focus=page.getByRole('region',{name:'선택 작업'});await focus.getByText('필요 9개 · 가방 3개 · 부족 6개',{exact:true}).waitFor();
 assert.ok(await focus.getByRole('button',{name:'제작 실행 준비',exact:true}).isVisible());
 assert.ok(await page.getByRole('region',{name:'작업 계획',exact:true}).getByLabel('품목 검색').isVisible(),'selection must not hide the catalog in the workbench');
 const colors=await page.evaluate(()=>['primary','add','neutral'].map(role=>{const el=document.querySelector('button[data-ergon-role="'+role+'"]');return el?getComputedStyle(el).backgroundColor:null;}));
 assert.ok(colors.every(Boolean));assert.equal(new Set(colors).size,3,'primary, add and ordinary actions need distinct treatments');
 await page.getByRole('button',{name:'넓은 작업화면',exact:true}).click();assert.deepEqual(await page.evaluate(()=>window.trial.windows),[true]);
 await page.getByRole('button',{name:'작은 작업화면',exact:true}).click();assert.deepEqual(await page.evaluate(()=>window.trial.windows),[true,false]);
 await page.getByRole('button',{name:'제작 실행 준비',exact:true}).click();assert.equal(await page.evaluate(()=>window.trial.commands[0].craftCount),3);await page.getByRole('button',{name:'준비 취소',exact:true}).click();
 await page.evaluate(()=>window.trial.blocked=true);await page.getByRole('button',{name:'기록 확인',exact:true}).waitFor();assert.ok(await page.getByRole('button',{name:'제작 실행 준비',exact:true}).isDisabled());
 await page.getByRole('button',{name:'기록 확인',exact:true}).click();await page.getByRole('region',{name:'보호 작업 기록',exact:true}).getByText('과거 제작품',{exact:false}).waitFor();
 assert.equal(await page.getByRole('button',{name:/해제|다시 실행/}).count(),0,'history navigation is not permission to resolve or retry');
 await page.getByRole('button',{name:'작업 계획',exact:true}).click();assert.equal(await page.getByLabel('추가 제작 수량',{exact:true}).inputValue(),'3');
 assert.equal(await page.getByText('다음 작업을 중지했어요. 이미 요청한 게임 작업의 결과는 계속 확인해요.',{exact:true}).count(),0,'idle tab switches must not claim an action was stopped');
 for(const theme of ['aureum','lumen','nemeton','vesper','rosarium','elysium'])for(const width of [320,390,720,1240]){
  await page.setViewportSize({width,height:950});await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;document.documentElement.style.fontSize='22px';},theme);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),theme+' '+width+' overflow');
 }
 await page.setViewportSize({width:1240,height:950});await page.evaluate(()=>{document.documentElement.dataset.theme='aureum';document.documentElement.style.fontSize='18px';});
 await page.waitForTimeout(800);await page.screenshot({path:'.superpowers/sdd/2026-10-14-ergon-command-workspace/workspace.png',fullPage:true});
 await page.getByRole('button',{name:'넓은 작업화면',exact:true}).click();await page.evaluate(()=>window.trial.setActive(false));await page.waitForFunction(()=>window.trial.windows.at(-1)===false);
 await page.evaluate(()=>{window.trial.setActive(true);window.trial.deferWindow=true;});await page.getByRole('button',{name:'넓은 작업화면',exact:true}).click();await page.waitForFunction(()=>typeof window.trial.resolveWindow==='function');
 await page.evaluate(()=>window.trial.setActive(false));await page.waitForFunction(()=>document.querySelector('.iris-ergon header button').disabled);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.evaluate(()=>window.trial.resolveWindow());await page.waitForFunction(()=>window.trial.windows.at(-1)===false,null,{timeout:5000});
 assert.equal(await page.evaluate(()=>window.trial.commands.length),1,'only the explicit prepare, no automatic consume');assert.deepEqual(errors,[]);
 console.log('PASS workspace: co-located catalog/quantity/needs/prepare, semantic actions, history guard, scoped expand/restore, 6 themes/320–1240; synthetic IO only');
}catch(error){console.error('Browser errors:',errors);console.error((await page.locator('body').innerText()).slice(0,2400));throw error;}finally{await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
