import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {startIrisFixture} from './iris-ui.fixture.mjs';
const {chromium}=createRequire(process.argv[2]??'C:/Users/sungw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json')('playwright');
const entry=`const React=require('react'),{createRoot}=require('react-dom/client'),{DesktopErgon}=require('@/components/iris/DesktopErgon');
window.trial={calls:[],fail:false,pending:[],delay:false};
function App(){const [active,setActive]=React.useState(true),[character,setCharacter]=React.useState('a');window.trial.setActive=setActive;window.trial.switch=()=>setCharacter(c=>c==='a'?'b':'a');
const read=async(kind)=>{window.trial.calls.push(kind);if(window.trial.fail)throw Error('합성 조회 실패');if(window.trial.delay)await new Promise(resolve=>window.trial.pending.push(resolve));const data=kind==='inventory'?{weight:12.5,maxWeight:100}:kind==='works'?{completedCount:1,items:[{name:'목재',facility:'목재 시설',state:'Completed',completed:true,remainingSeconds:0}]}:kind==='materials'?{items:[{name:'통나무',category:'Ingredient',categoryName:'재료',location:'inventory',count:3,locked:false},{name:'통나무',category:'Ingredient',categoryName:'재료',location:'account_storage',count:8,locked:true}]}:{unlocked:true,items:Array.from({length:2048},(_,i)=>({name:i===0?'상급 목재':'긴품목이름가공제작재료목록'+i,available:true,producedPerUnit:3,reason:null,missing:null}))};return {schemaVersion:1,kind,source:'official-cli',observedAt:Date.now(),data};};
return React.createElement('main',{className:'iris-desktop'},React.createElement(DesktopErgon,{key:character,environment:'development',accountId:character,characterId:character,active,locked:false,read,getContextVersion:()=>character==='a'?1:2}));}
createRoot(document.getElementById('app')).render(React.createElement(React.StrictMode,null,React.createElement(App)));`;
const fixture=await startIrisFixture(entry),browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:390,height:850}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(5000);
try{
 await page.goto(fixture.origin);await page.getByRole('button',{name:'가공 목록 조회',exact:true}).click();await page.getByText('가공 2048개',{exact:false}).waitFor();
 await page.waitForTimeout(10500);assert.equal(await page.evaluate(()=>window.trial.calls.filter(kind=>kind==='works').length),0,'planning never starts automatic works reads');
 await page.evaluate(()=>window.trial.delay=true);await page.getByRole('button',{name:'제작 목록 조회',exact:true}).click();await page.evaluate(()=>window.trial.setActive(false));await page.waitForTimeout(30);await page.evaluate(()=>window.trial.setActive(true));await page.evaluate(()=>{window.trial.delay=false;window.trial.pending.splice(0).forEach(resolve=>resolve())});await page.waitForTimeout(100);assert.equal(await page.getByText('제작 2048개',{exact:false}).count(),0,'temporary hidden generation discards late catalog');
 await page.getByRole('button',{name:'가공 목록 조회',exact:true}).click();
 await page.getByLabel('품목 검색',{exact:true}).fill('상급 목재');await page.getByLabel('목표 수량',{exact:true}).fill('20');await page.getByRole('button',{name:'계획에 추가',exact:true}).click();
 await page.getByText('예상 7회 · 날개 35개',{exact:true}).waitFor();assert.equal(await page.getByRole('heading',{name:'내 작업 계획 (1/50)',exact:true}).count(),1);
 await page.reload();await page.getByRole('heading',{name:'내 작업 계획 (1/50)',exact:true}).waitFor();
 await page.evaluate(()=>window.trial.switch());await page.getByRole('heading',{name:'내 작업 계획 (0/50)',exact:true}).waitFor();
 await page.getByRole('button',{name:'재료 확보',exact:true}).click();await page.getByRole('button',{name:'재료 조회',exact:true}).click();await page.getByText('3개 · 잠금 해제',{exact:true}).waitFor();assert.equal(await page.getByText('8개 · 잠김',{exact:true}).count(),0);
 await page.getByLabel('보관 위치').selectOption('account_storage');await page.getByText('8개 · 잠김',{exact:true}).waitFor();
 await page.getByRole('button',{name:'가방 무게 조회',exact:true}).click();await page.getByText('가방 무게 12.5 / 100',{exact:true}).waitFor();
 await page.getByRole('button',{name:'가공 현황 조회',exact:true}).click();await page.getByText('수령 가능',{exact:true}).waitFor();
 await page.evaluate(()=>window.trial.fail=true);await page.getByRole('button',{name:'가공 현황 조회',exact:true}).click();await page.getByRole('alert').filter({hasText:'합성 조회 실패'}).waitFor();const failedCalls=await page.evaluate(()=>window.trial.calls.length);await page.waitForTimeout(10500);assert.equal(await page.evaluate(()=>window.trial.calls.length),failedCalls,'failed connection stops automatic polling');
 await page.evaluate(()=>window.trial.fail=true);await page.getByRole('button',{name:'가방 무게 조회',exact:true}).click();await page.getByRole('alert').filter({hasText:'합성 조회 실패'}).waitFor();assert.ok(await page.getByText('가방 무게 12.5 / 100',{exact:true}).isVisible());
 await page.evaluate(()=>{window.trial.fail=false;window.trial.setActive(false)});const before=await page.evaluate(()=>window.trial.calls.length);await page.waitForTimeout(10500);assert.equal(await page.evaluate(()=>window.trial.calls.length),before);
 await page.evaluate(()=>window.trial.setActive(true));
 for(const width of [320,360,390,720])for(const size of [8,18,29.3333]){await page.setViewportSize({width,height:850});await page.evaluate(size=>document.documentElement.style.fontSize=size+'px',size);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow '+width+'/'+size);}
 await page.screenshot({path:'.superpowers/ergon-read-planning.png',fullPage:false});assert.deepEqual(errors,[]);
 console.log('PASS real ERGON 2048 catalog/search/20 target/ceil/local persistence/account isolation/storage filter/failure preservation/inactive polling/12 width-font layouts');
}finally{await browser.close();await new Promise(resolve=>fixture.server.close(resolve));}
