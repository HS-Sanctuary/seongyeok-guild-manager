import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startIrisFixture} from './iris-ui.fixture.mjs';
const require=createRequire('C:/Users/Moon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json');
const {chromium}=require('playwright');
const entry=`const React=require('react'),{createRoot}=require('react-dom/client');
const {floatingShortcutLabel}=require('@/lib/irisFloating');const {DesktopFloatingHub}=require('@/components/iris/DesktopFloatingHub'),{DesktopFloatingSettings}=require('@/components/iris/DesktopFloatingSettings');
function App(){const [state,setState]=React.useState({schemaVersion:1,mode:'floating',menuOpen:true,surface:'none',revision:1,layout:{width:360,height:640,anchor:{x:20,y:20,size:52},badge:{x:10,y:76,width:79,height:28},side:'right',vertical:'down',menu:Array.from({length:5},(_,i)=>({x:110,y:i*44,width:36,height:36})),bubble:null,panel:{x:0,y:220,width:360,height:420}},preferences:{iconSize:52,opacity:80,modifiers:1,key:192,windowedFloating:false},hotkeyLabel:'(Alt + ~)',hotkeyAvailable:true,persistent:true});
const [closing,close]=React.useState(false);return React.createElement('main',{className:'iris-desktop'},React.createElement(DesktopFloatingHub,{state,onDrag:()=>{},onExit:()=>{window.exits=(window.exits||0)+1;close(true);},exitDisabled:closing,onCommand:c=>setState(s=>({...s,menuOpen:c==='menu'?!s.menuOpen:false,surface:c==='settings'?'settings':'none'}))},React.createElement(DesktopFloatingSettings,{state,onChange:p=>{setState(s=>{const preferences={...s.preferences,...p};window.saved=preferences;return {...s,preferences,hotkeyLabel:floatingShortcutLabel(preferences)};});}})));}
createRoot(document.getElementById('app')).render(React.createElement(App));`;
const fixture=await startIrisFixture(entry),browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:700}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(fixture.origin);
 const labels=await page.getByRole('navigation',{name:'플로팅 메뉴'}).getByRole('button').evaluateAll(rows=>rows.map(r=>r.getAttribute('aria-label')));
 assert.deepEqual(labels,['크로노스','시낙시스','에르곤','설정','종료']);
 await page.getByRole('button',{name:'종료',exact:true}).click();assert.equal(await page.evaluate(()=>window.exits),1);
 assert.equal(await page.getByRole('button',{name:'종료',exact:true}).isDisabled(),true);
 await page.screenshot({path:'.superpowers/artifacts/iris-floating-exit-menu.png'});
 await page.getByRole('button',{name:'설정',exact:true}).click();
 await page.getByLabel('게임 창모드에서도 자동 플로팅').check();assert.equal((await page.evaluate(()=>window.saved)).windowedFloating,true);
 await page.getByLabel('플로팅 아이콘 크기').fill('68');assert.equal((await page.evaluate(()=>window.saved)).windowedFloating,true);
 await page.getByLabel('게임 창모드에서도 자동 플로팅').uncheck();assert.equal((await page.evaluate(()=>window.saved)).windowedFloating,false);
 await page.screenshot({path:'.superpowers/artifacts/iris-floating-windowed-settings.png'});
 await page.getByLabel('단축키 조합').selectOption('6');await page.getByLabel('단축키 키').selectOption('75');await page.getByRole('button',{name:'단축키 적용',exact:true}).click();assert.equal(await page.locator('.iris-floating-keycap').textContent(),'Ctrl + Shift + K');
 assert.deepEqual(errors,[]);console.log('PASS fifth exit invokes guarded close callback once; windowed preference toggles and survives other edits');
}finally{await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
