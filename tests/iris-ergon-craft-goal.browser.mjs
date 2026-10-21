import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {startIrisFixture} from './iris-ui.fixture.mjs';
const {chromium}=createRequire(process.argv[2]??'C:/Users/sungw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json')('playwright');
const entry=`const React=require('react'),{createRoot}=require('react-dom/client'),{DesktopErgonExecution}=require('@/components/iris/DesktopErgonExecution');window.trial={requests:[],confirmed:0,current:null};let intent;
const api={lifeActionCapabilities:async()=>({quantityGathering:true,currentStop:true,quantityCrafting:true,maxCraftCount:5}),setLifeContext:async()=>{},prepareLifeAction:async value=>{intent=value;window.trial.requests.push(value);return {schemaVersion:3,nonce:'123e4567-e89b-12d3-a456-426614174000',expiresAt:Date.now()+120000,accountId:'a',characterId:'c',accountLabel:'한설',characterLabel:'영겁',action:'crafting',displayName:'검',expectedWings:5,wings:100-window.trial.confirmed*5,outputPerRun:1,owned:null,facility:null,completed:[],crafting:{craftCount:value.craftCount,outputPerCraft:1,expectedOutput:value.craftCount}};},confirmLifeAction:async()=>{const index=window.trial.confirmed++;const id='123e4567-e89b-12d3-a456-'+String(index).padStart(12,'0');window.trial.current={id,accountId:'a',characterId:'c',action:'crafting',displayName:'검',state:'completed',expectedWings:5,beforeWings:100-index*5,afterWings:95-index*5,afterOwned:null,message:null,crafting:{craftCount:intent.craftCount,outputPerCraft:1,expectedOutput:intent.craftCount}};return {schemaVersion:1,id,state:'running'};},cancelLifeAction:async()=>{},lifeActionState:async()=>({schemaVersion:window.trial.current&&!window.trial.current.crafting?1:3,busy:false,blocked:false,state:window.trial.current?'completed':'idle',current:window.trial.current}),lifeActionHistory:async()=>({schemaVersion:3,blocked:false,records:[]}),stopLifeAction:async()=>{throw Error('no gathering');}};
function App(){const [active,setActive]=React.useState(true);window.trial.setActive=setActive;return React.createElement('main',{className:'iris-desktop'},React.createElement(DesktopErgonExecution,{api,plan:{kind:'crafting',displayName:'검',targetQuantity:4,outputPerCraft:1},accountId:'a',characterId:'c',accountLabel:'한설',characterLabel:'영겁',active,locked:false}));}createRoot(document.getElementById('app')).render(React.createElement(App));`;
const fixture=await startIrisFixture(entry),browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:390,height:950}});page.setDefaultTimeout(4500);const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(fixture.origin);const prepare=page.getByRole('button',{name:'제작 실행 준비',exact:true});
 await prepare.click();assert.equal(await page.evaluate(()=>window.trial.requests[0].craftCount),4);
 await page.getByRole('button',{name:/게임 화면 확인 후/}).click();
 await page.getByText('제작 명령 완료 · 결과물 수량 확인 필요',{exact:true}).waitFor();
 await page.getByText('확인된 확보 0개 / 목표 4개 · 남은 수량 확인 필요',{exact:true}).waitFor();
 assert.equal(await page.getByRole('progressbar',{name:'추가 제작 진행'}).getAttribute('value'),'0');
 assert.ok(await prepare.isDisabled());assert.ok(await page.getByLabel('추가 제작 수량',{exact:true}).isDisabled());
 assert.equal(await page.getByRole('button',{name:'새 묶음 준비',exact:true}).count(),0);
 await page.waitForTimeout(2200);
 await page.evaluate(()=>window.trial.setActive(false));await page.waitForTimeout(100);await page.evaluate(()=>window.trial.setActive(true));
 assert.ok(await prepare.isDisabled());assert.equal(await page.getByRole('button',{name:'새 묶음 준비',exact:true}).count(),0);
 assert.equal(await page.evaluate(()=>window.trial.requests.length),1);assert.equal(await page.evaluate(()=>window.trial.confirmed),1);
 for(const width of [320,390,720]){await page.setViewportSize({width,height:950});await page.evaluate(()=>document.documentElement.style.fontSize='22px');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await page.evaluate(()=>delete window.trial.current.crafting);await page.waitForTimeout(2200);
 assert.ok(await page.getByText('제작 명령 완료 · 결과물 수량 확인 필요',{exact:true}).isVisible(),'older completed crafting receipts without quantity metadata cannot imply acquired output');
 await page.screenshot({path:'.superpowers/ergon-result-accuracy.png',fullPage:true});
 assert.deepEqual(errors,[]);console.log('PASS completed craft4 remains quantity-unconfirmed, progress0, no extra consumption/renew, hide/reopen and responsive; synthetic native only');
}catch(error){console.error((await page.locator('body').innerText()).slice(0,3800));throw error;}finally{await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
