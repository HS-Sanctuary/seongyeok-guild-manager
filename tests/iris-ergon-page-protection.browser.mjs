// Actual page handlers, synthetic controller/native IO, real result input panel.
import assert from 'node:assert/strict';import {createRequire} from 'node:module';
import {startIrisFixture} from './iris-ui.fixture.mjs';import {entry as source} from './iris-ergon-progress-ui.fixture.mjs';
const entry=source.slice(0,source.indexOf('function App()'))+`
window.testApi=api;window.trial.transitions=[];window.__irisDesktopBridge={epoch:1,environment:'development'};window.chrome={webview:{}};
window.testState={account:{id:'a',nickname:'合成',role:'길드원'},selected:{accountId:'a',characterId:'c',details:{classes:[],tasks:{}}},characters:[{id:'c',nickname:'합성',job:'힐러'}],charactersLoaded:true,queue:{entries:[]},locked:false,classDrafts:{}};
const Page=require('@/app/iris/desktop/page').default;createRoot(document.getElementById('app')).render(React.createElement(Page));`;
const replacements={
 '@/components/iris/useDesktopFloating':'exports.useDesktopFloating=()=>({state:null,supported:false,busy:false,setNotice:()=>{}});',
 '@/components/iris/useDesktopPresentation':'exports.useDesktopPresentation=()=>({state:null,busy:false});',
 'next/navigation':'exports.useRouter=()=>({push:()=>{}});exports.usePathname=()=>"/iris/desktop";',
 '@/lib/supabase':'exports.supabase={};',
 '@/components/iris/useDesktopContentAlerts':'exports.useDesktopContentAlerts=()=>({items:[],reports:[],deep:[],enabled:false});',
 '@/components/iris/DesktopContentAlerts':'exports.DesktopContentAlerts=()=>null;exports.DesktopContentAlertModal=()=>null;',
 '@/lib/irisDesktopTransport':'exports.createDesktopTransport=()=>({});',
 '@/lib/irisFeatureAvailability':'exports.IRIS_ERGON_AVAILABLE=true;',
 '@/lib/irisDesktopController':`exports.createDesktopController=()=>({state:()=>window.testState,start:async()=>{},tick:async()=>{},refresh:async()=>{},selectCharacter:async()=>window.trial.transitions.push('character'),switchAccount:async()=>window.trial.transitions.push('account'),logout:async()=>window.trial.transitions.push('logout'),shutdown:async()=>window.trial.transitions.push('shutdown')});`,
 '@/lib/irisDesktopStore':`exports.parseDesktopWindowEvent=()=>null;exports.createDesktopStore=()=>({...window.testApi,workspaceCapabilities:async()=>({}),addonState:async()=>{throw Error('unused');},setOpacityPercent:async()=>{},loadCurrencyCache:async()=>null});`,
 '@/components/iris/DesktopCenter':`const React=require('react');exports.DesktopCenter=p=>{window.trial.select=()=>p.onSelectCharacter('other');window.trial.account=()=>p.contextActions.props.onAccount();return p.ergonPanel(true);};`,
 '@/components/iris/DesktopErgon':`const React=require('react'),{DesktopErgonResultConfirmation}=require('@/components/iris/DesktopErgonResultConfirmation');exports.DesktopErgon=p=>{const notify=React.useCallback(d=>{p.onProgressDirtyChange(d);window.trial.resultDirty=d;},[p.onProgressDirtyChange]);return React.createElement(DesktopErgonResultConfirmation,{api:p.actions,scope:{environment:p.environment,accountId:p.accountId,characterId:p.characterId},active:p.active,locked:p.locked,onDirtyChange:notify});};`,
 '@/components/iris/DesktopStatsSession':`exports.DesktopStatsSession=p=>p.children({suggestion:null,onCharactersRead:()=>{}});`,
 '@/components/iris/DesktopTitlebar':`exports.DesktopTitlebar=p=>{window.trial.close=p.onClose;return p.updateControl;};`,
 '@/components/iris/DesktopUpdater':`exports.DesktopUpdater=p=>{window.trial.apply=p.onBeforeApply;return null;};`,
 '@/components/iris/DesktopAccountPanel':`exports.DesktopAccountPanel=p=>{window.trial.logout=p.onLogout;window.trial.switch=()=>p.onSwitch('b');window.trial.dismiss=p.onClose;return null;};`,
};
const {chromium}=createRequire(process.argv[2])('playwright'),fixture=await startIrisFixture(entry,replacements),browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage();page.setDefaultTimeout(5000);
page.on('pageerror',e=>console.error(e.message));
try{
 await page.goto(fixture.origin);const input=page.getByLabel('실제로 확인한 추가 확보 수량',{exact:true});await input.fill('3');
 await page.evaluate(()=>window.trial.select());assert.deepEqual(await page.evaluate(()=>window.trial.transitions),[],'dirty character transition must be blocked');assert.equal(await input.inputValue(),'3');
 await page.evaluate(()=>window.trial.close());assert.equal(await page.getByRole('dialog',{name:/종료/}).count(),0);
 assert.equal(await page.evaluate(()=>window.trial.apply()),false,'updater must not discard result');
 await page.evaluate(()=>window.trial.account());await page.waitForFunction(()=>!!window.trial.logout);await page.evaluate(()=>window.trial.logout());await page.evaluate(()=>window.trial.switch());assert.deepEqual(await page.evaluate(()=>window.trial.transitions),[]);
 assert.equal(await page.evaluate(()=>{const e=new Event('beforeunload',{cancelable:true});window.dispatchEvent(e);return e.defaultPrevented;}),true);
 await page.goto(fixture.origin);await page.getByLabel('실제로 확인한 추가 확보 수량',{exact:true}).fill('3');await page.evaluate(()=>window.trial.lose=true);await page.getByRole('button',{name:'확인 수량 저장',exact:true}).click();await page.getByText(/저장 응답을 확인하지 못했어요/).waitFor();
 await page.evaluate(()=>window.trial.select());assert.deepEqual(await page.evaluate(()=>window.trial.transitions),[],'lost ACK blocks context change');assert.equal(await page.evaluate(()=>window.trial.apply()),false);
 await page.evaluate(()=>window.trial.account());await page.waitForFunction(()=>!!window.trial.dismiss);await page.evaluate(()=>window.trial.dismiss());await page.getByRole('button',{name:'저장 상태 확인',exact:true}).click();await page.getByText('목표 4개 · 확인 3개 · 남은 1개',{exact:true}).waitFor();await page.waitForFunction(()=>window.trial.resultDirty===false);await page.evaluate(()=>window.trial.select());assert.deepEqual(await page.evaluate(()=>window.trial.transitions),['character']);
 console.log('PASS actual page rejects dirty character/account/logout/close/update; beforeunload protects results independently');
}finally{await browser.close();await new Promise(r=>fixture.server.close(r));}
