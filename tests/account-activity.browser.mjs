// Actual ASTRA and shared reporter, synthetic authentication/DB only.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';
import {startIrisFixture} from './iris-ui.fixture.mjs';

const entry=`
const React=require('react'),{createRoot}=require('react-dom/client');
const Astra=require('@/app/lounge/components/AstraView').default;
const Reporter=require('@/components/common/AccountActivityReporter').default;
const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333'];
const names=['가나다라마바사아자차카타','아이리스전용','기록없는계정'];localStorage.setItem('nexus_user',JSON.stringify({nickname:names[0]}));
const now=Date.parse('2026-10-28T12:00:00.000Z');Date.now=()=>now;let viewer=0,available=true,hold=false;const trial=window.trial={writes:[],tracks:[],directoryReads:0,posts:[],held:[],postReplies:[]};
trial.characters=names.map((owner,i)=>({id:i+1,nickname:owner,owner,job:'전사',is_main:true,combat_power:1234567890,magic_resistance:10000,life_energy:100,charm:1,contribution:1,updated_at:new Date(now).toISOString()}));
trial.directory=()=>({viewer:{id:ids[viewer],nickname:names[viewer]},observedAt:new Date(Date.now()).toISOString(),activityAvailable:available,accounts:names.map((nickname,i)=>({id:ids[i],nickname,lastActiveAt:i===2?null:new Date(now-(i===0?3*60000:2*3600000)).toISOString()}))});
window.fetch=async(url,options={})=>{if(url==='/api/account/online')return {ok:true,json:async()=>({enabled:false})};if(url==='/api/accounts/directory'){trial.directoryReads++;const data=trial.directory();if(hold){hold=false;return new Promise(resolve=>trial.held.push(()=>resolve({ok:true,json:async()=>data})));}return {ok:true,json:async()=>data};}if(url==='/api/account/activity'){trial.posts.push(JSON.parse(options.body));if(trial.postHold)return new Promise(resolve=>trial.postReplies.push(()=>resolve({ok:true,json:async()=>({accountId:JSON.parse(options.body).expectedAccountId})})));return {ok:true,json:async()=>({accountId:JSON.parse(options.body).expectedAccountId})};}throw Error('unexpected IO '+url);};
trial.change=(index,wait=false)=>{viewer=index;hold=wait;window.dispatchEvent(new Event('sanctum_account_changed'));};
trial.disable=()=>{available=false;trial.change(viewer);};
trial.recorded=()=>window.dispatchEvent(new Event('sanctum_activity_recorded'));
function App(){const [owner,setOwner]=React.useState(null),[show,setShow]=React.useState(true);trial.reportAs=i=>setOwner(i===null?null:ids[i]);trial.showReporter=setShow;return React.createElement(React.Fragment,null,React.createElement(Astra),show&&React.createElement(Reporter,{accountId:owner}));}
createRoot(document.getElementById('app')).render(React.createElement(App));`;
const fakeDb=`exports.supabase={from(table){const trial=window.trial;const q={select(){return q;},order(){return q;},neq(){return q;},update(value){trial.writes.push({table,value});return q;},eq(){return q;},then(resolve){return Promise.resolve({data:table==='characters'?trial.characters:[],error:null}).then(resolve);}};return q;},channel(name,options){const trial=window.trial;let sync;const c={on(_a,_b,fn){sync=fn;return c;},subscribe(fn){Promise.resolve().then(()=>{fn('SUBSCRIBED');sync();});return c;},presenceState(){return {'가나다라마바사아자차카타':[{}]};},track(value){trial.tracks.push({key:options.config.presence.key,value});return Promise.resolve();}};return c;},removeChannel(){}};`;
const replacements={'../../../lib/supabase':fakeDb,'../../../lib/memberMutationClient':"exports.updateOwnedCharacter=async(...args)=>window.trial.writes.push(args);",'../../../lib/matchingUtils':"exports.isTaskChecked=()=>false;",'@/lib/memberMutationClient':"exports.memberMutationOrThrow=async(...args)=>window.trial.writes.push(args);",'next/navigation':"exports.useRouter=()=>({push(){}});",'@/components/common/ClassIcon':"module.exports=()=>require('react').createElement('span',null,'직업');"};
if(process.argv.includes('--baseline'))replacements['@/app/lounge/components/AstraView']=ts.transpileModule(execFileSync('git',['show','HEAD:app/lounge/components/AstraView.tsx'],{encoding:'utf8'}),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const fixture=await startIrisFixture(entry,replacements);
// Match the existing browser fixtures: the caller supplies its local runtime.
const {chromium}=createRequire(process.argv[2])('playwright');
const browser=await chromium.launch({channel:'chrome',headless:true}),page=await browser.newPage({viewport:{width:1280,height:950}}),errors=[];
page.on('pageerror',error=>errors.push(error.message));page.setDefaultTimeout(8000);
try{
 await page.goto(fixture.origin);
 await page.getByText('최근 활동 3분 전',{exact:true}).waitFor();await page.getByText('최근 활동 2시간 전',{exact:true}).waitFor();await page.getByText('기록 없음',{exact:true}).waitFor();
 assert.deepEqual(await page.evaluate(()=>window.trial.writes),[],'ASTRA must not mutate character timestamps');
 assert.equal(await page.getByText('웹 ASTRA 연결',{exact:true}).count(),1);
 await page.getByRole('button',{name:/세부 검색/}).click();await page.getByRole('button',{name:'🟢 ASTRA 연결만',exact:true}).click();assert.equal(await page.getByText('최근 활동 2시간 전',{exact:true}).count(),0);
 await page.getByRole('button',{name:'🟢 ASTRA 연결만',exact:true}).click();
 const search=page.getByPlaceholder('계정/캐릭터/클래스 검색...').first();await search.fill('아이리스전용');await page.getByText('최근 활동 2시간 전',{exact:true}).waitFor();await search.fill('');
 const reads=await page.evaluate(()=>window.trial.directoryReads);await page.evaluate(()=>window.trial.recorded());await page.waitForFunction(n=>window.trial.directoryReads>n,reads);
 await page.evaluate(()=>window.trial.change(0,true));await page.waitForFunction(()=>window.trial.held.length===1);await page.evaluate(()=>window.trial.change(1));await page.waitForFunction(()=>window.trial.tracks.at(-1)?.key==='아이리스전용');
 await page.evaluate(()=>window.trial.change(0));await page.waitForFunction(()=>window.trial.tracks.at(-1)?.key==='가나다라마바사아자차카타');await page.evaluate(()=>window.trial.held.shift()());assert.equal(await page.evaluate(()=>window.trial.tracks.at(-1).key),'가나다라마바사아자차카타');
 for(const width of [320,390,768,1280])for(const font of [18,20,22]){await page.setViewportSize({width,height:950});await page.evaluate(f=>document.documentElement.style.fontSize=f+'px',font);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+'/'+font);const badge=page.getByText('최근 활동 3분 전',{exact:true});assert.ok(await badge.evaluate(e=>parseFloat(getComputedStyle(e).fontSize)>=12));}
 await page.setViewportSize({width:390,height:950});await page.screenshot({path:'.superpowers/astra-20261028/astra-390.png',fullPage:true});await page.setViewportSize({width:1280,height:950});await page.screenshot({path:'.superpowers/astra-20261028/astra-1280.png',fullPage:true});
 await page.evaluate(()=>window.trial.disable());await page.getByText('활동 기록 준비 중',{exact:true}).first().waitFor();
 // Component mount/foreground uses the same authenticated boundary in both clients.
 await page.evaluate(()=>{window.trial.postHold=true;Object.defineProperty(document,'hasFocus',{configurable:true,value:()=>false});window.trial.reportAs(0);});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));assert.equal(await page.evaluate(()=>window.trial.posts.length),0);
 await page.evaluate(()=>{Object.defineProperty(document,'hasFocus',{configurable:true,value:()=>true});window.dispatchEvent(new Event('focus'));});await page.waitForFunction(()=>window.trial.posts.length===1);
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));assert.equal(await page.evaluate(()=>window.trial.posts.length),1);
 const beforeAck=await page.evaluate(()=>window.trial.directoryReads);await page.evaluate(()=>window.trial.reportAs(1));await page.waitForFunction(()=>window.trial.posts.length===2);await page.evaluate(()=>window.trial.postReplies[0]());await page.evaluate(()=>new Promise(r=>requestAnimationFrame(r)));assert.equal(await page.evaluate(()=>window.trial.directoryReads),beforeAck,'stale A ACK must not publish activity');await page.evaluate(()=>window.trial.postReplies[1]());await page.waitForFunction(n=>window.trial.directoryReads===n+1,beforeAck);
 await page.evaluate(()=>{window.trial.postHold=false;const time=Date.now()+1200001;Date.now=()=>time;window.dispatchEvent(new StorageEvent('storage',{key:'nexus_user',newValue:'untrusted hint only'}));window.dispatchEvent(new Event('focus'));});await page.waitForFunction(()=>window.trial.posts.length===3);
 assert.equal(await page.evaluate(()=>window.trial.posts.at(-1).expectedAccountId),'22222222-2222-4222-8222-222222222222');
 await page.evaluate(()=>window.trial.showReporter(false));const posts=await page.evaluate(()=>window.trial.posts.length);await page.evaluate(()=>window.dispatchEvent(new Event('focus')));assert.equal(await page.evaluate(()=>window.trial.posts.length),posts);
 assert.deepEqual(errors,[]);console.log('PASS actual ASTRA/reporter: unified activity, no character writes, presence/search, ABA/late response, disabled flag, 12 widths/fonts, focused input/dedup/unmount; synthetic IO only');
}finally{await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
