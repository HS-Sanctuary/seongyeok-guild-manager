import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startIrisFixture} from './iris-ui.fixture.mjs';
const {chromium}=createRequire('C:/Users/Moon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const entry=`const React=require('react'),{createRoot}=require('react-dom/client'),{DesktopErgon}=require('@/components/iris/DesktopErgon');
window.trial={commands:[]};
const api={lifeActionCapabilities:async()=>({quantityGathering:true,currentStop:true,quantityCrafting:true,maxCraftCount:5}),setLifeContext:async()=>{},prepareLifeAction:async value=>{window.trial.commands.push(value);throw Error('not approved');},confirmLifeAction:async()=>{throw Error('not approved');},cancelLifeAction:async()=>{},lifeActionState:async()=>({schemaVersion:1,busy:false,blocked:false,state:'idle',current:null}),lifeActionHistory:async()=>({schemaVersion:1,blocked:false,records:[]}),stopLifeAction:async()=>{throw Error('not approved');}};
const read=async kind=>({schemaVersion:1,kind,observedAt:Date.now(),source:'official-cli',data:kind==='inventory'?{weight:45,maxWeight:930}:kind==='works'?{completedCount:0,items:[]}:kind==='materials'?{items:[]}:kind==='gathering'?{items:[{name:'통나무',toolOk:true}]}:{unlocked:true,items:[{name:kind==='crafting'?'목검':'가죽+',available:true,producedPerUnit:kind==='crafting'?1:3,reason:null,missing:[]}]}});
createRoot(document.getElementById('app')).render(React.createElement('main',{className:'iris-desktop'},React.createElement(DesktopErgon,{environment:'development',accountId:'a',characterId:'c',accountLabel:'한설',characterLabel:'한설',active:true,locked:false,read,readCurrencies:async()=>({observedAt:new Date().toISOString(),items:[{name:'정령의 날개',amount:1000}]}),getContextVersion:()=>1,actions:api})));`;
const fixture=await startIrisFixture(entry),browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 const page=await browser.newPage({viewport:{width:390,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(fixture.origin);
 const picker=page.getByRole('region',{name:'작업 계획',exact:true});await picker.waitFor();
 assert.equal(await picker.getByLabel('품목 검색',{exact:true}).isVisible(),true,'An empty workbench must show item selection directly, not hide it below an empty cart');
 const help=picker.getByRole('button',{name:'품목 선택 도움말',exact:true});await help.click();await picker.getByRole('note',{name:'품목 선택',exact:true}).waitFor();
 await page.keyboard.press('Escape');assert.equal(await help.getAttribute('aria-expanded'),'false');
 await help.click();await picker.getByLabel('목표 수량',{exact:true}).click();assert.equal(await help.getAttribute('aria-expanded'),'false','Outside click dismisses help without dismissing the module');
 await picker.getByRole('button',{name:'제작 목록 조회',exact:true}).click();await picker.getByLabel('목표 수량',{exact:true}).fill('10');await picker.getByRole('button',{name:'작업 선택',exact:true}).click();
 const queue=page.getByRole('region',{name:'전체 작업 대기열',exact:true});await queue.getByRole('button',{name:'목검 선택',exact:true}).waitFor();assert.equal(await queue.getByLabel('목검 추가 수량',{exact:true}).inputValue(),'10');
 await page.getByRole('region',{name:'선택 작업',exact:true}).getByText('목검',{exact:true}).waitFor();
 assert.deepEqual(await page.evaluate(()=>window.trial.commands),[],'Selecting and editing work must not consume materials');
 for(const width of [320,390,768,1280])for(const size of [18,20,22]){await page.setViewportSize({width,height:1000});await page.evaluate(size=>document.documentElement.style.fontSize=size+'px',size);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`overflow ${width}/${size}`);}
 await page.screenshot({path:join(tmpdir(),'iris-ergon-quick-work.png'),fullPage:true});assert.deepEqual(errors,[]);
 console.log('PASS direct empty workbench, contextual help Escape/outside, item→quantity→selected work, no commands, 12 width/font combinations');
}finally{await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
