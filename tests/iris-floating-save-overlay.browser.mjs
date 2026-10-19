import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startIrisFixture} from './iris-ui.fixture.mjs';
const {chromium}=createRequire('C:/Users/Moon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const entry=`const React=require('react'),{createRoot}=require('react-dom/client'),{DesktopFloatingHub}=require('@/components/iris/DesktopFloatingHub'),{DesktopSaveStatus}=require('@/components/iris/DesktopSaveStatus'),{useDesktopFloatingDialogs}=require('@/components/iris/useDesktopFloatingDialogs');
const pending={kind:'task',characterId:'c',category:'weekly',taskId:'t',requestId:'pending-one',deadlineAt:Date.now()+15000,phase:'pending'};
const initial={mode:'floating',menuOpen:false,surface:'kronos',dialogOpen:false,layout:{anchor:{x:0,y:0,size:36},badge:{x:0,y:38,width:57,height:20},menu:Array.from({length:5},(_,i)=>({x:50,y:i*42,width:36,height:36})),panel:{x:50,y:0,width:420,height:600},bubble:null,side:'right',vertical:'down'},hotkeyAvailable:true,hotkeyLabel:'(Alt + ~)'};
window.trial={commands:[],saves:0,discards:0};
function App(){const [state,setState]=React.useState(initial),[position,setPosition]=React.useState('bottom-right'),[entries,setEntries]=React.useState([pending]);
const command=React.useCallback(async c=>{if(c.startsWith('dialog-'))return;window.trial.commands.push(c);setState(s=>({...s,menuOpen:c==='menu'?!s.menuOpen:false,surface:c==='kronos'?'kronos':'none',layout:{...s.layout,panel:c==='kronos'?initial.layout.panel:null}}));},[]);
useDesktopFloatingDialogs(state,command);window.trial.setPosition=setPosition;window.trial.command=command;window.trial.normal=()=>setState(s=>({...s,mode:'normal',menuOpen:false}));window.trial.finish=()=>setEntries([]);window.trial.entries=entries;
return React.createElement('main',{className:'iris-desktop'},React.createElement(DesktopFloatingHub,{state,onCommand:command,onDrag(){}},React.createElement('div',{style:{height:1100}},'숙제 내용'),React.createElement(DesktopSaveStatus,{entries,now:Date.now(),locked:false,characters:[{id:'c',nickname:'시험'}],position,onSave:()=>window.trial.saves++,onDiscard:()=>{window.trial.discards++;setEntries([])},onRecover(){}})));}
createRoot(document.getElementById('app')).render(React.createElement(App));`;
const fixture=await startIrisFixture(entry),browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 const page=await browser.newPage({viewport:{width:520,height:680}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(fixture.origin);
 await page.getByRole('button',{name:'지금 저장',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.trial.saves),1);
 assert.deepEqual(await page.evaluate(()=>window.trial.commands),[],'Save portal must be inside the floating interaction surface, not an outside close');
 for(const position of ['top-left','top-right','bottom-left','bottom-right']){
  await page.evaluate(p=>window.trial.setPosition(p),position);
  await page.waitForFunction(()=>{const overlay=document.querySelector('[data-iris-save-overlay]'),panel=document.querySelector('.iris-floating-workspace');if(!overlay||!panel)return false;const a=overlay.getBoundingClientRect(),b=panel.getBoundingClientRect();return a.left>=b.left&&a.top>=b.top&&a.right<=b.right&&a.bottom<=b.bottom});
 }
 await page.locator('.iris-floating-workspace').evaluate(el=>el.scrollTop=500);
 assert.equal(await page.getByRole('button',{name:'지금 저장',exact:true}).isVisible(),true,'Save stays visible while reading scrolled content');
 await page.evaluate(()=>window.trial.command('menu'));
 await page.locator('[data-iris-save-overlay]').waitFor({state:'hidden'});
 await page.getByRole('navigation',{name:'플로팅 메뉴'}).getByRole('button',{name:'크로노스',exact:true}).waitFor({state:'visible'});
 assert.equal(await page.evaluate(()=>window.trial.entries[0].requestId),'pending-one','Hiding overlay must retain pending save');
 await page.getByRole('button',{name:'크로노스',exact:true}).click();
 await page.getByRole('button',{name:'지금 저장',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.trial.saves),2,'Reopened module must remain immediately interactive');
 await page.evaluate(()=>window.trial.normal());
 await page.getByRole('button',{name:'지금 저장',exact:true}).click();
 assert.equal(await page.evaluate(()=>window.trial.saves),3,'Normal sidebar saving must stay interactive after a floating transition');
 await page.evaluate(()=>window.trial.finish());await page.waitForFunction(()=>!document.querySelector('[data-iris-save-overlay]'));
 assert.deepEqual(errors,[]);console.log('PASS floating manual-save stays open, four bounded positions, scroll, menu hiding, pending preservation and reopen');
}finally{await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
