import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startIrisFixture} from './iris-ui.fixture.mjs';
const {chromium}=createRequire(process.argv[2]??'C:/Users/sungw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json')('playwright');
const entry=`
const React=require('react'),{createRoot}=require('react-dom/client');
const {DesktopCenter}=require('@/components/iris/DesktopCenter');
const {DesktopAddonSettings}=require('@/components/iris/DesktopAddonSettings');
const {DesktopSaveStatus}=require('@/components/iris/DesktopSaveStatus');
const {DesktopStatsConfirmation}=require('@/components/iris/DesktopStatsConfirmation');
const {useDesktopAppearance}=require('@/components/iris/useDesktopAppearance');
const account={id:'a',nickname:'한설',role:'길드원'},characters=[{id:'c',nickname:'한설',job:'댄서'}];
const selected={accountId:'a',characterId:'c',details:{tasks:{daily:[],weekly:[],abyss:[],raid:[]},classes:[]}};
function App(){
const appearance=useDesktopAppearance('development','a');
const [entries,setEntries]=React.useState([]),[settings,setSettings]=React.useState(false),[previewUntil,setPreview]=React.useState(0),[now,setNow]=React.useState(Date.now()),[confirmation,setConfirmation]=React.useState(null),[compact,setCompact]=React.useState(false),[suspended,setSuspended]=React.useState(false),[modal,setModal]=React.useState(false);
React.useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),50);return()=>clearInterval(t)},[]);
window.trial={setEntries,setConfirmation,setSuspended,setModal,appearance,saves:window.trial?.saves??0,retries:window.trial?.retries??0};
const save=React.createElement(DesktopSaveStatus,{entries,characters,selected,now,locked:false,lastSaveConfirmation:confirmation,position:appearance.savePosition,preview:now<previewUntil,suspended,onSave:()=>{window.trial.saves++},onDiscard:()=>setEntries([]),onRecover:()=>{window.trial.retries++}});
return React.createElement(React.Fragment,null,modal&&React.createElement(DesktopStatsConfirmation,{target:characters[0],characters,job:'댄서',busy:false,canConfirm:true,onConfirm(){},onSelectCharacter(){},onCancel:()=>setModal(false)}),
React.createElement('div',{className:'iris-desktop'},React.createElement('button',{onClick:()=>setSettings(!settings)},'설정 열기'),React.createElement('button',{onClick:()=>setCompact(!compact)},'컴팩트 전환'),
React.createElement(DesktopCenter,{account,characters,selected,pending:[],locked:false,compact,settingsOpen:settings,settingsPanel:React.createElement(DesktopAddonSettings,{appearance,accountPanel:null,addonState:null,onPreferencesChange(){},onBack:()=>setSettings(false),onSavePreview:()=>setPreview(Date.now()+4000)}),saveStatus:save,onSelectCharacter(){},onEdit(){},synaxisPanel:()=>React.createElement('p',null,'시험 파티 화면')})));
}createRoot(document.getElementById('app')).render(React.createElement(App));`;
const fixture=await startIrisFixture(entry),browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:390,height:760}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
await page.goto(fixture.origin);await page.getByRole('button',{name:'에르곤',exact:true}).waitFor();
assert.equal(await page.locator('[data-iris-save-overlay]').count(),0);
await page.evaluate(()=>window.trial.appearance.setFontSize(18));await page.getByRole('button',{name:'시낙시스',exact:true}).click();await page.mouse.move(0,0);await page.waitForTimeout(310);
for(const name of ['크로노스']){const ratio=await page.getByRole('button',{name,exact:true}).evaluate(button=>{const range=document.createRange();range.selectNodeContents(button.querySelector('.iris-main-label-ko strong'));const title=range.getBoundingClientRect().width;range.selectNodeContents(button.querySelector('.iris-main-label-ko small'));return title/range.getBoundingClientRect().width});assert.ok(ratio>=.9&&ratio<=1.1,'Korean title and subtitle balanced '+name+' '+ratio);}
const ergonSpacing=await page.getByRole('button',{name:'에르곤',exact:true}).locator('strong').evaluate(n=>parseFloat(getComputedStyle(n).letterSpacing)/parseFloat(getComputedStyle(n).fontSize));assert.ok(ergonSpacing<=.2,'ERGON avoids over-spaced Korean title');
const layouts=[360,390,600,720],points=[6,13.5,22];
for(const width of layouts)for(const pt of points){
await page.setViewportSize({width,height:760});await page.evaluate(pt=>window.trial.appearance.setFontSize(pt*4/3),pt);
for(const name of ['크로노스','시낙시스','에르곤']){
await page.getByRole('button',{name,exact:true}).click();
assert.equal(await page.getByRole('button',{name,exact:true}).getAttribute('aria-pressed'),'true');
await page.getByRole('button',{name,exact:true}).hover();
await page.waitForTimeout(310);
const fit=await page.evaluate(()=>[...document.querySelectorAll('.iris-main-tabs button')].every(button=>{
const b=button.getBoundingClientRect(),text=button.querySelector(button.matches('[aria-pressed=true],:hover,:focus-visible')?'.iris-main-label-en':'.iris-main-label-ko');
const range=document.createRange();range.selectNodeContents(text);const t=range.getBoundingClientRect();return t.left>=b.left&&t.right<=b.right&&t.top>=b.top&&t.bottom<=b.bottom;
}));if(!fit){console.log(await page.evaluate(()=>[...document.querySelectorAll('.iris-main-tabs button')].map(button=>{const text=button.querySelector(button.matches('[aria-pressed=true],:hover,:focus-visible')?'.iris-main-label-en':'.iris-main-label-ko'),r=document.createRange();r.selectNodeContents(text);return {name:button.getAttribute('aria-label'),button:button.getBoundingClientRect().toJSON(),text:r.getBoundingClientRect().toJSON(),font:getComputedStyle(text).fontSize}})));await page.screenshot({path:'.superpowers/iris-nav-failure.png'});}assert.ok(fit,'navigation text fit '+width+'/'+pt+'/'+name);
const separated=await page.evaluate(()=>[...document.querySelectorAll('.iris-main-tabs button')].every(button=>{const mark=button.querySelector('.iris-main-tab-icon').getBoundingClientRect(),label=button.querySelector('.iris-main-tab-label').getBoundingClientRect();return label.left-mark.right>=4.5}));assert.ok(separated,'SVG and both text lines have breathing room '+width+'/'+pt+'/'+name);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow '+width+'/'+pt);
}
}
await page.setViewportSize({width:390,height:760});await page.evaluate(()=>window.trial.appearance.setFontSize(18));
await page.getByRole('button',{name:'에르곤',exact:true}).click();for(const name of ['작업 계획','재료 확보','자동 실행','작업 기록']){await page.getByRole('button',{name,exact:true}).click();assert.equal(await page.getByRole('button',{name,exact:true}).getAttribute('aria-pressed'),'true');}
assert.equal(await page.evaluate(()=>window.trial.saves),0);
await page.getByRole('button',{name:'설정 열기',exact:true}).click();
for(const [id,label] of [['top-left','왼쪽 위'],['bottom-left','왼쪽 아래'],['top-right','오른쪽 위'],['bottom-right','오른쪽 아래']]){
await page.getByRole('button',{name:label,exact:true}).click();await page.getByRole('button',{name:'미리보기',exact:true}).click();
const overlay=page.locator('[data-iris-save-overlay]');await overlay.waitFor();assert.equal(await overlay.getAttribute('data-position'),id);assert.equal(await overlay.getByRole('button').count(),0);
const b=await overlay.boundingBox();assert.ok(b.x>=0&&b.y>=0&&b.x+b.width<=390&&b.y+b.height<=760);assert.equal(await overlay.evaluate(n=>n.parentElement===document.body),true);
}
await page.waitForTimeout(4200);assert.equal(await page.locator('[data-iris-save-overlay]').count(),0);
await page.reload();await page.getByRole('button',{name:'설정 열기',exact:true}).click();assert.equal(await page.getByRole('button',{name:'오른쪽 아래',exact:true}).getAttribute('aria-pressed'),'true');
await page.getByRole('button',{name:'왼쪽 위',exact:true}).click();await page.reload();await page.getByRole('button',{name:'설정 열기',exact:true}).click();assert.equal(await page.getByRole('button',{name:'왼쪽 위',exact:true}).getAttribute('aria-pressed'),'true');
await page.getByRole('button',{name:'이전 화면',exact:true}).click();
await page.evaluate(()=>window.trial.setEntries([{characterId:'c',category:'daily',taskId:'t',requestId:'r',deadlineAt:Date.now()+15000,phase:'unknown'}]));
await page.getByRole('button',{name:'확인하고 재시도',exact:true}).click();assert.equal(await page.evaluate(()=>window.trial.retries),1);
await page.getByRole('button',{name:'지금 저장',exact:true}).click();assert.equal(await page.evaluate(()=>window.trial.saves),1);
await page.evaluate(()=>window.trial.setModal(true));await page.getByRole('dialog').waitFor();assert.equal(await page.locator('[data-iris-save-overlay]').isVisible(),false,'all real modal surfaces hide private save overlay');assert.equal(await page.getByRole('button',{name:'지금 저장',exact:true}).count(),0,'hidden save overlay omitted from accessible controls');await page.keyboard.press('Escape');await page.getByRole('button',{name:'지금 저장',exact:true}).waitFor();
await page.evaluate(()=>{const hidden=document.createElement('section');hidden.hidden=true;hidden.id='retained-modal-test';const dialog=document.createElement('div');dialog.role='dialog';dialog.setAttribute('aria-modal','true');hidden.append(dialog);document.body.append(hidden)});assert.equal(await page.locator('[data-iris-save-overlay]').isVisible(),true,'hidden retained modal does not hide live save status');await page.evaluate(()=>document.getElementById('retained-modal-test').remove());
for(const theme of ['lumen','elysium','aureum','nemeton','vesper','rosarium']){
await page.evaluate(t=>window.trial.appearance.setTheme(t),theme);assert.notEqual(await page.locator('[data-iris-save-overlay]').evaluate(n=>getComputedStyle(n).color),'rgba(0, 0, 0, 0)');
}
await page.evaluate(()=>window.trial.setSuspended(true));assert.equal(await page.locator('[data-iris-save-overlay]').count(),0);await page.evaluate(()=>window.trial.setSuspended(false));await page.getByRole('button',{name:'확인하고 재시도',exact:true}).waitFor();
await page.evaluate(()=>{window.trial.setEntries([]);window.trial.setConfirmation({nickname:'한설',characterId:'c',confirmedAt:Date.now()})});await page.getByRole('status').filter({hasText:'저장 완료'}).waitFor();await page.waitForTimeout(3200);assert.equal(await page.locator('[data-iris-save-overlay]').count(),0);
await page.getByRole('button',{name:'컴팩트 전환',exact:true}).click();await page.getByRole('button',{name:'에르곤',exact:true}).click();assert.equal(await page.locator('.iris-hud').getAttribute('data-panel-open'),'true');
await page.evaluate(()=>window.trial.setEntries([{characterId:'c',category:'daily',taskId:'t',requestId:'r',deadlineAt:Date.now()+15000,phase:'pending'}]));await page.getByRole('button',{name:'지금 저장',exact:true}).click();assert.equal(await page.locator('.iris-hud').getAttribute('data-panel-open'),'true');
await page.keyboard.press('Escape');assert.equal(await page.locator('.iris-hud').getAttribute('data-panel-open'),'false');
await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'시낙시스',exact:true}).focus();assert.equal(await page.locator('.iris-main-label-en').first().evaluate(n=>getComputedStyle(n).transitionDuration),'0s');
await page.evaluate(()=>{window.trial.setEntries([]);window.trial.appearance.setTheme('aureum')});await page.getByRole('button',{name:'에르곤',exact:true}).click();await page.waitForTimeout(350);await page.locator('.iris-center-content').screenshot({path:'.superpowers/iris-ergon-preview.png'});
const blocked=await browser.newContext();await blocked.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('test blocked storage')}}));const bp=await blocked.newPage();await bp.goto(fixture.origin);await bp.getByRole('button',{name:'설정 열기',exact:true}).click();await bp.getByRole('button',{name:'왼쪽 아래',exact:true}).click();assert.equal(await bp.getByRole('button',{name:'왼쪽 아래',exact:true}).getAttribute('aria-pressed'),'true');await bp.getByRole('alert').filter({hasText:'표시 설정을 저장하지 못했어요'}).waitFor();await blocked.close();
assert.deepEqual(errors,[]);console.log('PASS: real navigation 12 geometries, four corners, persistence, preview, recovery, success, compact, themes, reduced motion. No live IO.');
}finally{await browser.close();await new Promise(r=>fixture.server.close(r));}
