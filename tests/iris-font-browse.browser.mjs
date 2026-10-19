import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startIrisFixture} from './iris-ui.fixture.mjs';
const {chromium}=createRequire('C:/Users/Moon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');
const entry=`const React=require('react');const {createRoot}=require('react-dom/client');const {DesktopFontPicker}=require('../components/iris/DesktopFontPicker');function App(){const [value,setValue]=React.useState('');const [mode,setMode]=React.useState('ready');return React.createElement('main',{style:{padding:12,maxWidth:600}},React.createElement('button',{onClick:()=>setMode('empty')},'empty'),React.createElement('button',{onClick:()=>setMode('failure')},'failure'),React.createElement('button',{onClick:()=>setMode('busy')},'loading'),React.createElement(DesktopFontPicker,{value,onChoose:name=>{setValue(name);return name!=='Rejected'},fonts:mode==='failure'?null:mode==='empty'?[]:['Alpha','Very Long Font Family Name Without Hidden Text','한글 글꼴 이름 전체 표시',...Array.from({length:300},(_,i)=>'Font '+i),'Rejected'],busy:mode==='busy',error:mode==='failure'?'목록을 읽지 못했어요.':'',refresh:()=>setMode('ready')}));}createRoot(document.getElementById('app')).render(React.createElement(App));`;
const {server,origin}=await startIrisFixture(entry);
const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto(origin);
 await page.evaluate(()=>{window.parentEscapeCount=0;document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!event.defaultPrevented)window.parentEscapeCount++;});});
 await page.getByRole('button',{name:'설치 글꼴 선택',exact:true}).click();
 assert.equal(await page.getByRole('option').count(),305);
 assert.equal(await page.getByRole('option',{name:'기본',exact:true}).evaluate(el=>el===document.activeElement),true,'opening focuses browsable list, not search');
 await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 assert.match(await page.getByRole('button',{name:'설치 글꼴 선택',exact:true}).textContent(),/Alpha/);
 assert.match(await page.getByLabel('선택 글꼴 미리보기').textContent(),/성역/);
 await page.getByRole('button',{name:'설치 글꼴 선택',exact:true}).click();
 await page.keyboard.press('End');assert.equal(await page.getByRole('option',{name:'Rejected',exact:true}).evaluate(el=>el===document.activeElement),true);
 await page.keyboard.press('Home');assert.equal(await page.getByRole('option',{name:'기본',exact:true}).evaluate(el=>el===document.activeElement),true);
 await page.getByRole('combobox',{name:'글꼴 검색'}).fill('Font');await page.keyboard.press('Home');
 assert.equal(await page.getByRole('combobox',{name:'글꼴 검색'}).evaluate(el=>el===document.activeElement&&el.selectionStart===0),true,'search Home retains text editing focus');
 await page.keyboard.press('End');assert.equal(await page.getByRole('combobox',{name:'글꼴 검색'}).evaluate(el=>el===document.activeElement&&el.selectionStart===4),true,'search End retains text editing focus');
 await page.getByRole('combobox',{name:'글꼴 검색'}).fill('Font 299');await page.keyboard.press('Enter');
 assert.match(await page.getByRole('button',{name:'설치 글꼴 선택',exact:true}).textContent(),/Font 299/);
 await page.getByRole('button',{name:'설치 글꼴 선택',exact:true}).click();
 await page.getByRole('combobox',{name:'글꼴 검색'}).fill('no such font');assert.equal(await page.getByRole('option').count(),0);
 await page.keyboard.press('Escape');assert.equal(await page.getByRole('listbox').count(),0);
 assert.equal(await page.evaluate(()=>window.parentEscapeCount),0,'font list consumes Escape before parent settings handler');
 assert.equal(await page.getByRole('button',{name:'설치 글꼴 선택',exact:true}).evaluate(el=>el===document.activeElement),true);
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.parentEscapeCount),1,'closed list leaves parent Escape available');
 await page.getByRole('button',{name:'기본 글꼴로 초기화'}).click();
 for(const width of [320,390,768,1280])for(const size of [18,20,22]){
  await page.setViewportSize({width,height:800});await page.evaluate(size=>document.documentElement.style.fontSize=size+'px',size);
  await page.getByRole('button',{name:'설치 글꼴 선택',exact:true}).click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width}/${size} overflow`);
  assert.equal(await page.getByRole('listbox').evaluate(el=>el.scrollHeight>el.clientHeight),true);
  await page.getByRole('option',{name:'Font 299',exact:true}).click();
 }
 await page.getByRole('button',{name:'설치 글꼴 선택',exact:true}).click();await page.getByRole('button',{name:'empty',exact:true}).click();assert.equal(await page.getByRole('listbox').count(),0);
 await page.getByRole('button',{name:'설치 글꼴 선택',exact:true}).click();assert.match(await page.locator('.iris-font-picker').textContent(),/설치 글꼴이 없어요/);
 await page.getByRole('button',{name:'failure',exact:true}).click();assert.match(await page.locator('.iris-font-picker').textContent(),/읽지 못했어요/);
 await page.getByRole('button',{name:'설치 글꼴 새로고침'}).click();await page.getByRole('button',{name:'loading',exact:true}).click();assert.equal(await page.getByRole('button',{name:'설치 글꼴 새로고침'}).isDisabled(),true);
 assert.deepEqual(errors,[]);console.log('PASS installed font browse, keyboard arrows/Home/End/Enter/Escape, filtering, preview, states and 12 responsive sizes');
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
