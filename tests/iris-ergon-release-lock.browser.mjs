// Real release navigation, synthetic account/native IO; no game or database access.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startIrisFixture} from './iris-ui.fixture.mjs';
const {chromium}=createRequire('C:/Users/Moon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json')('playwright');
const entry=`const React=require('react'),{createRoot}=require('react-dom/client'),{DesktopFloatingHub}=require('@/components/iris/DesktopFloatingHub'),{DesktopCenter}=require('@/components/iris/DesktopCenter');
window.trial={commands:[],ergonRenders:0,tabs:[]};
const state={mode:'floating',menuOpen:true,surface:'kronos',hotkeyAvailable:true,hotkeyLabel:'Alt + ~',layout:{side:'right',vertical:'down',anchor:{x:4,y:4,size:36},badge:null,menu:[0,1,2,3].map(i=>({x:50+i*48,y:4,width:40,height:40})),panel:{x:4,y:60,width:650,height:700},bubble:null}};
function App(){const [externalSection,setExternalSection]=React.useState(null);window.trial.external=setExternalSection;return React.createElement('main',{className:'iris-desktop'},React.createElement(DesktopFloatingHub,{state,onCommand:c=>window.trial.commands.push(c),onDrag:()=>{}},React.createElement(DesktopCenter,{account:{id:'a',nickname:'한설'},characters:[],selected:null,pending:[],locked:false,saveStatus:null,onSelectCharacter:()=>{},onEdit:()=>{},externalSection,onTabChange:tab=>window.trial.tabs.push(tab),ergonPanel:()=>{window.trial.ergonRenders++;return React.createElement('div',{'data-ergon-session':true},'private workbench');}})))}createRoot(document.getElementById('app')).render(React.createElement(App));`;
const fixture=await startIrisFixture(entry),browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:800,height:850}});page.setDefaultTimeout(4000);
const errors=[];page.on('pageerror',error=>errors.push(error.message));
try{
 await page.goto(fixture.origin);await page.getByRole('navigation',{name:'상위 메뉴'}).waitFor();
 const main=page.getByRole('navigation',{name:'상위 메뉴'}).getByRole('button',{name:/에르곤/});
 const floating=page.getByRole('navigation',{name:'플로팅 메뉴'}).getByRole('button',{name:/에르곤/});
 assert.equal(await main.isDisabled(),true,'Main ERGON entry must be disabled before release');
 assert.equal(await floating.isDisabled(),true,'Floating ERGON entry must be disabled before release');
 assert.match(await main.innerText(),/준비중/);assert.match(await floating.getAttribute('aria-label'),/준비중/);
 assert.equal(await main.locator('svg[data-iris-icon="lock"]').count(),1);assert.equal(await floating.locator('svg[data-iris-icon="lock"]').count(),1);
 await main.evaluate(el=>el.click());await floating.evaluate(el=>el.click());
 assert.deepEqual(await page.evaluate(()=>window.trial.tabs),[]);assert.deepEqual(await page.evaluate(()=>window.trial.commands),[]);
 assert.equal(await page.evaluate(()=>window.trial.ergonRenders),0,'Even hidden ERGON sessions must not mount or query');
 await page.evaluate(()=>window.trial.external('ergon'));await page.waitForTimeout(70);
 assert.equal(await page.locator('[aria-label="IRIS 센터"]').getAttribute('data-active-tab'),'homework','Stale external/native ERGON identity must not select the workbench');
 assert.equal(await page.locator('[data-ergon-session]').count(),0);
 await page.getByRole('navigation',{name:'상위 메뉴'}).getByRole('button',{name:'시낙시스',exact:true}).click();
 assert.equal(await page.locator('[aria-label="IRIS 센터"]').getAttribute('data-active-tab'),'synaxis');
 await page.getByRole('navigation',{name:'플로팅 메뉴'}).getByRole('button',{name:'크로노스',exact:true}).click();
 assert.deepEqual(await page.evaluate(()=>window.trial.commands),['kronos']);
 assert.deepEqual(errors,[]);
 console.log('PASS ERGON release lock: padlocks, disabled navigation, no session mounting, stale external section rejected, other modules available');
}finally{await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
