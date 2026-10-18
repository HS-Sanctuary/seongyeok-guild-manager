import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startIrisFixture} from './iris-ui.fixture.mjs';
const {chromium}=createRequire('C:/Users/Moon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const entry=`const React=require('react'),{createRoot}=require('react-dom/client'),{DesktopFloatingHub}=require('@/components/iris/DesktopFloatingHub');const state={mode:'floating',menuOpen:false,surface:'none',hotkeyAvailable:true,hotkeyLabel:'(Alt + ~)',layout:{anchor:{x:42.5,y:20,size:52},badge:{x:20,y:76,width:97,height:28},side:'right',vertical:'down',menu:[],panel:null,bubble:null}};createRoot(document.getElementById('app')).render(React.createElement('main',{className:'iris-desktop'},React.createElement(DesktopFloatingHub,{state,onCommand:()=>{},onDrag:()=>{}})));`;
const fixture=await startIrisFixture(entry),browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();await page.goto(fixture.origin);const badge=page.getByText('(Alt + ~)',{exact:true}),logo=page.getByRole('button',{name:'IRIS 메뉴',exact:true});
 await page.evaluate(()=>document.documentElement.style.setProperty('background','#1b222a','important'));
 for(const size of [18,20,22]){
  await page.evaluate(size=>document.documentElement.style.fontSize=size+'px',size);
  const box=await badge.boundingBox(),circle=await logo.boundingBox();assert.equal(circle.width,52);assert.equal(circle.height,52);assert(box.y>=circle.y+circle.height);
  const style=await badge.evaluate(node=>{const s=getComputedStyle(node),range=document.createRange();range.selectNodeContents(node);return {weight:Number(s.fontWeight),fontSize:parseFloat(s.fontSize),borderWidth:parseFloat(s.borderWidth),radius:parseFloat(s.borderRadius),color:s.color,background:s.backgroundColor,border:s.borderColor,textWidth:range.getBoundingClientRect().width,innerWidth:node.clientWidth};});
  assert(style.fontSize>=17.5,'reference-sized white glyphs must not look like a tiny caption');
  assert(style.borderWidth>=1.8,'reference frame uses a visible double-pixel light stroke');
  assert(style.weight>=700,'keycap text must be bold enough to read over the game');
  assert(style.radius>=box.height*.3,'keycap should have the reference rounded frame, not square corners');
  assert(style.textWidth<=style.innerWidth,'shortcut must stay readable inside the unchanged native hit region');
  const channels=text=>text.match(/[\d.]+/g).map(Number);
  const background=channels(style.background),border=channels(style.border),text=channels(style.color);
  assert(background.slice(0,3).every(c=>c<=55)&&(background[3]??1)>=.85,'reference uses a dark charcoal fill, not a pale translucent label');
  assert(border.slice(0,3).every(c=>c>=170)&&(border[3]??1)>=.85,'reference frame should stay bright enough over the game');
  assert(text.slice(0,3).every(c=>c>=240));
 }
 const circle=await logo.boundingBox(),box=await badge.boundingBox();
 assert(circle.x>=0&&circle.y>=0&&box.x>=0&&box.y+box.height<=page.viewportSize().height,'keycap and logo must remain on-screen');
 await page.screenshot({path:'.superpowers/artifacts/iris-floating-keycap.png',animations:'disabled',clip:{x:Math.max(0,box.x-8),y:Math.max(0,circle.y-8),width:box.width+16,height:box.y+box.height-circle.y+16}});
 console.log('PASS rounded high-contrast keycap / 18-20-22 fonts / native region fit / unchanged 52px logo');
}finally{await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
