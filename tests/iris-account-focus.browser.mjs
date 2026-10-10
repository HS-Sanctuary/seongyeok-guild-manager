// Real React components in an isolated, network-blocked document; no API or native channel.
// node tests/iris-account-focus.browser.mjs <bundled Node package.json>
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import ts from 'typescript';

const {chromium}=createRequire(process.argv[2])('playwright');
const dialogAvailable=existsSync('components/iris/DesktopFocusDialog.tsx');
const entry=`
const React=require('react');
const {createRoot}=require('react-dom/client');
const {DesktopTitlebar}=require('../components/iris/DesktopTitlebar.tsx');
const {DesktopContextActions}=require('../components/iris/DesktopContextActions.tsx');
const {DesktopAccountPanel}=require('../components/iris/DesktopAccountPanel.tsx');
const DesktopFocusDialog=${dialogAvailable?"require('../components/iris/DesktopFocusDialog.tsx').DesktopFocusDialog":"({children})=>children"};
const h=React.createElement;
window.fixture={failSwitch:true,failLogin:true,failLogout:true,switches:[],logins:0,logouts:0,hold:false,dismissDisabled:false};
function App(){
 const [open,setOpen]=React.useState(false),[account,setAccount]=React.useState({id:'a',nickname:'한설',role:'길드원'}),[revision,setRevision]=React.useState(0);
 window.fixture.rerender=()=>setRevision(v=>v+1);
 const remembered=[{id:'a',nickname:'한설',role:'길드원'},{id:'b',nickname:'열두글자닉네임확인중',role:'길드원'}];
 return h(React.Fragment,null,
  h(DesktopTitlebar,{onDrag(){},onMinimize(){},onClose(){}}),
  h(DesktopContextActions,{onSettings(){},onAccount(){setOpen(v=>!v);},accountOpen:open}),
  h('button',{id:'outside',onClick(){throw Error('Background action must not receive a dialog click');}},'배경 작업'),
  open&&h(DesktopFocusDialog,{title:'생텀 계정',onClose(){setOpen(false);},dismissDisabled:window.fixture.dismissDisabled},
    h(DesktopAccountPanel,{account,remembered,busy:false,onClose(){setOpen(false);},
     async onSwitch(id){window.fixture.switches.push(id);if(window.fixture.hold)await new Promise(r=>{window.fixture.release=r;});if(window.fixture.failSwitch)return false;setAccount(remembered.find(a=>a.id===id));return true;},
     async onLogin(){window.fixture.logins++;return !window.fixture.failLogin;},
     async onLogout(){window.fixture.logouts++;return !window.fixture.failLogout;}})),
  h('p',{id:'active-account'},account.nickname),h('p',{hidden:true},revision));
}
createRoot(document.getElementById('app')).render(h(App));`;

// Minimal test-only bundler runs the actual TSX and installed React in the browser.
function bundle(source){
  const modules=[],ids=new Map();
  function visit(file,provided){
    if(ids.has(file))return ids.get(file);
    const id=modules.length;ids.set(file,id);modules.push(null);
    const raw=provided??readFileSync(file,'utf8');
    const code=['.ts','.tsx'].includes(extname(file))?ts.transpileModule(raw,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true},fileName:file}).outputText:raw;
    const deps={};
    for(const match of code.matchAll(/\brequire\(['"]([^'"]+)['"]\)/g)){
      const name=match[1];if(name in deps)continue;
      if(name.endsWith('.css')){deps[name]=visit(resolve('tests/__empty.css.js'),'module.exports={};');continue;}
      let dependency;
      if(name.startsWith('@/')||name.startsWith('.')){const base=name.startsWith('@/')?resolve(name.slice(2)):resolve(dirname(file),name);dependency=[base,base+'.ts',base+'.tsx'].find(existsSync);}
      else dependency=createRequire(file).resolve(name);
      assert.ok(dependency,'Unresolved test dependency '+name);deps[name]=visit(dependency);
    }
    modules[id]=`[function(require,module,exports){${code}\n},${JSON.stringify(deps)}]`;return id;
  }
  const root=visit(resolve('tests/__account-browser-entry.js'),source);
  return `(function(){const process={env:{NODE_ENV:'production'}};const modules=[${modules.join(',')}],cache={};function run(id){if(cache[id])return cache[id].exports;const module=cache[id]={exports:{}};const [fn,deps]=modules[id];fn(name=>run(deps[name]),module,module.exports);return module.exports;}run(${root});})();`;
}

const browser=await chromium.launch({channel:'msedge',headless:true});
const context=await browser.newContext({viewport:{width:390,height:650}});
await context.route('**/*',route=>route.abort('blockedbyclient'));
const page=await context.newPage(),errors=[];
page.on('pageerror',error=>errors.push(error.message));
page.setDefaultTimeout(4000);
const css=readFileSync('app/iris/desktop/desktop.css','utf8')+(existsSync('components/iris/focus-dialog.css')?readFileSync('components/iris/focus-dialog.css','utf8'):'');
try{
 await page.setContent(`<style>:root{font-size:18px;--panel:#181822;--inner-box:#242432;--text-main:#f5f5fb;--text-muted:#babacd;--accent:#d8b567;--panel-border:#646475}*{box-sizing:border-box}body{margin:0}${css}</style><div id="app"></div>`);
 await page.addScriptTag({content:bundle(entry)});
 const trigger=page.getByRole('button',{name:'계정',exact:true});
 // The current implementation has no usable account entry point: this is the first RED.
 assert.equal(await trigger.count(),1,'Account titlebar entry point must exist');
 await trigger.focus();await trigger.click();
 const dialog=page.getByRole('dialog',{name:'생텀 계정',exact:true});await dialog.waitFor();
 assert.equal(await dialog.getByRole('button',{name:'열두글자닉네임확인중',exact:true}).isVisible(),true);
 assert.equal(await dialog.getByRole('button',{name:'계정 전환',exact:true}).count(),0);
 assert.equal(await dialog.evaluate(e=>e.contains(document.activeElement)),true,'Opening must focus within the dialog');
 await dialog.getByRole('button',{name:'열두글자닉네임확인중',exact:true}).click();
 await dialog.getByRole('alert').waitFor();
 assert.equal(await dialog.count(),1,'A failed switch must preserve the dialog');
 assert.equal(await page.locator('#active-account').textContent(),'한설','A failed switch must preserve the account');
 await page.evaluate(()=>{window.fixture.hold=true;});
 const other=dialog.getByRole('button',{name:'열두글자닉네임확인중',exact:true});await other.click();
 assert.equal(await other.isDisabled(),true,'An awaited switch must disable duplicate actions');
 await page.evaluate(()=>{window.fixture.release();window.fixture.hold=false;});
 await page.waitForFunction(()=>!document.querySelector('[aria-label="계정 전환 목록"] button:last-of-type')?.disabled);
 assert.deepEqual(await page.evaluate(()=>window.fixture.switches),['b','b']);
 await dialog.getByRole('button',{name:'다른 계정 로그인',exact:true}).click();
 await dialog.getByLabel('대표 캐릭터 닉네임',{exact:true}).fill('합성계정');
 await dialog.getByLabel('접속 코드',{exact:true}).fill('synthetic-only');
 await dialog.getByRole('button',{name:'로그인',exact:true}).click();
 await dialog.getByRole('alert').waitFor();assert.equal(await dialog.count(),1,'A failed login must remain available');
 assert.equal(await dialog.getByLabel('접속 코드',{exact:true}).inputValue(),'','Submitted codes must clear');
 await dialog.getByRole('button',{name:'로그아웃',exact:true}).click();
 await dialog.getByRole('alert').waitFor();assert.equal(await dialog.count(),1,'A failed logout must remain available');
 // Tab wrapping and outside-focus recovery use the real focus handlers.
 const first=dialog.getByRole('button',{name:'닫기',exact:true});await first.focus();await page.keyboard.press('Shift+Tab');
 const lastFocused=await dialog.evaluate(e=>{const active=document.activeElement;const items=[...e.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')].filter(x=>!x.disabled&&x.tabIndex>=0&&x.getClientRects().length);return active===items.at(-1);});
 assert.equal(lastFocused,true,'Shift+Tab must stay in the dialog');await page.keyboard.press('Tab');assert.equal(await first.evaluate(e=>e===document.activeElement),true);
 await page.locator('#outside').focus();assert.equal(await dialog.evaluate(e=>e.contains(document.activeElement)),true,'Programmatic background focus must return inside');
 await page.evaluate(()=>window.fixture.rerender());assert.equal(await dialog.evaluate(e=>e.contains(document.activeElement)),true,'A render must not restore focus behind the dialog');
 await page.keyboard.press('Escape');assert.equal(await dialog.count(),0);assert.equal(await trigger.evaluate(e=>e===document.activeElement),true,'Escape must return focus to the trigger');
 await trigger.click();await dialog.waitFor();await page.locator('.iris-focus-backdrop').click({position:{x:2,y:2}});assert.equal(await dialog.count(),0);
 await trigger.click();await dialog.waitFor();await page.evaluate(()=>{window.fixture.dismissDisabled=true;window.fixture.rerender();});
 await page.waitForFunction(()=>document.querySelector('.iris-focus-dialog-header button')?.disabled);
 await page.keyboard.press('Escape');assert.equal(await dialog.count(),1,'A recheck cannot be dismissed mid-operation');assert.equal(await first.isDisabled(),true);
 await page.evaluate(()=>{window.fixture.dismissDisabled=false;window.fixture.rerender();});
 for(const width of [320,390,768,1280])for(const height of [240,700])for(const font of [18,20,22]){
  await page.setViewportSize({width,height});await page.evaluate(f=>{document.documentElement.style.fontSize=f+'px';},font);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`Horizontal overflow ${width}/${height}/${font}`);
  assert.equal(await dialog.evaluate(e=>{const b=e.getBoundingClientRect();return b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight&&Math.abs((b.top+b.bottom)/2-innerHeight/2)<2;}),true,`Centered dialog bounds ${width}/${height}/${font}`);
 }
 await page.setViewportSize({width:390,height:650});await page.evaluate(()=>{document.documentElement.style.fontSize='18px';window.fixture.failSwitch=false;});
 await other.click();await page.waitForFunction(()=>document.querySelector('#active-account')?.textContent==='열두글자닉네임확인중');assert.equal(await dialog.count(),0,'A successful direct switch must close');
 assert.deepEqual(errors,[]);
 console.log('Account focused DOM PASS: direct choices, failure preservation, duplicate guard, login/logout failures, Escape/backdrop, Tab/focus return, 24 short-window/font layouts; no API/native IO');
}finally{await browser.close();}
