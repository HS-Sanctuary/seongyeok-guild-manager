import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
import ts from 'typescript';
import {startIrisFixture} from './iris-ui.fixture.mjs';
const entry=String.raw`
const React=require('react'),{createRoot}=require('react-dom/client');
const Astra=require('@/app/lounge/components/AstraView').default;
const Reporter=require('@/components/common/AccountOnlineReporter').default;
const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333'];
const names=['가나다라마바사아자차카타','아이리스전용','기록없는계정'];
let mono=0;Object.defineProperty(performance,'now',{configurable:true,value:()=>mono});let offset=0;let viewer=0,clock=Date.parse('2026-10-28T12:00:00.000Z'),activityEnabled=true,enabled=true,offline=false,hold=false;const initial=clock;Date.now=()=>clock+offset;
const timer=window.setInterval.bind(window),timers=[];window.setInterval=(fn,ms)=>{timers.push({fn,ms});return timer(fn,ms);};
const trial=window.trial={posts:[],writes:[],tracks:[],onlineReads:0,held:[]};
trial.characters=names.map((owner,i)=>({id:i+1,nickname:owner,owner,job:'전사',is_main:true,combat_power:1234567890,magic_resistance:10000,life_energy:100,charm:1,contribution:1}));
const directory=()=>({viewer:{id:ids[viewer],nickname:names[viewer]},observedAt:new Date(clock).toISOString(),activityAvailable:activityEnabled,accounts:names.map((nickname,i)=>({id:ids[i],nickname,lastActiveAt:i===2?null:new Date(initial-(i===0?180000:7200000)).toISOString()}))});
const snapshot=()=>({enabled:true,viewerId:ids[viewer],observedAt:new Date(initial).toISOString(),accounts:ids.slice(0,2).map(accountId=>({accountId,expiresAt:new Date(initial+720000).toISOString()}))});
window.fetch=async(url,options={})=>{
 if(url==='/api/accounts/directory')return {ok:true,json:async()=>directory()};
 if(url==='/api/account/online'){
  if(options.method==='POST'){const c=JSON.parse(options.body);trial.posts.push(c);return {ok:true,json:async()=>({accountId:c.expectedAccountId,enabled:true})};}
  trial.onlineReads++;const data=enabled?snapshot():{enabled:false};if(offline)throw Error('offline');if(hold){hold=false;return new Promise(resolve=>trial.held.push(()=>resolve({ok:true,json:async()=>data})));}return {ok:true,json:async()=>data};
 }
 throw Error('unexpected IO '+url);
};
trial.tick=(elapsed=0)=>{clock+=elapsed;mono+=elapsed;timers.filter(t=>t.ms===60000).forEach(t=>t.fn());};
trial.change=(i,wait=false)=>{viewer=i;hold=wait;window.dispatchEvent(new Event('sanctum_account_changed'));};
trial.offline=()=>{mono+=60001;offline=true;window.dispatchEvent(new Event('online'));};
trial.legacy=()=>{mono+=60001;offline=false;enabled=false;window.dispatchEvent(new Event('online'));};
trial.activityOff=()=>{activityEnabled=false;trial.change(viewer);};trial.resume=()=>window.dispatchEvent(new Event('focus'));trial.skew=(amount)=>{offset=amount;window.dispatchEvent(new Event('focus'));};
function App(){const [account,setAccount]=React.useState(null),[show,setShow]=React.useState(true);trial.reportAs=i=>setAccount(i===null?null:ids[i]);trial.showReporter=setShow;return React.createElement(React.Fragment,null,React.createElement(Astra),show&&React.createElement(Reporter,{accountId:account}));}
createRoot(document.getElementById('app')).render(React.createElement(App));
`;
const fakeDb=String.raw`exports.supabase={from(table){const q={select(){return q;},order(){return q;},neq(){return q;},then(resolve){return Promise.resolve({data:table==='characters'?window.trial.characters:[],error:null}).then(resolve);}};return q;},channel(name,options){const c={on(){return c;},subscribe(fn){Promise.resolve().then(()=>fn('SUBSCRIBED'));return c;},presenceState(){return {'forged-owner':[{}]};},track(value){window.trial.tracks.push({key:options.config.presence.key,value});return Promise.resolve();}};return c;},removeChannel(){}};`;
const replacements={'../../../lib/supabase':fakeDb,'../../../lib/matchingUtils':"exports.isTaskChecked=()=>false;",'next/navigation':"exports.useRouter=()=>({push(){}});",'@/components/common/ClassIcon':"module.exports=()=>require('react').createElement('span',null,'직업');"};
if(process.argv.includes('--baseline'))replacements['@/app/lounge/components/AstraView']=ts.transpileModule(execFileSync('git',['show','HEAD:app/lounge/components/AstraView.tsx'],{encoding:'utf8'}),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const fixture=await startIrisFixture(entry,replacements),{chromium}=createRequire(process.argv[2])('playwright'),browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:390,height:950}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(8000);
try{
 await page.goto(fixture.origin);
 await page.getByText('🟢 온라인 2명',{exact:true}).waitFor();
 assert.equal(await page.getByText('온라인',{exact:true}).count(),2,'web and IRIS are online in same cards');
 assert.deepEqual(await page.evaluate(()=>window.trial.tracks),[],'unverified Presence must not authenticate integrated online');
 const firstReads=await page.evaluate(()=>window.trial.onlineReads);for(let i=0;i<12;i++)await page.evaluate(()=>{window.trial.resume();return new Promise(requestAnimationFrame);});assert.equal(await page.evaluate(()=>window.trial.onlineReads),firstReads,'focus must not bypass minimum read interval');
 await page.evaluate(()=>window.trial.skew(86400000));await page.getByText('🟢 온라인 2명',{exact:true}).waitFor();assert.equal(await page.getByText('온라인',{exact:true}).count(),2);await page.evaluate(()=>window.trial.skew(0));
 await page.getByRole('button',{name:/세부 검색/}).click();await page.getByRole('button',{name:'🟢 온라인만',exact:true}).click();
 assert.equal(await page.getByText('기록 없음',{exact:true}).count(),0);await page.getByText('최근 활동 2시간 전',{exact:true}).waitFor();
 await page.getByRole('button',{name:'🟢 온라인만',exact:true}).click();
 for(const width of [320,390,768,1280])for(const font of [18,20,22]){await page.setViewportSize({width,height:950});await page.evaluate(f=>document.documentElement.style.fontSize=f+'px',font);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+'/'+font);}
 await page.setViewportSize({width:390,height:950});await page.screenshot({path:'.superpowers/astra-online/astra-390.png',fullPage:true});
 await page.evaluate(()=>window.trial.change(0,true));await page.waitForFunction(()=>window.trial.held.length===1);
 await page.evaluate(()=>window.trial.change(1));await page.getByText('🟢 온라인 2명',{exact:true}).waitFor();
 await page.evaluate(()=>window.trial.change(0));await page.getByText('🟢 온라인 2명',{exact:true}).waitFor();
 await page.evaluate(()=>window.trial.held.shift()());await page.getByText('🟢 온라인 2명',{exact:true}).waitFor();
 await page.evaluate(()=>window.trial.activityOff());await page.getByText('활동 기록 준비 중',{exact:true}).first().waitFor();await page.getByText('🟢 온라인 2명',{exact:true}).waitFor();
 await page.evaluate(()=>window.trial.offline());await page.getByText('🟢 온라인 확인 불가',{exact:true}).waitFor();assert.equal(await page.getByText('온라인',{exact:true}).count(),0);
 await page.evaluate(()=>window.trial.legacy());await page.getByText('🟢 웹 ASTRA 연결 0명',{exact:true}).waitFor();
 // Reporter runs with no focus and never touches the activity route.
 await page.evaluate(()=>{Object.defineProperty(document,'hasFocus',{configurable:true,value:()=>false});window.trial.reportAs(0);});await page.waitForFunction(()=>window.trial.posts.some(p=>p.action==='touch'));
 const posts=await page.evaluate(()=>window.trial.posts.length);await page.evaluate(()=>window.trial.resume());assert.equal(await page.evaluate(()=>window.trial.posts.length),posts);
 await page.evaluate(()=>window.trial.reportAs(1));await page.waitForFunction(()=>window.trial.posts.at(-1)?.expectedAccountId==='22222222-2222-4222-8222-222222222222');
 assert.ok(await page.evaluate(()=>window.trial.posts.some(p=>p.action==='leave'&&p.expectedAccountId==='11111111-1111-4111-8111-111111111111')));
 await page.evaluate(()=>window.trial.showReporter(false));await page.waitForFunction(()=>window.trial.posts.at(-1)?.action==='leave');
 assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>window.trial.writes),[]);
 console.log('PASS actual ASTRA+online reporter: integrated count/filter/cards, no activity writes, legacy/unknown, ABA/late ACK, no-focus heartbeat, leave and 12 width/font cases; synthetic IO');
}catch(error){writeFileSync('.superpowers/astra-online-night/react-online-failure.txt',await page.locator('body').innerText());throw error;}
finally{await browser.close();await new Promise(r=>fixture.server.close(r));}
