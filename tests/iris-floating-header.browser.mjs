import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {startIrisFixture} from './iris-ui.fixture.mjs';
const {chromium}=createRequire('C:/Users/Moon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const entry=`const React=require('react'),{createRoot}=require('react-dom/client'),{DesktopFloatingHub}=require('@/components/iris/DesktopFloatingHub'),{DesktopCenter}=require('@/components/iris/DesktopCenter');
const state={mode:'floating',surface:'kronos',menuOpen:false,layout:{width:470,height:700,anchor:{x:0,y:0,size:36},badge:{x:0,y:38,width:57,height:20},side:'right',vertical:'down',menu:[],bubble:null,panel:{x:50,y:0,width:420,height:680}},hotkeyAvailable:true,hotkeyLabel:'(Alt + ~)'};
createRoot(document.getElementById('app')).render(React.createElement('main',{className:'iris-desktop'},React.createElement(DesktopFloatingHub,{state,onCommand:()=>{},onDrag:()=>{}},React.createElement(DesktopCenter,{account:{id:'a',nickname:'한설',role:'member'},characters:[{id:'c',nickname:'열두글자캐릭터이름테스트',job:'장궁병'}],selected:null,pending:[],locked:false,saveStatus:null,onSelectCharacter:()=>{},onEdit:()=>{},contextActions:React.createElement('button',null,'설정')}))));`;
const fixture=await startIrisFixture(entry),browser=await chromium.launch({channel:'chrome',headless:true});
try{const page=await browser.newPage({viewport:{width:470,height:720}});await page.goto(fixture.origin);
 for(const font of [18,20,22]){
  await page.evaluate(f=>document.documentElement.style.fontSize=f+'px',font);await page.waitForTimeout(40);
  const header=await page.locator('.iris-context-header').boundingBox(),tabs=await page.locator('.iris-main-tabs').boundingBox();
  assert(tabs.y>=header.y+header.height-1,'Floating identity row overlaps main module tabs at '+font+'px');
  assert.equal(await page.locator('.iris-context-header').evaluate(node=>getComputedStyle(node).top),'0px','Floating header must not reserve the hidden sidebar titlebar offset');
 }
 await page.screenshot({path:'.superpowers/sdd/2026-10-18-iris-floating-dialogs/floating-header-clean.png'});
 console.log('PASS real character header/main tabs stack without the hidden titlebar offset at 18/20/22px');
}finally{await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
