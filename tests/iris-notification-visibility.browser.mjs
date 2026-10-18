import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startIrisFixture} from './iris-ui.fixture.mjs';
const {chromium}=createRequire('C:/Users/Moon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json')('playwright');

// Exercise the real provider/queue/renderer; only the OS visibility signal and clock are controlled.
const entry=`
const React=require('react'),{createRoot}=require('react-dom/client');
const {IrisNotificationsProvider,DesktopNotificationLayer,useIrisNotifications}=require('@/components/iris/useIrisNotifications');
function Sources(){const api=useIrisNotifications();React.useEffect(()=>{window.enqueue=key=>api.push({key,scope:'a',title:key,message:'새 제보',createdAt:Date.now(),expiresAt:null,sound:true},async()=>{window.sounds=(window.sounds||0)+1;});},[api]);return null;}
function App(){const [windowVisible,setVisible]=React.useState(true);window.nativeVisibility=setVisible;return React.createElement(IrisNotificationsProvider,{scope:'a',floating:{mode:'normal',windowVisible},onNoticeKind:async()=>{}},React.createElement(Sources),React.createElement(DesktopNotificationLayer));}
createRoot(document.getElementById('app')).render(React.createElement(App));`;
const fixture=await startIrisFixture(entry),browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();await page.goto(fixture.origin);await page.waitForFunction(()=>!!window.enqueue);
 const visibility=async state=>page.evaluate(value=>{Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>value});document.dispatchEvent(new Event('visibilitychange'));},state);
 await visibility('hidden');await page.evaluate(()=>window.enqueue('document-hidden'));await page.clock.runFor(15000);
 assert.equal(await page.getByRole('status').count(),0,'hidden document must not consume a new notice');
 assert.equal(await page.evaluate(()=>window.sounds||0),0,'hidden arrivals must not play before presentation');
 await visibility('visible');await page.clock.runFor(100);
 assert.equal(await page.getByRole('status',{name:'document-hidden'}).count(),1);
 assert(Number(await page.getByRole('progressbar').getAttribute('value'))>=9900,'first visible presentation starts a full 10s');
 await page.clock.runFor(4000);await visibility('hidden');await page.clock.runFor(6100);await visibility('visible');await page.clock.runFor(100);
 assert.equal(await page.getByRole('status').count(),0,'already presented notice keeps original deadline while hidden');
 await page.evaluate(()=>window.nativeVisibility(false));await page.clock.runFor(100);await page.evaluate(()=>window.enqueue('native-hidden'));await page.clock.runFor(15000);
 assert.equal(await page.getByRole('status').count(),0,'native hidden state must block presentation even if the document stays visible');
 assert.equal(await page.evaluate(()=>window.sounds),1);
 await page.evaluate(()=>window.nativeVisibility(true));await page.clock.runFor(100);
 assert.equal(await page.getByRole('status',{name:'native-hidden'}).count(),1);
 assert(Number(await page.getByRole('progressbar').getAttribute('value'))>=9900);
 assert.equal(await page.evaluate(()=>window.sounds),2);
 await page.clock.runFor(10100);assert.equal(await page.getByRole('status').count(),0);
 assert.deepEqual(errors,[]);console.log('PASS hidden arrivals wait for first presentation; shown deadlines survive document/native hiding');
}finally{await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
