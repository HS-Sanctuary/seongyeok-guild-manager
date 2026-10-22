import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startIrisFixture} from './iris-ui.fixture.mjs';
const {chromium}=createRequire(process.argv[2])('playwright');
const entry=`const React=require('react'),{createRoot}=require('react-dom/client'),{DesktopFloatingHub}=require('@/components/iris/DesktopFloatingHub'),{DesktopCenter}=require('@/components/iris/DesktopCenter'),{DesktopSaveStatus}=require('@/components/iris/DesktopSaveStatus');
const now=Date.now(),pending={kind:'task',characterId:'c',category:'weekly',taskId:'t',requestId:'one',deadlineAt:now+12000,phase:'pending'};
const initial={mode:'floating',menuOpen:false,surface:'kronos',dialogOpen:false,layout:{anchor:{x:0,y:0,size:36},badge:{x:0,y:38,width:57,height:20},menu:[],panel:{x:50,y:0,width:420,height:600},bubble:null,side:'right',vertical:'down'},hotkeyAvailable:true,hotkeyLabel:'(Alt + ~)'};
window.trial={saves:0,discards:0,commands:[],recoveries:[]};
function App(){const [state,setState]=React.useState(initial),[entries,setEntries]=React.useState([pending]),[clock,setClock]=React.useState(now),[confirmation,setConfirmation]=React.useState(null),[selected,setSelected]=React.useState(null);
window.trial.finish=()=>{setEntries([]);setConfirmation({nickname:'시험',confirmedAt:now});};window.trial.tick=()=>setClock(now+3000);window.trial.restore=()=>setEntries([pending]);window.trial.unknown=()=>setEntries([{...pending,phase:'unknown'}]);window.trial.fit=width=>setState(s=>({...s,layout:{...s.layout,panel:{x:0,y:0,width,height:600}}}));
const command=async c=>{window.trial.commands.push(c);setState(s=>({...s,surface:c==='kronos'?'kronos':'none',menuOpen:c==='menu'}));};window.trial.command=command;
window.trial.mixed=()=>{setSelected({characterId:'b',details:{tasks:{},classes:[]}});setEntries([{...pending,phase:'unknown'},{...pending,characterId:'b',requestId:'two'}]);};
return React.createElement('main',{className:'iris-desktop'},React.createElement(DesktopFloatingHub,{state,onCommand:command,onDrag(){}},React.createElement(DesktopCenter,{account:{id:'a',nickname:'한설'},characters:[{id:'c',nickname:'시험',job:'기사'}],selected:null,pending:[],locked:false,onSelectCharacter(){},onEdit(){},saveStatus:React.createElement(DesktopSaveStatus,{inline:true,entries,selected,now:clock,lastSaveConfirmation:confirmation,locked:false,characters:[{id:'c',nickname:'시험'}],onSave:()=>window.trial.saves++,onDiscard:()=>{window.trial.discards++;setEntries([]);},onRecover:(id,action)=>window.trial.recoveries.push({id,action})})})));}
createRoot(document.getElementById('app')).render(React.createElement(App));`;
const fixture=await startIrisFixture(entry),browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 const page=await browser.newPage({viewport:{width:520,height:680}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(fixture.origin);
 const save=page.getByRole('region',{name:'저장 상태',exact:true});await save.waitFor();
 assert.equal(await save.evaluate(el=>el.closest('.iris-context-header')!==null),true,'Save must live in the sticky header, not cover tasks at the bottom');
 const box=await save.boundingBox(),character=await page.getByRole('button',{name:'캐릭터 선택',exact:true}).boundingBox();
 assert.ok(box.y+box.height<=character.y,'Save strip must precede character selection');assert.ok(box.height<=40,'Ordinary pending saves must use one compact row');
 assert.match(await save.innerText(),/저장 대기 1개 · 12초/);
 for(const width of [320,390,520]){await page.setViewportSize({width,height:680});await page.evaluate(width=>window.trial.fit(width),width);for(const size of [18,20,22]){await page.evaluate(size=>document.documentElement.style.fontSize=size+'px',size);assert.equal(await save.evaluate(el=>el.scrollWidth<=el.clientWidth),true,`Save actions must not clip at ${width}/${size}`);assert.ok((await save.boundingBox()).height<=44,`One pending row at ${width}/${size}: ${JSON.stringify(await save.evaluate(el=>[el.getBoundingClientRect().toJSON(),...Array.from(el.querySelectorAll('.iris-save-actions>*'),x=>({text:x.textContent,rect:x.getBoundingClientRect().toJSON()}))]))}`);}}
 await page.screenshot({path:join(tmpdir(),'iris-floating-save-strip.png')});
 await page.evaluate(()=>window.trial.tick());await page.waitForFunction(()=>document.querySelector('[aria-label="저장 상태"]').textContent.includes('9초'));
 await save.getByRole('button',{name:'지금 저장',exact:true}).click();assert.equal(await page.evaluate(()=>window.trial.saves),1);assert.deepEqual(await page.evaluate(()=>window.trial.commands),[]);
 await page.evaluate(()=>window.trial.finish());await save.waitFor({state:'hidden'});
 await page.evaluate(()=>window.trial.restore());await save.getByRole('button',{name:'버리기',exact:true}).click();await save.waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>window.trial.discards),1);
 await page.evaluate(()=>window.trial.unknown());await save.getByText('확인 필요 1개',{exact:true}).waitFor();
 assert.equal(await save.getByRole('button',{name:'지금 저장',exact:true}).isDisabled(),true,'Uncertain saves must not look like an ordinary retry');
 await save.getByText('확인 필요 1개',{exact:true}).click();await save.getByRole('button',{name:'확인하고 재시도',exact:true}).click();assert.deepEqual(await page.evaluate(()=>window.trial.recoveries),[{id:'one',action:'retry'}]);
 await page.evaluate(()=>window.trial.mixed());await page.waitForFunction(()=>document.querySelector('[aria-label="저장 상태"]').textContent.includes('저장 확인 필요 2개'));assert.equal(await save.getByRole('button',{name:'지금 저장',exact:true}).isEnabled(),true,'Another character unknown must not block selected-character pending saves');
 await page.evaluate(()=>window.trial.command('menu'));await save.waitFor({state:'hidden'});
 await page.evaluate(()=>window.trial.command('kronos'));await save.waitFor({state:'visible'});
 assert.deepEqual(errors,[]);console.log('PASS floating top save strip: compact header order, countdown, save/discard, completion hiding, unknown recovery and menu visibility');
}finally{await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
